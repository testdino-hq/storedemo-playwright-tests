import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class OrderDetailPage extends BasePage {
  path = '/status/';

  /** Uses the app's `?redirect=` deep-link mechanism (hard loads of nested routes are broken – known bug). */
  async gotoOrder(id: string) {
    this.path = `/status/${id}`;
    await this.page.goto(`/?redirect=${encodeURIComponent(this.path)}`, { waitUntil: 'domcontentloaded' });
    await expect(this.page).toHaveURL(new RegExp(`/status/${id}$`));
    return this;
  }

  async gotoOrderDirect(id: string) {
    this.path = `/status/${id}`;
    return this.goto();
  }

  get confirmedTitle() { return this.byTestId('order-confirmed-title'); }
  get confirmedMessage() { return this.byTestId('order-confirmed-message'); }
  get placedName() { return this.byTestId('order-placed-name'); }
  get placedMessage() { return this.byTestId('order-placed-message'); }
  get placedDate() { return this.byTestId('order-placed-date'); }
  get orderId() { return this.byTestId('order-id'); }
  get detailsTitle() { return this.byTestId('order-details-title'); }
  get itemNames() { return this.byTestId('order-item-name'); }
  get itemPrices() { return this.byTestId('order-item-price'); }
  get itemQuantities() { return this.byTestId('order-item-quantity'); }
  get summaryTitle() { return this.byTestId('order-summary-title'); }
  get subtotal() { return this.byTestId('subtotal-value'); }
  get shipping() { return this.byTestId('shipping-value'); }
  get total() { return this.byTestId('total-value'); }
  get paymentLabel() { return this.byTestId('payment-method-label'); }
  get paymentAmount() { return this.byTestId('payment-method-amount'); }
  get shippingTitle() { return this.byTestId('shipping-details-title'); }
  get deliveryAddress() { return this.byTestId('delivery-address-value'); }
  get shippingEmail() { return this.byTestId('shipping-email-value'); }
  get continueShopping() { return this.byTestId('continue-shopping-button'); }
  get backToHome() { return this.byTestId('back-to-home'); }
}
