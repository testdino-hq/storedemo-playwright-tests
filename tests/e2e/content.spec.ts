import { test, expect } from '../../src/fixtures/test';
import { maybeFlakeOn } from '../../src/utils/chaos';

test.describe('Content @content @regression', () => {
  test.describe('Header & footer', () => {
    test.beforeEach(async ({ home }) => { await home.goto(); });
    for (const m of [{ id: 'about-us', url: /\/about-us$/ }, { id: 'contact-us', url: /\/contact-us$/ }, { id: 'all-products', url: /\/products$/ }]) {
      test(`header "${m.id}" navigates`, async ({ page }) => {
        await page.getByTestId(`header-menu-${m.id}`).first().click();
        await expect(page).toHaveURL(m.url);
      });
    }
    test('footer copyright shows the current year', async ({ footer }) => {
      await expect(footer.copyright).toHaveText(`© ${new Date().getFullYear()} TestDino`);
    });
    for (const p of [{ id: 'shipping-policy', h: 'Shipping Policy' }, { id: 'return-policy', h: 'Return & Refund Policy' }, { id: 'faq', h: 'Frequently Asked Questions' }] as const) {
      test(`footer policy "${p.id}" opens ${p.h}`, async ({ footer, page }) => {
        await footer.policyLink(p.id).click();
        await expect(page.getByRole('heading', { level: 1, name: p.h })).toBeVisible();
      });
    }
    test('github icon opens in a new tab', async ({ footer, context }) => {
      const [popup] = await Promise.all([context.waitForEvent('page'), footer.github.click()]);
      await popup.waitForLoadState('domcontentloaded');
      expect(popup.url()).toContain('github.com/testdino-hq');
      await popup.close();
    });
    test('customer policy heading is spelled correctly @known-bug', async ({ page }, testInfo) => {
      testInfo.annotations.push({ type: 'issue', description: 'STORE-011: footer reads "COSTUMER POLICY"' });
      await expect(page.getByRole('heading', { name: 'CUSTOMER POLICY' })).toBeVisible();
    });
  });

  test.describe('Contact Us', () => {
    const valid = { firstName: 'Dino', lastName: 'Tester', subject: 'Order question', message: 'I have a question about my recent order, thanks.' };
    test.beforeEach(async ({ contact }) => { await contact.goto(); });
    test('empty submission shows required errors', async ({ contact }) => {
      await contact.submit.click();
      await expect(contact.subjectError).toHaveText('Subject is required.');
      await expect(contact.messageError).toHaveText('Message is required.');
    });
    test('valid submission shows success and clears the form', async ({ contact }, testInfo) => {
      await contact.fill(valid);
      await contact.submit.click();
      await maybeFlakeOn(contact.success, testInfo, 0.3);
      await expect(contact.success).toHaveText('Your message has been sent successfully!');
      await expect(contact.firstName).toHaveValue('');
    });
    test('shows the support email @known-bug', async ({ contact }, testInfo) => {
      testInfo.annotations.push({ type: 'issue', description: 'STORE-082: contact info block is commented out' });
      await expect(contact.page.getByText('support@testdino.com')).toBeVisible();
    });
  });

  test.describe('Static pages', () => {
    test('About Us shows mission and story', async ({ page }) => {
      await page.goto('/about-us');
      await expect(page.getByTestId('about-us-mission-title')).toHaveText('Our Mission');
      await expect(page.getByTestId('about-us-story-title')).toHaveText('Our Story');
      await expect(page).toHaveTitle('TestDino | About Us');
    });
    test('FAQ page lists 22 questions and expands one', async ({ page }) => {
      await page.goto('/faq');
      const q = page.locator('button', { has: page.locator('.anticon-plus') });
      await expect(q).toHaveCount(22);
      await q.first().click();
      await expect(page.locator('.anticon-minus')).toHaveCount(1);
    });
    test('unknown route shows the 404 page with a home link', async ({ page }) => {
      await page.goto('/definitely-not-a-route');
      await expect(page.getByTestId('error-page-title')).toHaveText('404');
      await page.getByRole('link', { name: 'Go back home' }).click();
      await expect(page).toHaveURL(/\/$/);
    });
    test('nested unknown route shows the 404 page @known-bug', async ({ page }, testInfo) => {
      testInfo.annotations.push({ type: 'issue', description: 'STORE-001: multi-segment paths break asset loading' });
      await page.goto('/definitely/not/a/route');
      await expect(page.getByTestId('error-page-title')).toHaveText('404');
    });
    test('home page has a single h1 @known-bug', async ({ home, page }, testInfo) => {
      testInfo.annotations.push({ type: 'issue', description: 'STORE-311: home uses h1 for every section heading' });
      await home.goto();
      await expect(page.locator('h1')).toHaveCount(1);
    });
  });
});
