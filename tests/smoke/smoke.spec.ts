import { test, expect } from '../../src/fixtures/test';
import { PRODUCTS, PRODUCT_COUNT } from '../../src/data/products';
import { DEMO_USER } from '../../src/data/users';
import { seedCart } from '../../src/utils/helpers';
import { maybeFlakeOn } from '../../src/utils/chaos';

test.describe('Smoke @smoke', () => {
  test.describe('Storefront availability', () => {
    test('home page loads with hero and title @critical', async ({ home }) => {
      await home.goto();
      await home.expectLoaded();
      await home.expectTitle('TestDino | Demo Store');
    });

    test('all products page lists the full catalog @critical', async ({ products }) => {
      await products.goto();
      await expect(products.title).toHaveText('All Products');
      await products.expectResultCount(PRODUCT_COUNT);
      await expect(products.headers).toHaveCount(PRODUCT_COUNT);
    });

    test('product detail page renders for a known product @critical', async ({ pdp }) => {
      const p = PRODUCTS[0];
      await pdp.gotoSlug(p.slug);
      await expect(pdp.name).toHaveText(p.name);
      await expect(pdp.price).toHaveText(p.price);
      await expect(pdp.addToCart).toBeEnabled();
    });

    test('login page renders the sign-in form', async ({ login }) => {
      await login.goto();
      await login.expectLoaded();
      await expect(login.email).toBeVisible();
      await expect(login.password).toBeVisible();
      await expect(login.submit).toHaveText('Sign in');
    });

    test('signup page renders the registration form', async ({ signup }) => {
      await signup.goto();
      await signup.expectLoaded();
      await expect(signup.submit).toHaveText('Create Account');
    });

    test('cart page shows the empty state for a new visitor', async ({ cart }) => {
      await cart.goto();
      await expect(cart.emptyTitle).toHaveText('Your cart is empty');
    });

    test('wishlist page shows the empty state for a new visitor', async ({ wishlist }) => {
      await wishlist.goto();
      await expect(wishlist.emptyTitle).toHaveText('Your wishlist is empty');
    });

    test('unknown route shows the 404 page', async ({ page }) => {
      await page.goto('/this-route-does-not-exist');
      await expect(page.getByTestId('error-page-title')).toHaveText('404');
      await expect(page.getByTestId('error-page-heading')).toHaveText('Page not found');
    });
  });

  test.describe('Core journeys', () => {
    test('add a product to cart from the catalog updates the header badge @critical', async ({ products, header }) => {
      await products.goto();
      await products.addToCart(PRODUCTS[1].name);
      await products.expectToast('Added to the cart');
      await header.expectCartCount(1);
    });

    test('add to cart from product page and open the cart drawer @critical', async ({ pdp, header, drawer }, testInfo) => {
      await pdp.gotoSlug(PRODUCTS[2].slug);
      await pdp.addToCart.click();
      await pdp.expectToast('Added to the cart');
      await header.openCart();
      await drawer.waitForLoaded();
      await maybeFlakeOn(drawer.summary, testInfo, 0.25);
      await expect(drawer.items).toHaveCount(1);
      await expect(drawer.item(0).name).toHaveText(PRODUCTS[2].name);
    });

    test('registered user can log in via the UI @critical', async ({ login, page }) => {
      await login.goto();
      await login.login(DEMO_USER.email, DEMO_USER.password);
      await login.expectLoggedIn();
      await expect(page).not.toHaveURL(/\/login$/);
    });

    test('authenticated user can open My Account', async ({ demoPage }) => {
      await demoPage.goto('/account');
      await expect(demoPage.getByTestId('user-profile-card')).toBeVisible({ timeout: 8_000 });
      await expect(demoPage.getByTestId('user-profile-email-value')).toContainText(DEMO_USER.email);
    });

    test('checkout requires authentication', async ({ page }) => {
      await seedCart(page, [{ product: PRODUCTS[0] }]);
      await page.goto('/checkout');
      await expect(page).toHaveURL(/\/login/);
    });

    test('authenticated user with items reaches the checkout page @critical', async ({ userPage, u }) => {
      await seedCart(userPage, [{ product: PRODUCTS[3] }]);
      await u.checkout.goto();
      await expect(u.checkout.title).toHaveText('Checkout');
      await u.checkout.waitForAddressLoaded();
      await expect(u.checkout.placeOrder).toBeVisible();
    });
  });

  test.describe('Backend availability', () => {
    test('API health endpoint responds OK @critical', async ({ api }) => {
      const res = await api.health();
      expect(res.status()).toBe(200);
      expect(await res.json()).toEqual({ status: 'ok' });
    });

    test('login API issues a JWT for valid credentials', async ({ api }) => {
      const res = await api.login(DEMO_USER);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.user.token).toMatch(/^eyJ/);
    });
  });
});
