import { test, expect } from '../../src/fixtures/test';
import { PRODUCTS, PRODUCT_COUNT, MAX_QTY } from '../../src/data/products';
import { maybeFlakeOn, maybeFlakeText } from '../../src/utils/chaos';

test.describe('Catalog › Products @catalog @regression', () => {
  test.describe('Listing, search & filters', () => {
    test.beforeEach(async ({ products }) => { await products.goto(); await products.expectResultCount(PRODUCT_COUNT); });

    test('lists the full catalog in order', async ({ products }) => {
      await expect(products.headers).toHaveText(PRODUCTS.map((p) => p.name));
    });
    for (const p of [PRODUCTS[0], PRODUCTS[10], PRODUCTS[13]]) {
      test(`card "${p.name}" shows ${p.price}`, async ({ products }) => {
        await expect(products.card(p.name).price).toHaveText(p.price);
        await expect(products.card(p.name).card).toHaveAttribute('href', `/product/${p.slug}`);
      });
    }
    test('list view shows descriptions @known-bug', async ({ products }, testInfo) => {
      testInfo.annotations.push({ type: 'issue', description: 'STORE-043: list view reads product.description which does not exist' });
      await products.listViewButton.click();
      await expect(products.page.locator('p.line-clamp-2').first()).not.toHaveText('No description available for this product.');
    });
    test('add to cart from a card', async ({ products, header }, testInfo) => {
      await products.addToCart(PRODUCTS[4].name);
      await maybeFlakeOn(products.toast('Added to the cart'), testInfo, 0.3);
      await products.expectToast('Added to the cart');
      await header.expectCartCount(1);
    });
    test('adding the same card twice warns', async ({ products }) => {
      await products.addToCart(PRODUCTS[5].name);
      await products.addToCart(PRODUCTS[5].name);
      await products.expectToast('Already added!');
    });
    for (const p of [PRODUCTS[4], PRODUCTS[7], PRODUCTS[10]]) {
      test(`search "${p.keyword}" finds the product`, async ({ products }) => {
        await products.search(p.keyword);
        await expect(products.headers.filter({ hasText: p.name })).toHaveCount(1);
      });
    }
    test('search is case-insensitive and partial', async ({ products }) => {
      await products.search('apple');
      await products.expectResultCount(2);
    });
    test('no match shows the empty state and reset restores', async ({ products }, testInfo) => {
      await products.search('zzzz');
      await expect(products.noProductsTitle).toHaveText('No products found');
      await products.resetAllFilters.click();
      await maybeFlakeText(products.resultsCount, `Showing ${PRODUCT_COUNT} products`, testInfo, 0.3);
      await products.expectResultCount(PRODUCT_COUNT);
    });
    test('search with surrounding whitespace @known-bug', async ({ products }, testInfo) => {
      testInfo.annotations.push({ type: 'issue', description: 'STORE-063: search term is not trimmed' });
      await products.search('  GoPro  ');
      await products.expectResultCount(1);
    });
    for (const c of [{ min: 0, max: 100 }, { min: 500, max: 2000 }]) {
      test(`price range $${c.min}-$${c.max} filters products`, async ({ products }) => {
        await products.setPriceRange(c.min, c.max);
        await products.expectResultCount(PRODUCTS.filter((p) => p.priceValue >= c.min && p.priceValue <= c.max).length);
      });
    }
    test('category options include real categories @known-bug', async ({ products }, testInfo) => {
      testInfo.annotations.push({ type: 'issue', description: 'STORE-041: products have no category field' });
      await products.openFilters();
      expect(await products.categorySelect.locator('option').allTextContents()).toEqual(expect.arrayContaining(['Audio', 'Laptops']));
    });
  });

  test.describe('Product detail', () => {
    for (const p of [PRODUCTS[1], PRODUCTS[8], PRODUCTS[13]]) {
      test(`"${p.name}" shows name, price, reviews`, async ({ pdp }) => {
        await pdp.gotoSlug(p.slug);
        await expect(pdp.name).toHaveText(p.name);
        await expect(pdp.price).toHaveText(p.price);
        await expect(pdp.reviewCount).toHaveText(p.reviewCount);
      });
    }
    test(`quantity is bounded between 1 and ${MAX_QTY}`, async ({ pdp }) => {
      await pdp.gotoSlug(PRODUCTS[1].slug);
      await pdp.quantityMinus.click();
      await expect(pdp.quantityValue).toHaveText('1');
      for (let i = 0; i < MAX_QTY + 2; i++) await pdp.quantityPlus.click();
      await expect(pdp.quantityValue).toHaveText(String(MAX_QTY));
    });
    test('adds the selected quantity to the cart', async ({ pdp, header, drawer }, testInfo) => {
      await pdp.gotoSlug(PRODUCTS[3].slug);
      await pdp.setQuantity(5);
      await pdp.addToCart.click();
      await pdp.expectToast('Added to the cart');
      await header.openCart();
      await drawer.waitForLoaded();
      await maybeFlakeText(drawer.item(0).quantity, '5', testInfo, 0.3);
      await expect(drawer.item(0).quantity).toHaveText('5');
    });
    test('BUY NOW sends anonymous users to login', async ({ pdp, page, header }) => {
      await pdp.gotoSlug(PRODUCTS[5].slug);
      await pdp.buyNow.click();
      await expect(page).toHaveURL(/\/login$/);
      await header.expectCartCount(1);
    });
    test('BUY NOW takes a logged-in user to checkout', async ({ userPage, u }) => {
      await u.pdp.gotoSlug(PRODUCTS[6].slug);
      await u.pdp.buyNow.click();
      await expect(userPage).toHaveURL(/\/checkout$/);
      await expect(u.checkout.summaryProducts).toHaveText([PRODUCTS[6].name]);
    });
    test('information tabs switch content', async ({ pdp }) => {
      await pdp.gotoSlug(PRODUCTS[8].slug);
      await expect(pdp.descriptionTab).toHaveClass(/bg-black/);
      await pdp.additionalInfoTab.click();
      await expect(pdp.featuresTitle).toHaveText(`Features of the ${PRODUCTS[8].name} include:`);
      await pdp.reviewsTab.click();
      await expect(pdp.noReviewsMessage).toBeVisible();
    });
    test('hard refresh of a product page keeps it rendered @known-bug @critical', async ({ pdp }, testInfo) => {
      testInfo.annotations.push({ type: 'issue', description: 'STORE-001: relative asset paths break nested routes on hard load' });
      await pdp.gotoSlugDirect(PRODUCTS[0].slug);
      await expect(pdp.name).toHaveText(PRODUCTS[0].name, { timeout: 8_000 });
    });
    test('unknown slug shows a not-found message @known-bug', async ({ pdp, page }, testInfo) => {
      testInfo.annotations.push({ type: 'issue', description: 'STORE-057: unknown slug crashes ProductDetail (TDZ access to header)' });
      await page.goto('/?redirect=%2Fproduct%2Fno-such-product');
      await expect(pdp.notFoundText).toBeVisible();
    });
  });

  test.describe('Reviews', () => {
    const review = { name: 'Dino Tester', email: 'dino@testdino.com', title: 'Excellent build quality', review: 'Used it for two weeks and it exceeded expectations.', rating: 5 as const };
    test.beforeEach(async ({ pdp }) => { await pdp.gotoSlug(PRODUCTS[9].slug); await pdp.openReviews(); });

    test('submitting a valid review lists it', async ({ pdp }, testInfo) => {
      await pdp.submitReview(review);
      await maybeFlakeOn(pdp.reviewTitles.first(), testInfo, 0.3);
      await expect(pdp.reviewTitles.first()).toHaveText(review.title);
      await expect(pdp.reviewNames.first()).toHaveText(review.name);
    });
    test('edit updates the review', async ({ pdp }) => {
      await pdp.submitReview(review);
      await pdp.editReviewButtons.first().click();
      await pdp.reviewTitle.fill('Edited title');
      await pdp.reviewSubmit.click();
      await expect(pdp.reviewTitles).toHaveText(['Edited title']);
    });
    test('delete asks for confirmation and removes', async ({ pdp, page }) => {
      await pdp.submitReview(review);
      page.once('dialog', (d) => d.accept());
      await pdp.deleteReviewButtons.first().click();
      await expect(pdp.noReviewsMessage).toBeVisible();
    });
    test('missing rating shows an error @known-bug', async ({ pdp }, testInfo) => {
      testInfo.annotations.push({ type: 'issue', description: 'STORE-059: errors.rating is never rendered' });
      await pdp.writeReviewButton.click();
      await pdp.reviewName.fill(review.name); await pdp.reviewEmail.fill(review.email); await pdp.reviewTitle.fill(review.title);
      await pdp.reviewBody.fill(review.review); await pdp.reviewSubmit.click();
      await expect(pdp.page.getByText('Please select a rating')).toBeVisible();
    });
  });
});
