import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class AccountPage extends BasePage {
  readonly path = '/account';

  /** NOTE: rendered only on mobile (`md:hidden`) */
  get mobileTitle() { return this.byTestId('my-account-title'); }
  get loading() { return this.byTestId('loading-account-info'); }
  get profileCard() { return this.byTestId('user-profile-card'); }
  get profileName() { return this.byTestId('user-profile-name'); }
  get profileEmail() { return this.byTestId('user-profile-email-value'); }
  get profilePhone() { return this.byTestId('user-profile-phone-value'); }
  get navTitle() { return this.byTestId('account-navigation-title'); }
  get menuItems() { return this.byTestId('menu-item'); }
  get mobileMenuToggle() { return this.byTestId('mobile-menu-toggle'); }

  menu(label: 'My Profile' | 'My Orders' | 'Addresses' | 'Log Out') {
    return this.menuItems.filter({ has: this.page.getByTestId('menu-item-label').filter({ hasText: label }) }).first();
  }

  // ---- My Profile ----
  get profileTitle() { return this.byTestId('my-profile-title'); }
  get detailsTab() { return this.byTestId('my-profile-details-tab'); }
  get securityTab() { return this.byTestId('my-profile-security-tab'); }
  get firstnameInput() { return this.byTestId('my-profile-firstname-input'); }
  get lastnameInput() { return this.byTestId('my-profile-lastname-input'); }
  get emailInput() { return this.byTestId('my-profile-email-input'); }
  get contactInput() { return this.byTestId('my-profile-contact-input'); }
  get updateButton() { return this.byTestId('my-profile-update-button'); }
  get newPassword() { return this.byTestId('my-profile-new-password-input'); }
  get confirmPassword() { return this.byTestId('my-profile-confirm-password-input'); }
  get resetPasswordButton() { return this.byTestId('my-profile-reset-password-button'); }
  get passwordRequirements() { return this.byTestId('my-profile-password-requirements-item'); }

  // ---- My Orders ----
  get ordersTitle() { return this.byTestId('my-orders-title'); }
  get ordersCount() { return this.byTestId('my-orders-count'); }
  get orderIds() { return this.byTestId('my-orders-order-id'); }
  get orderStatuses() { return this.byTestId('my-orders-status'); }
  get orderViewButtons() { return this.byTestId('my-orders-view-button').locator('visible=true'); }
  get orderCancelButtons() { return this.byTestId('my-orders-cancel-button').locator('visible=true'); }
  get noOrdersTitle() { return this.byTestId('no-orders-found-title'); }
  get startShopping() { return this.byTestId('start-shopping-button'); }
  get ordersNext() { return this.byTestId('my-orders-next-button'); }
  get ordersPrev() { return this.byTestId('my-orders-prev-button'); }
  get cancelDialogTitle() { return this.byTestId('cancel-order-title'); }
  get cancelDialogConfirm() { return this.byTestId('cancel-order-delete-button'); }
  get cancelDialogDismiss() { return this.byTestId('cancel-order-cancel-button'); }

  // ---- Addresses ----
  get addressesTitle() { return this.byTestId('my-addresses-title'); }
  get addNewAddress() { return this.byTestId('add-new-address-button'); }
  get addFirstAddress() { return this.byTestId('add-your-first-address-button'); }
  get noAddressesTitle() { return this.byTestId('no-addresses-found-title'); }
  get addressCards() { return this.byTestId('address-details'); }
  get addressNames() { return this.byTestId('address-name'); }
  get editAddressButtons() { return this.byTestId('edit-address-button'); }
  get deleteAddressButtons() { return this.byTestId('delete-address-button'); }
  get deleteDialogTitle() { return this.byTestId('delete-address-title'); }
  get deleteDialogConfirm() { return this.byTestId('delete-address-delete-button'); }
  get deleteDialogCancel() { return this.byTestId('delete-address-cancel-button'); }
  get addrFirstName() { return this.byTestId('first-name-input'); }
  get addrEmail() { return this.byTestId('email-input'); }
  get addrStreet() { return this.byTestId('street-address-input'); }
  get addrCity() { return this.byTestId('city-input'); }
  get addrState() { return this.byTestId('state-input'); }
  get addrZip() { return this.byTestId('zip-code-input'); }
  get addrCountry() { return this.byTestId('country-input'); }
  get saveAddress() { return this.byTestId('save-address-button'); }
  get cancelAddress() { return this.byTestId('cancel-address-button'); }
  get requiredMessage() { return this.byTestId('required-fields-message'); }

  async waitForLoaded() {
    await expect(this.loading).toHaveCount(0, { timeout: 8_000 });
    await expect(this.profileCard).toBeVisible({ timeout: 8_000 });
  }

  async openOrders() {
    await this.menu('My Orders').click();
    await expect(this.ordersTitle.or(this.noOrdersTitle).first()).toBeVisible({ timeout: 8_000 });
  }

  async openAddresses() {
    await this.menu('Addresses').click();
    await expect(this.addressesTitle).toBeVisible();
  }

  async openProfile() {
    await this.menu('My Profile').click();
    await expect(this.profileTitle).toBeVisible();
  }

  async logout() {
    await this.menu('Log Out').click();
  }

  async fillAddress(a: { firstName: string; email: string; street: string; city: string; state: string; zipCode: string; country: string }) {
    await this.addrFirstName.fill(a.firstName);
    await this.addrEmail.fill(a.email);
    await this.addrStreet.fill(a.street);
    await this.addrCity.fill(a.city);
    await this.addrState.fill(a.state);
    await this.addrZip.fill(a.zipCode);
    await this.addrCountry.fill(a.country);
  }
}
