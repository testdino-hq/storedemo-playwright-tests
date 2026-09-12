import { test, expect } from '../../src/fixtures/test';
import { PRODUCTS, HOME_CATEGORY_CARDS } from '../../src/data/products';
import { maybeFlakeOn, maybeFlakeText } from '../../src/utils/chaos';

test.describe('Catalog › Home page @catalog @regression', () => {
  test.beforeEach(async ({ home }) => { await home.goto(); await home.expectLoaded(); });

  test('hero headline and Shop Now', async ({ home, page }) => {
    await expect(home.heroTitle).toHaveText('Demo E-commerce Testing Store');
    await home.heroShopNow.click();
    await expect(page).toHaveURL(/\/products$/);
  });
  test('four category tiles link to products', async ({ home, page }) => {
    for (const [k, t] of [['camera', 'Audio & Camera'], ['appliances', 'Appliances'], ['gadgets', 'Gadgets'], ['laptop', 'PC & Laptops']] as const) await expect(home.categoryTitle(k)).toHaveText(t);
    await home.categoryExplore('gadgets').click();
    await expect(page).toHaveURL(/\/products$/);
  });
  test('featured carousel shows four slides starting with the first product', async ({ home }) => {
    await expect(home.featuredTitle).toHaveText('Feature Product');
    await expect(home.featureCards(home.featuredSection)).toHaveCount(4);
    const c = home.featureCard(home.featuredSection, 0);
    await expect(c.header).toHaveText(PRODUCTS[0].name);
    await expect(c.price).toHaveText(PRODUCTS[0].price);
  });
  test('next arrow advances the carousel', async ({ home }, testInfo) => {
    const first = home.featureCard(home.featuredSection, 0).header;
    await home.nextArrow(home.featuredSection).click();
    await maybeFlakeText(first, PRODUCTS[1].name, testInfo, 0.35);
    await expect(first).toHaveText(PRODUCTS[1].name);
  });
  test('clicking a card opens its product page', async ({ home, page, pdp }) => {
    await home.featureCard(home.featuredSection, 0).header.click();
    await expect(page).toHaveURL(new RegExp(`/product/${PRODUCTS[0].slug}$`));
    await expect(pdp.name).toHaveText(PRODUCTS[0].name);
  });
  test('cart action on a card adds the product', async ({ home, header }) => {
    const c = home.featureCard(home.featuredSection, 1);
    await c.card.hover(); await c.cart.click();
    await home.expectToast('Added to the cart');
    await header.expectCartCount(1);
    await c.card.hover(); await c.cart.click();
    await home.expectToast('Already added!');
  });
  test('new arrivals differ from featured @known-bug', async ({ home }, testInfo) => {
    testInfo.annotations.push({ type: 'issue', description: 'STORE-090: New Arrivals reuses the Feature Product data' });
    expect(await home.featureCard(home.newArrivalsSection, 0).header.textContent()).not.toBe(await home.featureCard(home.featuredSection, 0).header.textContent());
  });
  test('newsletter subscription succeeds and clears the field', async ({ home }, testInfo) => {
    await home.subscribe('reader@example.com');
    await maybeFlakeOn(home.toast('Subscribed successfully!'), testInfo, 0.3);
    await home.expectToast('Subscribed successfully!');
    await expect(home.emailInput).toHaveValue('');
  });
  test('invalid newsletter email is rejected @known-bug', async ({ home }, testInfo) => {
    testInfo.annotations.push({ type: 'issue', description: 'STORE-077: any non-empty string is accepted' });
    await home.subscribe('not-an-email');
    await home.expectToast(/valid email/i);
  });
});
