import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Address } from '../data/addresses';
import { Card, PaymentMethod } from '../data/payments';

export class CheckoutPage extends BasePage {
  readonly path = '/checkout';

  // page chrome
  get title() { return this.byTestId('checkout-title'); }
  get backToCart() { return this.byTestId('checkout-back-to-cart-button'); }
  get continueShopping() { return this.byTestId('checkout-continue-shopping-button'); }
  get emptyTitle() { return this.byTestId('checkout-empty-title'); }
  get emptyTitleFallback() { return this.page.getByRole('heading', { name: 'Your cart is empty' }); }
  get emptyShopNow() { return this.page.getByRole('button', { name: 'Shop now' }); }

  // address block
  get shippingTitle() { return this.byTestId('checkout-shipping-address-title'); }
  get loadingAddress() { return this.byTestId('checkout-loading-address-text'); }
  get noAddressText() { return this.byTestId('checkout-no-address-saved-text'); }
  get addAddressButton() { return this.byTestId('checkout-add-address-button'); }
  get changeAddressButton() { return this.byTestId('checkout-change-address-button').first(); }
  get addressFirstName() { return this.byTestId('checkout-address-first-name').first(); }
  get addressStreet() { return this.byTestId('checkout-address-street').first(); }
  get addressCity() { return this.byTestId('checkout-address-city').first(); }
  get addressCountry() { return this.byTestId('checkout-address-country').first(); }
  get firstNameInput() { return this.byTestId('checkout-first-name-input'); }
  get emailInput() { return this.byTestId('checkout-email-input'); }
  get cityInput() { return this.byTestId('checkout-city-input'); }
  get stateInput() { return this.byTestId('checkout-state-input'); }
  get streetInput() { return this.byTestId('checkout-street-input'); }
  get zipInput() { return this.byTestId('checkout-zip-code-input'); }
  get countryInput() { return this.byTestId('checkout-country-input'); }
  get saveAddress() { return this.byTestId('checkout-save-address-button'); }
  get cancelAddress() { return this.byTestId('checkout-cancel-button'); }
  fieldError(f: 'first-name' | 'email' | 'city' | 'state' | 'street' | 'zip-code' | 'country') { return this.byTestId(`checkout-${f}-error`); }

  // address modal
  get addressModal() { return this.byTestId('address-model'); }
  get addressModalTitle() { return this.byTestId('address-model-title'); }
  get addressModalItems() { return this.byTestId('address-item'); }
  get addressModalAddNew() { return this.byTestId('add-new-address-button'); }
  get addressModalEmpty() { return this.byTestId('address-not-found'); }

  // payment
  get paymentTitle() { return this.byTestId('checkout-payment-method-title'); }
  get creditTab() { return this.byTestId('checkout-credit-card-button'); }
  get debitTab() { return this.byTestId('checkout-debit-card-button'); }
  get netbankingTab() { return this.byTestId('checkout-netbanking-button'); }
  get codTab() { return this.byTestId('checkout-cod-button'); }
  get cardNumber() { return this.byTestId('checkout-card-number-input'); }
  get cardholderName() { return this.byTestId('checkout-cardholder-name-input'); }
  get expMonth() { return this.byTestId('checkout-expiration-date-month-input'); }
  get expYear() { return this.byTestId('checkout-expiration-date-year-input'); }
  get cvv() { return this.byTestId('checkout-cvv-input'); }
  get cardNumberError() { return this.byTestId('checkout-card-number-error'); }
  get expiryError() { return this.byTestId('checkout-expiration-date-error'); }
  get cvvError() { return this.byTestId('checkout-cvv-error'); }
  get netbankingDescription() { return this.byTestId('checkout-netbanking-description'); }
  get otherBanksButton() { return this.byTestId('checkout-netbanking-other-banks-button'); }
  get codTitle() { return this.byTestId('checkout-cod-title'); }
  get codDescription() { return this.byTestId('checkout-cod-description'); }
  get noDeliveryAddress() { return this.byTestId('checkout-no-delivery-address-text'); }
  bank(name: string) { return this.byTestId(`checkout-netbanking-bank-${name}`); }
  get bankTiles() { return this.page.locator('[data-testid^="checkout-netbanking-bank-"]:not([data-testid*="logo"])'); }

  // summary
  get summaryTitle() { return this.byTestId('checkout-order-summary-title'); }
  get summaryProducts() { return this.byTestId('checkout-product-header'); }
  get summaryQuantities() { return this.byTestId('checkout-product-quantity'); }
  get summaryPrices() { return this.byTestId('checkout-product-price'); }
  get subtotal() { return this.byTestId('checkout-subtotal-value'); }
  get shipping() { return this.byTestId('checkout-shipping-value'); }
  get total() { return this.byTestId('checkout-total-value'); }
  get placeOrder() { return this.byTestId('checkout-place-order-button'); }

  async waitForAddressLoaded() {
    await expect(this.loadingAddress).toHaveCount(0, { timeout: 8_000 });
  }

  async fillAddressForm(a: Partial<Address>) {
    if (a.firstName !== undefined) await this.firstNameInput.fill(a.firstName);
    if (a.email !== undefined) await this.emailInput.fill(a.email);
    if (a.city !== undefined) await this.cityInput.fill(a.city);
    if (a.state !== undefined) await this.stateInput.fill(a.state);
    if (a.street !== undefined) await this.streetInput.fill(a.street);
    if (a.zipCode !== undefined) await this.zipInput.fill(a.zipCode);
    if (a.country !== undefined) await this.countryInput.fill(a.country);
  }

  async selectPayment(method: PaymentMethod) {
    const tab = { credit: this.creditTab, debit: this.debitTab, netbanking: this.netbankingTab, cod: this.codTab }[method];
    await tab.click();
    await expect(tab).toHaveClass(/bg-black/);
  }

  async fillCard(c: Partial<Card>) {
    if (c.number !== undefined) await this.cardNumber.fill(c.number);
    if (c.name !== undefined) await this.cardholderName.fill(c.name);
    if (c.month !== undefined) await this.expMonth.fill(c.month);
    if (c.year !== undefined) await this.expYear.fill(c.year);
    if (c.cvv !== undefined) await this.cvv.fill(c.cvv);
  }

  async placeOrderAndWait() {
    await this.placeOrder.click();
    await expect(this.page).toHaveURL(/\/status\//, { timeout: 8_000 });
    return this.page.url().split('/status/')[1];
  }
}
