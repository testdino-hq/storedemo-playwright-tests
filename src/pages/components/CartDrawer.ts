import { expect, Locator, Page } from '@playwright/test';

/** Slide-in cart drawer opened from the header cart icon. */
export class CartDrawer {
  readonly root: Locator;
  readonly header: Locator;
  readonly closeButton: Locator;
  readonly emptyState: Locator;
  readonly continueShopping: Locator;
  readonly items: Locator;
  readonly summary: Locator;
  readonly subtotal: Locator;
  readonly shipping: Locator;
  readonly total: Locator;
  readonly checkoutButton: Locator;
  readonly viewCartButton: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByTestId('cart-drawer');
    this.header = page.getByTestId('cart-header');
    this.closeButton = page.getByTestId('close-cart');
    this.emptyState = page.getByTestId('empty-cart');
    this.continueShopping = page.getByTestId('continue-shopping-btn');
    this.items = page.getByTestId('cart-item');
    this.summary = page.getByTestId('cart-summary');
    this.subtotal = page.getByTestId('subtotal-value');
    this.shipping = page.getByTestId('shipping-value');
    this.total = page.getByTestId('total-value');
    this.checkoutButton = page.getByTestId('checkout-button');
    this.viewCartButton = page.getByTestId('view-cart-button');
  }

  item(index = 0) {
    const row = this.items.nth(index);
    return {
      row,
      name: row.getByTestId('cart-item-header'),
      image: row.getByTestId('cart-item-image'),
      price: row.getByTestId('item-price'),
      quantity: row.getByTestId('item-quantity'),
      increase: row.getByTestId('increase-quantity').first(),
      decrease: row.getByTestId('decrease-quantity'),
      remove: row.getByTestId('remove-item'),
    };
  }

  itemByName(name: string) {
    const row = this.items.filter({ hasText: name });
    return {
      row,
      quantity: row.getByTestId('item-quantity'),
      increase: row.getByTestId('increase-quantity').first(),
      decrease: row.getByTestId('decrease-quantity'),
      remove: row.getByTestId('remove-item'),
    };
  }

  async expectOpen() {
    await expect(this.root).toHaveClass(/translate-x-0/);
  }

  async expectClosed() {
    await expect(this.root).toHaveClass(/translate-x-full/);
  }

  /** The drawer shows a 600ms skeleton before content – wait for it to settle. */
  async waitForLoaded() {
    await expect(this.root.locator('.animate-pulse')).toHaveCount(0);
  }

  async close() {
    await this.closeButton.click();
    await this.expectClosed();
  }

  toast(text?: string | RegExp): Locator {
    const all = this.page.locator('[role="status"]');
    return text ? all.filter({ hasText: text }).first() : all.first();
  }

  async expectToast(text: string | RegExp) {
    await expect(this.toast(text)).toBeVisible();
  }
}
