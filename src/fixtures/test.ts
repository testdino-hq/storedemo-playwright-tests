import { test as base, expect, Page, BrowserContext } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { HomePage, AllProductsPage, ProductDetailPage, CartPage, WishlistPage, LoginPage, SignupPage, CheckoutPage, OrderDetailPage, AccountPage, ContactUsPage, Header, Footer, CartDrawer } from '../pages';
import { ApiClient, provisionUser } from '../utils/api-client';
import { newUser, Credentials } from '../data/users';
import { ADDRESSES } from '../data/addresses';

export const BASE_URL = process.env.BASE_URL || 'https://storedemo.testdino.com';
export const DEMO_STORAGE_STATE = path.resolve(__dirname, '../../.auth/demo-user.json');

/** Builds a Playwright storageState that logs the app in (token lives in localStorage). */
export function storageStateFor(token: string) {
  return {
    cookies: [],
    origins: [{ origin: BASE_URL, localStorage: [{ name: 'user_access_token', value: token }] }],
  };
}

export interface WorkerUser {
  user: Required<Credentials>;
  id: string;
  token: string;
  api: ApiClient;
  addressId: string;
}

type Pages = {
  home: HomePage;
  products: AllProductsPage;
  pdp: ProductDetailPage;
  cart: CartPage;
  wishlist: WishlistPage;
  login: LoginPage;
  signup: SignupPage;
  checkout: CheckoutPage;
  orderDetail: OrderDetailPage;
  account: AccountPage;
  contact: ContactUsPage;
  header: Header;
  footer: Footer;
  drawer: CartDrawer;
};

type TestFixtures = Pages & {
  /** Page authenticated as the shared demo user (read-only usage!). */
  demoPage: Page;
  /** Page authenticated as this worker's freshly-provisioned user (safe to mutate). */
  userPage: Page;
  userContext: BrowserContext;
  /** Page objects bound to `userPage` */
  u: Pages;
  api: ApiClient;
  /** A brand-new user with NO addresses/orders, plus an authenticated page – test-scoped, cleaned up after. */
  freshUser: { user: Required<Credentials>; id: string; token: string; api: ApiClient; page: Page; pages: Pages };
};

type WorkerFixtures = {
  workerUser: WorkerUser;
};

function buildPages(page: Page): Pages {
  return {
    home: new HomePage(page),
    products: new AllProductsPage(page),
    pdp: new ProductDetailPage(page),
    cart: new CartPage(page),
    wishlist: new WishlistPage(page),
    login: new LoginPage(page),
    signup: new SignupPage(page),
    checkout: new CheckoutPage(page),
    orderDetail: new OrderDetailPage(page),
    account: new AccountPage(page),
    contact: new ContactUsPage(page),
    header: new Header(page),
    footer: new Footer(page),
    drawer: new CartDrawer(page),
  };
}

/** Abort images/fonts/analytics – they are not asserted on and dominate page-load time. */
const HEAVY_ASSETS = /\.(png|jpe?g|webp|gif|svg|ico|woff2?|ttf)(\?|$)|googletagmanager|google-analytics|fonts\.g/;
async function blockHeavyAssets(context: BrowserContext) {
  await context.route(HEAVY_ASSETS, (route) => route.abort());
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  context: async ({ context }, use) => {
    await blockHeavyAssets(context);
    await use(context);
  },
  // ---- page objects on the default (anonymous) page ----
  home: async ({ page }, use) => use(new HomePage(page)),
  products: async ({ page }, use) => use(new AllProductsPage(page)),
  pdp: async ({ page }, use) => use(new ProductDetailPage(page)),
  cart: async ({ page }, use) => use(new CartPage(page)),
  wishlist: async ({ page }, use) => use(new WishlistPage(page)),
  login: async ({ page }, use) => use(new LoginPage(page)),
  signup: async ({ page }, use) => use(new SignupPage(page)),
  checkout: async ({ page }, use) => use(new CheckoutPage(page)),
  orderDetail: async ({ page }, use) => use(new OrderDetailPage(page)),
  account: async ({ page }, use) => use(new AccountPage(page)),
  contact: async ({ page }, use) => use(new ContactUsPage(page)),
  header: async ({ page }, use) => use(new Header(page)),
  footer: async ({ page }, use) => use(new Footer(page)),
  drawer: async ({ page }, use) => use(new CartDrawer(page)),

  api: async ({}, use) => {
    const client = await ApiClient.create();
    await use(client);
    await client.dispose();
  },

  // ---- shared demo user (storage state produced by global.setup.ts) ----
  demoPage: async ({ browser }, use) => {
    if (!fs.existsSync(DEMO_STORAGE_STATE)) throw new Error('Run the "setup" project first – demo storage state missing');
    const context = await browser.newContext({ storageState: DEMO_STORAGE_STATE });
    await blockHeavyAssets(context);
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // ---- per-worker isolated user ----
  workerUser: [
    async ({}, use, workerInfo) => {
      const creds = newUser(`w${workerInfo.workerIndex}`);
      const { api, id, token } = await provisionUser(creds);
      const a = ADDRESSES[workerInfo.workerIndex % ADDRESSES.length];
      const addr = await api.addAddress(id, { firstname: a.firstName, email: a.email, street: a.street, city: a.city, state: a.state, zipCode: a.zipCode, country: a.country });
      const addrBody = await addr.json();
      const addressId: string = addrBody?.data?.user?.addresses?.[0]?._id ?? '';
      await use({ user: creds, id, token, api, addressId });
      try {
        await api.deleteUser(id);
      } catch {
        /* best-effort cleanup */
      }
      await api.dispose();
    },
    { scope: 'worker' },
  ],

  userContext: async ({ browser, workerUser }, use) => {
    const context = await browser.newContext({ storageState: storageStateFor(workerUser.token) });
    await blockHeavyAssets(context);
    await use(context);
    await context.close();
  },

  userPage: async ({ userContext }, use) => {
    const page = await userContext.newPage();
    await use(page);
  },

  u: async ({ userPage }, use) => use(buildPages(userPage)),

  freshUser: async ({ browser }, use, testInfo) => {
    const creds = newUser(`fresh${testInfo.workerIndex}`);
    const { api, id, token } = await provisionUser(creds);
    const context = await browser.newContext({ storageState: storageStateFor(token) });
    await blockHeavyAssets(context);
    const page = await context.newPage();
    await use({ user: creds, id, token, api, page, pages: buildPages(page) });
    await context.close();
    try {
      await api.deleteUser(id);
    } catch {
      /* best-effort cleanup */
    }
    await api.dispose();
  },
});

export { expect, buildPages };
