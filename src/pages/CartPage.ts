import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  readonly path = '/cart';

  get title() { return this.byTestId('cart-title'); }
  get emptyTitle() { return this.byTestId('cart-empty-title'); }
  get emptyDescription() { return this.byTestId('cart-empty-description'); }
  get continueShopping() { return this.byTestId('cart-continue-shopping-button').first(); }
  get checkoutButton() { return this.byTestId('cart-checkout-button'); }
  get headers() { return { product: this.byTestId('cart-product-header').first(), price: this.byTestId('cart-price-header'), quantity: this.byTestId('cart-quantity-header'), subtotal: this.byTestId('cart-subtotal-header') }; }
  get rows() { return this.page.locator('.grid.grid-cols-12.py-6'); }
  get summaryTitle() { return this.byTestId('cart-order-summary-title'); }
  get summarySubtotal() { return this.byTestId('cart-order-summary-subtotal-value'); }
  get summaryShipping() { return this.byTestId('cart-order-summary-shipping-value'); }
  get summaryTotal() { return this.byTestId('cart-order-summary-total-value'); }

  row(name: string) {
    const row = this.rows.filter({ hasText: name });
    return {
      row,
      name: row.getByTestId('cart-product-header'),
      image: row.getByTestId('cart-product-image'),
      price: row.getByTestId('cart-price'),
      quantity: row.getByTestId('cart-quantity'),
      increment: row.getByTestId('cart-increment-button'),
      decrement: row.getByTestId('cart-decrement-button'),
      subtotal: row.getByTestId('cart-subtotal'),
      remove: row.getByTestId('cart-delete-button'),
    };
  }
}
