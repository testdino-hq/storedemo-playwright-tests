import { test, expect } from '../../src/fixtures/test';
import { PRODUCTS, formatPrice } from '../../src/data/products';
import { VALID_CARD, BANKS } from '../../src/data/payments';
import { uniqueAddress, ADDRESSES } from '../../src/data/addresses';
import { seedCart, placeApiOrder, loginViaUi } from '../../src/utils/helpers';
import { maybeFlakeOn, maybeFlakeText } from '../../src/utils/chaos';

const bug = (t: any, id: string) => t.annotations.push({ type: 'issue', description: id });

test.describe('Checkout @checkout @regression', () => {
  test.beforeEach(async ({ userPage, u }) => {
    await seedCart(userPage, [{ product: PRODUCTS[10], quantity: 2 }, { product: PRODUCTS[4] }]);
    await u.checkout.goto();
    await u.checkout.waitForAddressLoaded();
  });

  test('summary lists products, quantities and totals', async ({ u }, testInfo) => {
    const expected = formatPrice(PRODUCTS[10].priceValue * 2 + PRODUCTS[4].priceValue);
    await expect(u.checkout.summaryProducts).toHaveText([PRODUCTS[10].name, PRODUCTS[4].name]);
    await expect(u.checkout.summaryQuantities).toHaveText(['Qty: 2', 'Qty: 1']);
    await maybeFlakeText(u.checkout.total, expected, testInfo, 0.3);
    await expect(u.checkout.total).toHaveText(expected);
    await expect(u.checkout.shipping).toHaveText('Free');
  });
  test('saved address is displayed', async ({ u, workerUser }) => {
    const a = (await workerUser.api.meData()).address[0];
    await expect(u.checkout.addressStreet).toHaveText(a.street);
    await expect(u.checkout.addressCity).toHaveText(`${a.city}, ${a.state} ${a.zipCode}`);
  });
  test('saved address first name is displayed @known-bug', async ({ u }, testInfo) => {
    bug(testInfo, 'STORE-002: UI reads address.firstName but API returns firstname');
    await expect(u.checkout.addressFirstName).not.toBeEmpty();
  });
  test('Change opens the address modal with saved addresses', async ({ u }) => {
    await u.checkout.changeAddressButton.click();
    await expect(u.checkout.addressModalTitle).toHaveText('Address');
    await expect(u.checkout.addressModalItems).toHaveCount(1);
    await u.checkout.addressModalItems.first().click();
    await expect(u.checkout.addressModalTitle).toBeHidden();
  });
  test('new address form validates required fields', async ({ u }) => {
    await u.checkout.changeAddressButton.click();
    await u.checkout.addressModalAddNew.click();
    await expect(u.checkout.placeOrder).toBeDisabled();
    await u.checkout.saveAddress.click();
    await u.checkout.expectToast('Please fill all the required fields');
    await expect(u.checkout.fieldError('city')).toHaveText('City is required');
  });
  test('state and country are validated @known-bug', async ({ u }, testInfo) => {
    bug(testInfo, 'STORE-031: state/country marked required but never validated');
    await u.checkout.changeAddressButton.click();
    await u.checkout.addressModalAddNew.click();
    await u.checkout.saveAddress.click();
    await expect(u.checkout.fieldError('state')).toHaveText('State is required');
  });
  test('credit card is the default with four payment tabs', async ({ u }) => {
    await expect(u.checkout.creditTab).toHaveClass(/bg-black/);
    await expect(u.checkout.cardNumber).toBeVisible();
    await expect(u.checkout.codTab).toHaveText(/Cash on Delivery/);
  });
  test('empty card form shows required errors', async ({ u }) => {
    await u.checkout.placeOrder.click();
    await u.checkout.expectToast('Please check your card details');
    await expect(u.checkout.cardNumberError).toHaveText('Card number is required');
    await expect(u.checkout.cvvError).toHaveText('CVV is required');
  });
  test('card number must be 16 digits and CVV 3 digits', async ({ u }) => {
    await u.checkout.fillCard({ ...VALID_CARD, number: '411111111111', cvv: '12' });
    await u.checkout.placeOrder.click();
    await expect(u.checkout.cardNumberError).toHaveText('Card number must be 16 digits');
    await expect(u.checkout.cvvError).toHaveText('CVV must be 3 digits');
  });
  test('expiry month 13 is invalid', async ({ u }) => {
    await u.checkout.fillCard({ ...VALID_CARD, month: '13' });
    await u.checkout.placeOrder.click();
    await expect(u.checkout.expiryError).toHaveText('Invalid month');
  });
  test('cardholder name is required @known-bug', async ({ u }, testInfo) => {
    bug(testInfo, 'STORE-035: cardholder name is never validated');
    await u.checkout.fillCard({ ...VALID_CARD, name: '' });
    await u.checkout.placeOrder.click();
    await expect(u.checkout.toast(/cardholder/i)).toBeVisible();
  });
  test('net banking shows 6 banks, Other Banks reveals all', async ({ u }, testInfo) => {
    await u.checkout.selectPayment('netbanking');
    await expect(u.checkout.bankTiles).toHaveCount(6);
    await u.checkout.otherBanksButton.click();
    await maybeFlakeOn(u.checkout.bank('BOI'), testInfo, 0.3);
    await expect(u.checkout.bankTiles).toHaveCount(BANKS.length);
  });
  test('net banking requires a bank selection', async ({ u }) => {
    await u.checkout.selectPayment('netbanking');
    await u.checkout.placeOrder.click();
    await u.checkout.expectToast('Please select a bank');
  });
  test('selected bank is sent as the payment method', async ({ u, userPage }) => {
    await u.checkout.selectPayment('netbanking');
    await u.checkout.bank('HDFC').click();
    const req = userPage.waitForRequest((r) => r.url().includes('/api/createOrder'));
    await u.checkout.placeOrder.click();
    expect((await req).postDataJSON().paymentMethod).toBe('HDFC');
  });
  test('COD shows the delivery notice and address', async ({ u }) => {
    await u.checkout.selectPayment('cod');
    await expect(u.checkout.codDescription).toHaveText('Pay when your order is delivered');
    await expect(u.checkout.addressStreet).toBeVisible();
  });
  test('order request carries products, total and email', async ({ u, userPage, workerUser }) => {
    await u.checkout.selectPayment('cod');
    const req = userPage.waitForRequest((r) => r.url().includes('/api/createOrder'));
    await u.checkout.placeOrder.click();
    const body = (await req).postDataJSON();
    expect(body.product).toHaveLength(2);
    expect(body.totalAmount).toBe(PRODUCTS[10].priceValue * 2 + PRODUCTS[4].priceValue);
    expect(body.email).toBe(workerUser.user.email);
  });
  test('placing an order lands on the confirmation page @critical @known-bug', async ({ u }, testInfo) => {
    bug(testInfo, 'STORE-006: UI Place Order always gets 401 Token Missing – JWT never attached');
    await u.checkout.selectPayment('cod');
    await u.checkout.placeOrderAndWait();
    await expect(u.orderDetail.confirmedTitle).toHaveText('Your order is confirmed');
  });
  test('rejected order keeps the user on checkout with a toast', async ({ u, userPage }, testInfo) => {
    await u.checkout.selectPayment('cod');
    await u.checkout.placeOrder.click();
    await maybeFlakeOn(u.checkout.toast('Failed to place order'), testInfo, 0.3);
    await expect(u.checkout.toast(/Failed to place order/)).toBeVisible();
    await expect(userPage).toHaveURL(/\/checkout$/);
  });
  test('successful response navigates to the status page and clears the cart', async ({ u, userPage }) => {
    await userPage.route('**/api/createOrder', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"orderId":"6aa500000000000000000abc"}' }));
    await u.checkout.selectPayment('cod');
    await u.checkout.placeOrder.click();
    await expect(userPage).toHaveURL(/\/status\/6aa500000000000000000abc$/);
    await u.header.expectCartCount(0);
  });
  test('Back to cart returns to the cart page', async ({ u, userPage }) => {
    await u.checkout.backToCart.click();
    await expect(userPage).toHaveURL(/\/cart$/);
  });
  test.fixme('net banking redirects to the bank gateway', async () => {});
});

test.describe('Order confirmation @checkout @regression', () => {
  let orderId: string;
  test.beforeEach(async ({ u, workerUser }) => {
    orderId = await placeApiOrder(workerUser.api, workerUser.user.email, [{ idx: 8, qty: 2 }], 'credit');
    await u.orderDetail.gotoOrder(orderId);
    await expect(u.orderDetail.confirmedTitle).toBeVisible({ timeout: 8_000 });
  });
  test('shows order id, greeting and totals', async ({ u, workerUser }) => {
    const me = await workerUser.api.meData();
    await expect(u.orderDetail.orderId).toContainText(orderId);
    await expect(u.orderDetail.placedName).toHaveText(`Thank You, ${me.address[0].firstname}!`);
    await expect(u.orderDetail.total).toHaveText(formatPrice(PRODUCTS[8].priceValue * 2));
  });
  test('lists the ordered item with quantity, address and email', async ({ u, workerUser }) => {
    const a = (await workerUser.api.meData()).address[0];
    await expect(u.orderDetail.itemNames).toHaveText([PRODUCTS[8].name]);
    await expect(u.orderDetail.itemQuantities).toHaveText(['Qty: 2']);
    await expect(u.orderDetail.deliveryAddress).toContainText(a.street);
    await expect(u.orderDetail.shippingEmail).toHaveText(a.email);
  });
  test('Continue Shopping returns home', async ({ u, userPage }) => {
    await u.orderDetail.continueShopping.click();
    await expect(userPage).toHaveURL(/\/$/);
  });
  test('hard refresh keeps the page rendered @known-bug', async ({ u }, testInfo) => {
    bug(testInfo, 'STORE-001: nested routes break on hard load');
    await u.orderDetail.gotoOrderDirect(orderId);
    await expect(u.orderDetail.confirmedTitle).toBeVisible({ timeout: 8_000 });
  });
  test('another user cannot view the order @known-bug', async ({ freshUser }, testInfo) => {
    bug(testInfo, 'STORE-045: /findOrder has no ownership check');
    expect((await freshUser.api.findOrder(orderId)).status()).toBe(403);
  });
});

test.describe('Account @account @regression', () => {
  test('profile card, menu and default panel', async ({ u, workerUser }, testInfo) => {
    await u.account.goto();
    await u.account.waitForLoaded();
    await maybeFlakeOn(u.account.profileName, testInfo, 0.25);
    await expect(u.account.profileName).toHaveText(`${workerUser.user.firstname} ${workerUser.user.lastname}`);
    await expect(u.account.profileEmail).toHaveText(workerUser.user.email);
    await expect(u.account.menuItems.getByTestId('menu-item-label')).toHaveText(['My Profile', 'My Orders', 'Addresses', 'Log Out']);
    await expect(u.account.profileTitle).toBeVisible();
  });
  test('profile details are pre-filled and email is read-only', async ({ u, workerUser }) => {
    await u.account.goto();
    await u.account.waitForLoaded();
    await expect(u.account.firstnameInput).toHaveValue(workerUser.user.firstname);
    await expect(u.account.emailInput).toBeDisabled();
  });
  test('contact number must be 10 digits', async ({ u }) => {
    await u.account.goto();
    await u.account.waitForLoaded();
    await u.account.contactInput.fill('12345');
    await u.account.updateButton.click();
    await expect(u.account.page.getByText('Contact number must be 10 digits')).toBeVisible();
  });
  test('weak new password is rejected', async ({ u }) => {
    await u.account.goto();
    await u.account.waitForLoaded();
    await u.account.securityTab.click();
    await u.account.newPassword.fill('lowercase1!');
    await u.account.confirmPassword.fill('lowercase1!');
    await u.account.resetPasswordButton.click();
    await expect(u.account.page.getByText('Password must contain at least one uppercase letter')).toBeVisible();
  });
  test('password can be changed and the new one works @critical', async ({ u, workerUser }) => {
    await u.account.goto();
    await u.account.waitForLoaded();
    await u.account.securityTab.click();
    await u.account.newPassword.fill('Updated@2026');
    await u.account.confirmPassword.fill('Updated@2026');
    await u.account.resetPasswordButton.click();
    await u.account.expectToast('Password updated successfully');
    expect((await workerUser.api.login({ email: workerUser.user.email, password: 'Updated@2026' })).ok()).toBeTruthy();
    await workerUser.api.resetPassword(workerUser.user.email, workerUser.user.password);
  });
  test('addresses panel lists the saved address', async ({ u, workerUser }) => {
    await u.account.goto();
    await u.account.waitForLoaded();
    await u.account.openAddresses();
    const a = (await workerUser.api.meData()).address[0];
    await expect(u.account.addressNames.first()).toHaveText(a.firstname!);
    await expect(u.account.addressCards.first()).toContainText(a.street);
  });
  test('orders panel lists placed orders and can cancel', async ({ freshUser }) => {
    const id = await placeApiOrder(freshUser.api, freshUser.user.email, [{ idx: 0, qty: 1 }]);
    const a = freshUser.pages.account;
    await a.goto();
    await a.waitForLoaded();
    await a.openOrders();
    await expect(a.orderIds.first()).toHaveText(id.slice(-6));
    await expect(a.orderStatuses.first()).toContainText('Processing');
    await a.orderCancelButtons.first().click();
    await a.cancelDialogConfirm.click();
    await a.expectToast('Order cancelled successfully');
    await expect(a.noOrdersTitle).toBeVisible({ timeout: 8_000 });
  });
  test('orders are grouped per order, not per product @known-bug', async ({ freshUser }, testInfo) => {
    bug(testInfo, 'STORE-061: history flattens products into rows');
    await placeApiOrder(freshUser.api, freshUser.user.email, [0, 1, 2].map((idx) => ({ idx, qty: 1 })));
    const a = freshUser.pages.account;
    await a.goto();
    await a.waitForLoaded();
    await a.openOrders();
    await expect(a.ordersCount).toHaveText('Showing 1 of 1 orders');
  });
});
