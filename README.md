# TestDino Demo Store – Playwright Test Suite

Fast demo-sized test suite for **https://storedemo.testdino.com** (React storefront) and its API
**https://storedemo-api.testdino.com/api**. 172 tests, ~45 s locally, built the way a
production regression pack would be – Page Object Model, per-worker isolated users,
storage-state auth, tags and known-bug tracking – and tuned to produce a realistic mix of
**passing, failing and flaky** results for TestDino reports.

## Quick start

```bash
npm install
npx playwright install chromium
cp .env.example .env          # set TESTDINO_TOKEN to stream results to TestDino
npx playwright test           # everything: setup → chromium + known-bugs + mobile-chrome + api
npx playwright show-report
```

| Command | What it runs |
| --- | --- |
| `npx playwright test --grep @smoke` | availability + core journeys |
| `npx playwright test --grep @critical` | must-pass business flows |
| `npx playwright test --project=chromium` | desktop UI suites (known bugs excluded) |
| `npx playwright test --project=known-bugs` | only the tests documenting real defects |
| `npx playwright test --project=api` | API tests, no browser |
| `npx playwright test --project=mobile-chrome` | Pixel 7 responsive checks |
| `CHAOS=off npx playwright test --project=chromium --project=api` | deterministic, all green |
| `npx playwright test tests/e2e/products.spec.ts:42` | a file / `file:line` |

Tags: `@smoke @critical @regression @auth @catalog @cart @wishlist @checkout @account @content @api @mobile @security @known-bug`.

## Layout

```
tests/
├── global.setup.ts              provisions the shared demo session (storage state)
├── smoke/smoke.spec.ts          Storefront availability / Core journeys / Backend
├── api/api.spec.ts              Health / Authentication / User & addresses / Orders / Security
├── e2e/auth.spec.ts             Login / Signup / Session & protected routes
├── e2e/home.spec.ts             hero, tiles, carousels, newsletter
├── e2e/products.spec.ts         Listing, search & filters / Product detail / Reviews
├── e2e/cart-wishlist.spec.ts    Drawer / Cart page / Wishlist
├── e2e/checkout-account.spec.ts Checkout / Order confirmation / Account
├── e2e/content.spec.ts          Header & footer / Contact Us / Static pages
└── responsive/mobile.spec.ts    mobile navigation & layout
src/
├── pages/            page objects (+ Header, Footer, CartDrawer components)
├── fixtures/test.ts  page-object fixtures, demoPage, per-worker user, freshUser, asset blocking
├── data/             product catalog, users, addresses, payments
└── utils/            ApiClient, chaos helper, localStorage seeding, loginViaUi, placeApiOrder
```

Folders → files → nested `describe`s map to suites → sub-suites in TestDino.

## Projects & speed

| Project | Content | Retries |
| --- | --- | --- |
| `setup` | logs the shared demo user in via the API, writes `.auth/demo-user.json` | – |
| `chromium` | all UI tests except `@known-bug` | 1 |
| `known-bugs` | UI tests tagged `@known-bug` (expected to fail) | 0 |
| `mobile-chrome` | `tests/responsive` on a Pixel 7 profile | 1 |
| `api` | `tests/api` | 0 |

Speed levers already applied: 16 workers, 3 s `expect` timeout, trace/video kept only for failures, images & fonts
blocked at the context level, failing tests never retried. To go below ~30 s run sharded in CI
(`--shard=1/4 … 4/4`, see `.github/workflows/playwright.yml`).

## Test data & isolation

* **Shared demo account** (`DEMO_USER_*`) – read-only usage and login tests.
* **`workerUser`** – a fresh account (with one address) registered per worker via the API and
  deleted afterwards; `userPage` / `u` are authenticated as it, so mutations never collide.
* **`freshUser`** – test-scoped user with no addresses/orders (used sparingly – it is slow).
* Cart/wishlist live in `localStorage`; `seedCart` / `seedWishlist` inject state once per tab.
* Deep links to `/product/:slug` and `/status/:id` use the app's own `/?redirect=` mechanism
  because hard loads of nested routes are broken (STORE-001).

## Result mix

| Kind | How | Control |
| --- | --- | --- |
| Failing | `@known-bug` tests assert the intended behaviour for real defects (annotated `STORE-xxx`) | `--project=chromium --project=api` |
| Flaky | `src/utils/chaos.ts` fails the *first* attempt some of the time with a realistic timeout error | `CHAOS=off`, `FLAKY_RATE=0.2` |
| Skipped | a `skip` and a `fixme` with reasons | – |

## Real defects surfaced (selection)

| Id | Defect |
| --- | --- |
| STORE-006 | **Place Order always fails with 401 "Token Missing"** – `createOrder` never attaches the JWT |
| STORE-001 | `index.html` uses relative asset paths → hard-loading `/product/*`, `/status/*` or any nested path renders a blank page |
| STORE-002/003/004 | `firstName`/`firstname` mismatches between UI and API in checkout and profile |
| STORE-057 | unknown product slug crashes `ProductDetail` (TDZ access in `useEffect`) |
| STORE-204 | `PUT /reset-password` is unauthenticated |
| STORE-205/232/045 | IDOR on delete-user, cancel-order and find-order |
| STORE-230 | order `totalAmount` trusted from the client |
| STORE-041 | products have no `category`; filter offers only All/Uncategorized |
| STORE-011 / 082 | footer "COSTUMER POLICY" typo; contact info block commented out |

## Conventions

* `data-testid` first, roles second; no `waitForTimeout`.
* Known bugs: tag `@known-bug` **and** push an `issue` annotation with the tracking id.
* Titles read as behaviour; tags at the end.
