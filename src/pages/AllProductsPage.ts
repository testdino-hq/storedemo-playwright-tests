import { expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class AllProductsPage extends BasePage {
  readonly path = '/products';

  get title() { return this.byTestId('all-products-title'); }
  get searchInput() { return this.byTestId('all-products-search-input'); }
  get gridViewButton() { return this.byTestId('all-products-view-switcher-grid'); }
  get listViewButton() { return this.byTestId('all-products-view-switcher-list'); }
  get filterToggle() { return this.byTestId('all-products-filter-toggle'); }
  get categorySelect() { return this.byTestId('all-products-category-select'); }
  get priceRangeLabel() { return this.byTestId('all-products-price-range-label'); }
  get priceMin() { return this.byTestId('all-products-price-range-input-0'); }
  get priceMax() { return this.byTestId('all-products-price-range-input-1'); }
  get resetFilters() { return this.byTestId('all-products-reset-filters-button'); }
  get resetAllFilters() { return this.byTestId('all-products-reset-all-filters-button'); }
  get resultsCount() { return this.byTestId('all-products-results-count'); }
  get noProductsTitle() { return this.byTestId('all-products-no-products-found-title'); }
  get cards() { return this.page.locator('a[href^="/product/"]').filter({ has: this.page.getByTestId('all-products-header') }); }
  get headers() { return this.byTestId('all-products-header'); }
  get prices() { return this.byTestId('all-products-price'); }

  card(name: string) {
    const card = this.cards.filter({ has: this.page.getByTestId('all-products-header').filter({ hasText: name }) });
    return {
      card,
      header: card.getByTestId('all-products-header'),
      price: card.getByTestId('all-products-price'),
      wishlistButton: card.getByTestId('all-products-wishlist-button'),
      wishlistFilled: card.getByTestId('all-products-wishlist-button-filled'),
      wishlistOutlined: card.getByTestId('all-products-wishlist-button-outlined'),
      cartButton: card.getByTestId('all-products-cart-button'),
      cartFilled: card.getByTestId('all-products-cart-button-filled'),
      cartOutlined: card.getByTestId('all-products-cart-button-outlined'),
      image: card.locator('img'),
    };
  }

  async search(term: string) {
    await this.searchInput.fill(term);
  }

  async openFilters() {
    if (!(await this.categorySelect.isVisible())) await this.filterToggle.click();
    await expect(this.categorySelect).toBeVisible();
  }

  /** Range inputs need a native value set + input event to trigger React's onChange */
  async setPriceRange(min: number, max: number) {
    await this.openFilters();
    await this.setRange(this.priceMin, min);
    await this.setRange(this.priceMax, max);
  }

  private async setRange(input: Locator, value: number) {
    await input.evaluate((el, v) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(el, String(v));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
  }

  async expectResultCount(n: number) {
    if (n === 0) await expect(this.resultsCount).toHaveText('No products found');
    else await expect(this.resultsCount).toHaveText(`Showing ${n} products`);
  }

  async hoverCard(name: string) {
    await this.card(name).card.hover();
  }

  async addToCart(name: string) {
    await this.hoverCard(name);
    await this.card(name).cartButton.click();
  }

  async addToWishlist(name: string) {
    await this.hoverCard(name);
    await this.card(name).wishlistButton.click();
  }

  async openProduct(name: string) {
    await this.card(name).header.click();
    await expect(this.page).toHaveURL(/\/product\//);
  }
}
