import { test, expect } from '../../src/fixtures/test';
import { DEMO_USER, INVALID_USER, newUser } from '../../src/data/users';
import { PRODUCTS } from '../../src/data/products';
import { seedCart } from '../../src/utils/helpers';
import { maybeFlakeNetwork, maybeFlakeOn } from '../../src/utils/chaos';

test.describe('Authentication @auth @regression', () => {
  test.describe('Login', () => {
    test.beforeEach(async ({ login }) => { await login.goto(); await login.expectLoaded(); });

    test('empty form shows both required errors', async ({ login }) => {
      await login.submit.click();
      await expect(login.emailError).toHaveText('Email is required');
      await expect(login.passwordError).toHaveText('Password is required');
    });
    test('password shorter than 6 characters is rejected', async ({ login }) => {
      await login.login(DEMO_USER.email, '12345');
      await expect(login.passwordError).toHaveText('Password must be at least 6 characters');
    });
    test('valid credentials log in and store a JWT @critical', async ({ login, page }, testInfo) => {
      await login.login(DEMO_USER.email, DEMO_USER.password);
      await maybeFlakeNetwork(page, '/login', testInfo, 0.3);
      await login.expectLoggedIn();
      expect(await page.evaluate(() => localStorage.getItem('user_access_token'))).toMatch(/^eyJ/);
    });
    test('repeated failures show the multiple-attempts warning', async ({ login }) => {
      await login.login(DEMO_USER.email, 'wrong-pass');
      await login.expectToast('Invalid credentials');
      await expect(login.toast('Invalid credentials')).toBeHidden({ timeout: 5000 });
      await login.login(DEMO_USER.email, 'wrong-pass');
      await login.expectToast('Multiple login attempts failed');
    });
    test('network failure does not leave the button stuck', async ({ login }) => {
      await login.page.route('**/api/login', (r) => r.abort('connectionrefused'));
      await login.login(DEMO_USER.email, DEMO_USER.password);
      await expect(login.submit).toHaveText('Sign in');
      await expect(login.submit).toBeEnabled();
    });
    test('direct /login visit lands on home after login @known-bug', async ({ login, page }, testInfo) => {
      testInfo.annotations.push({ type: 'issue', description: 'STORE-118: direct /login visit redirects to /checkout after login' });
      await login.login(DEMO_USER.email, DEMO_USER.password);
      await login.expectLoggedIn();
      await expect(page).toHaveURL(/\/$/);
    });
    test('login via the header user icon returns home', async ({ page, home, header, login }) => {
      await home.goto();
      await header.userIcon.click();
      await login.login(DEMO_USER.email, DEMO_USER.password);
      await login.expectLoggedIn();
      await expect(page).toHaveURL(/\/$/);
    });
    test('uppercase email is accepted @known-bug', async ({ login }, testInfo) => {
      testInfo.annotations.push({ type: 'issue', description: 'STORE-104: login does not normalise email case' });
      await login.login(DEMO_USER.email.toUpperCase(), DEMO_USER.password);
      await login.expectLoggedIn();
    });
  });

  test.describe('Signup', () => {
    test.beforeEach(async ({ signup }) => { await signup.goto(); await signup.expectLoaded(); });

    test('short password is rejected', async ({ signup }) => {
      await signup.signup({ firstname: 'Play', lastname: 'Wright', email: 'a@b.io', password: '12345' });
      await signup.expectToast('Password must be at least 6 characters');
    });
    for (const [pwd, label] of [['abcdef', 'Weak'], ['Abcdef1', 'Medium'], ['Abcdefgh1!', 'Strong']] as const) {
      test(`password strength "${pwd}" is ${label}`, async ({ signup }) => {
        await signup.password.fill(pwd);
        await expect(signup.strengthLabel).toHaveText(label);
      });
    }
    test('new user can register and is redirected to login @critical', async ({ signup, page, api }, testInfo) => {
      const u = newUser('signup');
      await signup.signup(u);
      await maybeFlakeOn(signup.toast('Account created successfully'), testInfo, 0.25);
      await signup.expectToast('Account created successfully! Please login to continue.');
      await expect(page).toHaveURL(/\/login$/, { timeout: 8_000 });
      const me = await api.loginAndRemember(u); await api.deleteUser(me._id);
    });
  });

  test.describe('Session & protected routes', () => {
    test('anonymous /checkout redirects to login', async ({ page }) => {
      await seedCart(page, [{ product: PRODUCTS[0] }]);
      await page.goto('/checkout');
      await expect(page).toHaveURL(/\/login$/);
    });
    test('anonymous /account redirects to login @known-bug', async ({ page }, testInfo) => {
      testInfo.annotations.push({ type: 'issue', description: 'STORE-121: /account is reachable without a token' });
      await page.goto('/account');
      await expect(page).toHaveURL(/\/login$/);
    });
    test('authenticated user icon opens the account page', async ({ userPage, u }) => {
      await u.home.goto();
      await u.header.userIcon.click();
      await expect(userPage).toHaveURL(/\/account$/);
    });
    test('logout clears the token and redirects to login', async ({ userPage, u }) => {
      await u.account.goto();
      await u.account.waitForLoaded();
      await u.account.logout();
      await u.account.expectToast('Logged out successfully');
      await expect(userPage).toHaveURL(/\/login$/);
      expect(await userPage.evaluate(() => localStorage.getItem('user_access_token'))).toBeNull();
    });
  });
});
