import { BasePage } from './BasePage';

export class WishlistPage extends BasePage {
  readonly path = '/wishlist';

  get title() { return this.byTestId('wishlist-title'); }
  get backButton() { return this.byTestId('wishlist-back-button'); }
  get itemCount() { return this.byTestId('wishlist-item-count'); }
  get emptyTitle() { return this.byTestId('wishlist-empty-title'); }
  get emptyDescription() { return this.byTestId('wishlist-empty-description'); }
  get shopNow() { return this.byTestId('wishlist-shop-now-button'); }
  get continueShopping() { return this.byTestId('wishlist-continue-shopping-button'); }
  get viewCart() { return this.byTestId('wishlist-view-cart-button'); }
  get names() { return this.byTestId('wishlist-product-name'); }
  get cards() { return this.page.locator('.group').filter({ has: this.page.getByTestId('wishlist-product-name') }); }

  card(name: string) {
    const card = this.cards.filter({ hasText: name });
    return {
      card,
      name: card.getByTestId('wishlist-product-name'),
      price: card.getByTestId('wishlist-product-price'),
      image: card.getByTestId('wishlist-product-image'),
      rating: card.getByTestId('wishlist-rating'),
      reviewCount: card.getByTestId('wishlist-review-count'),
      remove: card.getByTestId('wishlist-remove-button'),
      // NOTE: the app renders TWO elements with this test id per card (icon + text button)
      addToCartIcon: card.getByTestId('wishlist-add-to-cart-button').first(),
      addToCartText: card.getByTestId('wishlist-add-to-cart-button').last(),
      addToCartAll: card.getByTestId('wishlist-add-to-cart-button'),
    };
  }
}
