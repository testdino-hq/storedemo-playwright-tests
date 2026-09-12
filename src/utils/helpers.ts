import { expect, Page } from '@playwright/test';
import { Product, PRODUCTS } from '../data/products';
import type { ApiClient } from './api-client';

/** Parse "$1,560" -> 1560 */
export const parsePrice = (s: string) => parseFloat(s.replace(/[^0-9.]/g, ''));

/** react-hot-toast renders into [role="status"] elements */
export function toast(page: Page, text?: string | RegExp) {
  const all = page.locator('[role="status"]');
  return text ? all.filter({ hasText: text }) : all;
}

export async function expectToast(page: Page, text: string | RegExp, timeout = 10_000) {
  await expect(toast(page, text).first()).toBeVisible({ timeout });
}

/** Seed the redux-persisted cart directly (mirrors store/reducers/cartItems.jsx shape). */
export async function seedCart(page: Page, items: Array<{ product: Product; quantity?: number }>) {
  const payload = items.map(({ product, quantity }) => ({
    id: product.id,
    slug: product.slug,
    img: `/products/x.webp`,
    header: product.name,
    price: product.price,
    reviewCount: product.reviewCount,
    quantity: quantity ?? 1,
  }));
  await page.addInitScript((data) => {
    // init scripts run on every navigation – only seed once per tab so reloads keep user changes
    if (!window.sessionStorage.getItem('__pw_cart_seeded')) {
      window.localStorage.setItem('cartItems', JSON.stringify(data));
      window.sessionStorage.setItem('__pw_cart_seeded', '1');
    }
  }, payload);
}

export async function seedWishlist(page: Page, products: Product[]) {
  const payload = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    img: `/products/x.webp`,
    header: p.name,
    price: p.price,
    reviewCount: p.reviewCount,
  }));
  await page.addInitScript((data) => {
    if (!window.sessionStorage.getItem('__pw_wishlist_seeded')) {
      window.localStorage.setItem('wishlistItems', JSON.stringify(data));
      window.sessionStorage.setItem('__pw_wishlist_seeded', '1');
    }
  }, payload);
}

export async function clearClientState(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.removeItem('cartItems');
    window.localStorage.removeItem('wishlistItems');
  });
}

export async function readLocalStorage<T = unknown>(page: Page, key: string): Promise<T | null> {
  const raw = await page.evaluate((k) => window.localStorage.getItem(k), key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Logs in through the UI and lands on /account via client-side navigation.
 * Needed for profile/address mutations: the app keeps the user id in non-persisted
 * Redux state that is only populated by the login mutation (STORE-005: a hard reload of
 * /account breaks "add address" / "update profile" for real users too).
 */
export async function loginViaUi(page: Page, creds: { email: string; password: string }) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.getByTestId('login-email-input').fill(creds.email);
  await page.getByTestId('login-password-input').fill(creds.password);
  await page.getByTestId('login-submit-button').click();
  await expect(toast(page, 'Logged in successfully').first()).toBeVisible();
  await page.getByTestId('header-user-icon').first().click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByTestId('loading-account-info')).toHaveCount(0, { timeout: 8_000 });
  await expect(page.getByTestId('user-profile-card')).toBeVisible({ timeout: 8_000 });
}

/** Creates an order through the API (the UI "Place Order" is broken – STORE-006). Returns the order id. */
export async function placeApiOrder(api: ApiClient, email: string, items: Array<{ idx: number; qty: number }>, paymentMethod = 'cod') {
  const me = await api.meData();
  const address = me.address[0] ?? { firstname: 'Fresh', email, street: '1 Test St', city: 'Testville', state: 'TS', zipCode: '00000', country: 'Testland' };
  const product = items.map((p) => ({ id: PRODUCTS[p.idx].id, slug: PRODUCTS[p.idx].slug, img: '', header: PRODUCTS[p.idx].name, price: PRODUCTS[p.idx].price, reviewCount: PRODUCTS[p.idx].reviewCount, quantity: p.qty }));
  const totalAmount = items.reduce((s, p) => s + PRODUCTS[p.idx].priceValue * p.qty, 0);
  const res = await api.createOrder({ product, quantity: product.length, address, paymentMethod, totalAmount, orderDate: Date.now(), email });
  const body = await res.json();
  if (!body?.orderId) throw new Error(`createOrder failed: ${res.status()} ${JSON.stringify(body)}`);
  return body.orderId as string;
}
