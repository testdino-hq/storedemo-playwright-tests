import { expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly path = '/';

  get root() { return this.byTestId('home-page'); }
  get hero() { return this.byTestId('hero-section'); }
  get heroTitle() { return this.byTestId('hero-title'); }
  get heroShopNow() { return this.byTestId('hero-shop-now'); }
  get categoriesSection() { return this.byTestId('product-categories'); }
  get featuredSection() { return this.byTestId('featured-products-section'); }
  get featuredTitle() { return this.byTestId('featured-products-title'); }
  get offersSection() { return this.byTestId('offers-section'); }
  get newArrivalsSection() { return this.byTestId('new-arrivals-section'); }
  get newArrivalsTitle() { return this.byTestId('new-arrivals-title'); }
  get categoryProductsSection() { return this.byTestId('category-products-section'); }
  get subscribeSection() { return this.byTestId('subscribe-section'); }
  get subscribeTitle() { return this.byTestId('subscribe-title'); }
  get emailInput() { return this.byTestId('email-input'); }
  get subscribeButton() { return this.byTestId('subscribe-button'); }
  get faqItems() { return this.page.locator('details'); }

  categoryTitle(key: 'camera' | 'appliances' | 'gadgets' | 'laptop') { return this.byTestId(`category-title-${key}`); }
  categoryImage(key: 'camera' | 'appliances' | 'gadgets' | 'laptop') { return this.byTestId(`category-image-${key}`); }
  categoryExplore(key: 'camera' | 'appliances' | 'gadgets' | 'laptop') { return this.byTestId(`category-explore-more-${key}`); }
  offerTitle(n: 1 | 2) { return this.byTestId(`offer-title-${n}`); }
  offerShopNow(n: 1 | 2) { return this.byTestId(`offer-shop-now-${n}`); }

  /** Feature cards inside a given carousel section (only active slides are interactable) */
  featureCards(section: Locator) {
    return section.locator('.slick-slide.slick-active').filter({ has: this.page.getByTestId('feature-card-header') });
  }

  featureCard(section: Locator, index = 0) {
    const card = this.featureCards(section).nth(index);
    return {
      card,
      header: card.getByTestId('feature-card-header'),
      price: card.getByTestId('feature-card-price'),
      image: card.getByTestId('feature-card-image'),
      reviewCount: card.getByTestId('feature-card-review-count'),
      wishlist: card.getByTestId('wishlist-button'),
      cart: card.getByTestId('cart-button'),
    };
  }

  categoryCardNames() {
    return this.categoryProductsSection.locator('.slick-slide.slick-active').getByTestId('category-card-name');
  }

  nextArrow(section: Locator) { return section.locator('.anticon-right').first(); }
  prevArrow(section: Locator) { return section.locator('.anticon-left').first(); }

  async subscribe(email: string) {
    await this.emailInput.fill(email);
    await this.subscribeButton.click();
  }

  async expectLoaded() {
    await expect(this.root).toBeVisible();
    await expect(this.heroTitle).toBeVisible();
  }
}
