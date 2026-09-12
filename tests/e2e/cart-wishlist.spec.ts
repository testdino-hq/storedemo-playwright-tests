import { test, expect } from '../../src/fixtures/test';
import { PRODUCTS, MAX_QTY, formatPrice } from '../../src/data/products';
import { seedCart, seedWishlist } from '../../src/utils/helpers';
import { maybeFlakeOn, maybeFlakeText } from '../../src/utils/chaos';

test.describe('Cart @cart @regression', () => {
  test.describe('Drawer', () => {
    test.beforeEach(async ({ page, home }) => {
      await seedCart(page, [{ product: PRODUCTS[0], quantity: 1 }, { product: PRODUCTS[1], quantity: 2 }]);
      await home.goto();
    });
    test('empty drawer shows Start Shopping', async ({ page, header, drawer }) => {
      await page.evaluate(() => localStorage.removeItem('cartItems'));
      await page.reload();
      await header.openCart();
      await drawer.waitForLoaded();
      await expect(drawer.emptyState).toContainText('Your cart is empty');
      await drawer.continueShopping.click();
      await expect(page).toHaveURL(/\/products$/);
    });
    test('lists items with totals and free shipping', async ({ header, drawer }, testInfo) => {
      await header.expectCartCount(2);
      await header.openCart();
      await drawer.waitForLoaded();
      const expected = formatPrice(PRODUCTS[0].priceValue + PRODUCTS[1].priceValue * 2);
      await maybeFlakeText(drawer.total, expected, testInfo, 0.3);
      await expect(drawer.items).toHaveCount(2);
      await expect(drawer.total).toHaveText(expected);
      await expect(drawer.shipping).toHaveText('Free');
    });
    test('increase and decrease update quantities', async ({ header, drawer }) => {
      await header.openCart();
      await drawer.waitForLoaded();
      await drawer.item(0).increase.click();
      await expect(drawer.item(0).quantity).toHaveText('2');
      await drawer.item(1).decrease.click();
      await expect(drawer.item(1).quantity).toHaveText('1');
    });
    test(`limit of ${MAX_QTY} shows a toast`, async ({ header, drawer }) => {
      await header.openCart();
      await drawer.waitForLoaded();
      for (let i = 1; i < MAX_QTY; i++) { await drawer.item(0).increase.click(); await expect(drawer.item(0).quantity).toHaveText(String(i + 1)); }
      await drawer.item(0).increase.click();
      await drawer.expectToast('Maximum quantity limit reached (9)');
    });
    test('remove deletes the line', async ({ header, drawer }, testInfo) => {
      await header.openCart();
      await drawer.waitForLoaded();
      await drawer.item(0).remove.click();
      await maybeFlakeOn(drawer.toast('Removed from cart'), testInfo, 0.3);
      await expect(drawer.items).toHaveCount(1);
      await header.expectCartCount(1);
    });
  });

  test.describe('Cart page', () => {
    test('empty cart shows Continue Shopping', async ({ cart, page }) => {
      await cart.goto();
      await expect(cart.emptyTitle).toHaveText('Your cart is empty');
      await cart.continueShopping.click();
      await expect(page).toHaveURL(/\/products$/);
    });
    test.describe('with items', () => {
      test.beforeEach(async ({ page, cart }) => {
        await seedCart(page, [{ product: PRODUCTS[10], quantity: 1 }, { product: PRODUCTS[3], quantity: 3 }]);
        await cart.goto();
      });
      test('rows show price, quantity and subtotal', async ({ cart }) => {
        await expect(cart.rows).toHaveCount(2);
        await expect(cart.row(PRODUCTS[3].name).subtotal).toHaveText(formatPrice(PRODUCTS[3].priceValue * 3));
        await expect(cart.summaryTotal).toHaveText(formatPrice(PRODUCTS[10].priceValue + PRODUCTS[3].priceValue * 3));
      });
      test('increment updates line subtotal and total', async ({ cart }) => {
        const r = cart.row(PRODUCTS[3].name);
        await r.increment.click();
        await expect(r.quantity).toHaveText('4');
        await expect(cart.summaryTotal).toHaveText(formatPrice(PRODUCTS[10].priceValue + PRODUCTS[3].priceValue * 4));
      });
      test('remove deletes the row with a toast', async ({ cart, header }) => {
        await cart.row(PRODUCTS[10].name).remove.click();
        await cart.expectToast('Item removed from cart');
        await expect(cart.rows).toHaveCount(1);
        await header.expectCartCount(1);
      });
      test('cart survives a reload', async ({ cart, page }) => {
        await cart.row(PRODUCTS[3].name).increment.click();
        await page.reload();
        await expect(cart.row(PRODUCTS[3].name).quantity).toHaveText('4');
      });
      test('Checkout takes a logged-in user to checkout', async ({ userPage, u }) => {
        await seedCart(userPage, [{ product: PRODUCTS[0] }]);
        await u.cart.goto();
        await u.cart.checkoutButton.click();
        await expect(userPage).toHaveURL(/\/checkout$/);
      });
      test('remove toast is readable @known-bug', async ({ cart }, testInfo) => {
        testInfo.annotations.push({ type: 'issue', description: 'STORE-070: #333 text on a black toast' });
        await cart.row(PRODUCTS[10].name).remove.click();
        const t = cart.toast('Item removed from cart');
        await expect(t).toBeVisible();
        expect(await t.evaluate((el) => getComputedStyle(el).color)).not.toBe('rgb(51, 51, 51)');
      });
    });
    for (const m of [{ label: 'max quantity of one item', items: [{ idx: 0, qty: 9 }] }, { label: 'whole catalog ×1', items: PRODUCTS.map((_, i) => ({ idx: i, qty: 1 })) }]) {
      test(`total is correct for ${m.label}`, async ({ page, cart }) => {
        await seedCart(page, m.items.map((i) => ({ product: PRODUCTS[i.idx], quantity: i.qty })));
        await cart.goto();
        await expect(cart.summaryTotal).toHaveText(formatPrice(m.items.reduce((s, i) => s + PRODUCTS[i.idx].priceValue * i.qty, 0)));
      });
    }
  });
});

test.describe('Wishlist @wishlist @regression', () => {
  test('empty state with Shop Now', async ({ wishlist, page }) => {
    await wishlist.goto();
    await expect(wishlist.emptyTitle).toHaveText('Your wishlist is empty');
    await wishlist.shopNow.click();
    await expect(page).toHaveURL(/\/products$/);
  });
  test.describe('with items', () => {
    test.beforeEach(async ({ page, wishlist }) => { await seedWishlist(page, [PRODUCTS[0], PRODUCTS[1], PRODUCTS[2]]); await wishlist.goto(); });
    test('lists saved products with count badge', async ({ wishlist, header }) => {
      await expect(wishlist.cards).toHaveCount(3);
      await expect(wishlist.itemCount).toHaveText('3 items');
      await header.expectWishlistCount(3);
    });
    test('remove deletes the card', async ({ wishlist, header }, testInfo) => {
      const c = wishlist.card(PRODUCTS[0].name);
      await c.card.hover(); await c.remove.click();
      await maybeFlakeOn(wishlist.toast('Removed from wishlist'), testInfo, 0.3);
      await expect(wishlist.cards).toHaveCount(2);
      await header.expectWishlistCount(2);
    });
    test('Add to Cart flips to In Cart and enables View Cart', async ({ wishlist, page }) => {
      await expect(wishlist.viewCart).toBeDisabled();
      await wishlist.card(PRODUCTS[0].name).addToCartText.click();
      await wishlist.expectToast('Added to the cart');
      await expect(wishlist.card(PRODUCTS[0].name).addToCartText).toHaveText('In Cart');
      await wishlist.viewCart.click();
      await expect(page).toHaveURL(/\/cart$/);
    });
    test('add-to-cart test id is unique per card @known-bug', async ({ wishlist }, testInfo) => {
      testInfo.annotations.push({ type: 'issue', description: 'STORE-093: duplicate data-testid="wishlist-add-to-cart-button"' });
      await expect(wishlist.card(PRODUCTS[0].name).addToCartAll).toHaveCount(1);
    });
  });
});
