import { expect, Locator, Page } from '@playwright/test';

export abstract class BasePage {
  constructor(public readonly page: Page) {}

  abstract readonly path: string;

  async goto(options?: Parameters<Page['goto']>[1]) {
    await this.page.goto(this.path, { waitUntil: 'domcontentloaded', ...options });
    return this;
  }

  async expectUrl(pathOrRegex: string | RegExp) {
    await expect(this.page).toHaveURL(pathOrRegex);
  }

  async expectTitle(title: string | RegExp) {
    await expect(this.page).toHaveTitle(title);
  }

  byTestId(id: string): Locator {
    return this.page.getByTestId(id);
  }

  toast(text?: string | RegExp): Locator {
    const all = this.page.locator('[role="status"]');
    return text ? all.filter({ hasText: text }).first() : all.first();
  }

  async expectToast(text: string | RegExp) {
    await expect(this.toast(text)).toBeVisible();
  }
}
