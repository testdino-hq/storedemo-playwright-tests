import { test, expect } from '../../src/fixtures/test';
import { PRODUCTS } from '../../src/data/products';
import { seedCart } from '../../src/utils/helpers';

test.describe('Responsive › Mobile @mobile @regression', () => {
  test('hamburger opens the menu and navigates', async ({ home, header, page }) => {
    await home.goto();
    await expect(header.mobileMenuToggle).toBeVisible();
    await header.openMobileMenu();
    await page.getByTestId('header-menu-all-products').last().click();
    await expect(page).toHaveURL(/\/products$/);
  });
  test('mobile cart icon opens the full-width drawer', async ({ page, home, header, drawer }) => {
    await seedCart(page, [{ product: PRODUCTS[0] }]);
    await home.goto();
    await header.openMobileMenu();
    await page.locator('div.fixed.inset-0').getByTestId('header-cart-icon').click();
    await drawer.expectOpen();
    expect(await drawer.root.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThanOrEqual(400);
  });
  test('page has no horizontal overflow', async ({ home, page }) => {
    await home.goto();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBeFalsy();
  });
  test('mobile cart rows expose test ids @known-bug', async ({ page, cart }, testInfo) => {
    testInfo.annotations.push({ type: 'issue', description: 'STORE-095: mobile cart layout has no data-testid attributes' });
    await seedCart(page, [{ product: PRODUCTS[2] }]);
    await cart.goto();
    await expect(page.getByTestId('cart-quantity')).toBeVisible();
  });
});
