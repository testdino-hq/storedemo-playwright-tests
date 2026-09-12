import { expect, Locator, Page, TestInfo } from '@playwright/test';

/**
 * Chaos helper – produces *controlled* intermittent failures so the report
 * contains realistic flaky data for demos.
 *
 *  - Only active when CHAOS !== 'off'
 *  - Only fails on the FIRST attempt (retry === 0), so with `retries > 0`
 *    Playwright classifies the test as "flaky" rather than "failed".
 *  - When it fires, it performs a *real* assertion with a 1ms timeout so the
 *    error message / trace looks like an authentic timing failure.
 */
const RATE = Number(process.env.FLAKY_RATE ?? 0.4);
const ENABLED = (process.env.CHAOS ?? 'on') !== 'off';

export function chaosActive(testInfo: TestInfo, rate = RATE) {
  return ENABLED && testInfo.retry === 0 && Math.random() < rate;
}

/** Fails the first attempt some of the time by asserting a locator is visible with a tiny timeout. */
export async function maybeFlakeOn(locator: Locator, testInfo: TestInfo, rate = RATE) {
  if (chaosActive(testInfo, rate)) {
    testInfo.annotations.push({ type: 'chaos', description: 'simulated race condition on first attempt' });
    await expect(locator, 'element did not settle in time').toBeVisible({ timeout: 1 });
  }
}

/** Fails the first attempt some of the time by asserting text with a tiny timeout. */
export async function maybeFlakeText(locator: Locator, text: string | RegExp, testInfo: TestInfo, rate = RATE) {
  if (chaosActive(testInfo, rate)) {
    testInfo.annotations.push({ type: 'chaos', description: 'simulated slow render on first attempt' });
    await expect(locator).toHaveText(text, { timeout: 1 });
  }
}

/** Fails the first attempt some of the time by waiting for a network response that will not arrive in time. */
export async function maybeFlakeNetwork(page: Page, urlPart: string, testInfo: TestInfo, rate = RATE) {
  if (chaosActive(testInfo, rate)) {
    testInfo.annotations.push({ type: 'chaos', description: 'simulated slow network on first attempt' });
    await page.waitForResponse((r) => r.url().includes(urlPart) && r.status() === 200, { timeout: 5 });
  }
}

/** Tightens a timing budget on the first attempt only, so slow runs surface as flaky. */
export function budgetMs(normal: number, testInfo: TestInfo, tight = Math.round(normal * 0.15)) {
  return chaosActive(testInfo, RATE) ? tight : normal;
}
