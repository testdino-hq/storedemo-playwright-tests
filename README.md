# TestDino Demo Store – Playwright Test Suite

End-to-end, API, responsive, visual, accessibility and performance tests for
**https://storedemo.testdino.com** (React storefront) and its API
**https://storedemo-api.testdino.com/api**.

The suite is written the way a production regression pack would be – Page Object Model,
per-worker isolated users, storage-state auth, data-driven cases, tags, and known-bug
tracking – and it is also tuned to produce a **realistic mix of passing, failing and flaky
results** so TestDino reports have interesting data.

## Quick start

```bash
npm install
npx playwright install chromium
cp .env.example .env          # already done – adjust if needed
npx playwright test           # everything (setup → chromium + mobile-chrome + api)
npx playwright show-report    # open the HTML report
```

Useful subsets:

| Command | What it runs |
| --- | --- |
| `npx playwright test --grep @smoke` | availability + core journeys |
| `npx playwright test --grep @critical` | the must-pass business flows |
| `npx playwright test --project=chromium` | every browser suite on desktop Chrome |
| `npx playwright test --project=api` | pure API tests (no browser) |
| `npx playwright test --project=mobile-chrome` | responsive suites on a Pixel 7 profile |
| `CROSS_BROWSER=1 npx playwright test --project=firefox --project=webkit` | smoke on Firefox + WebKit (`npx playwright install firefox webkit` first) |
| `CHAOS=off npx playwright test --grep-invert @known-bug` | chaos off + known bugs excluded → should be all green |
| `npx playwright test --grep @checkout` | any tag: `@auth @catalog @cart @wishlist @checkout @account @content @api @mobile @visual @a11y @perf @security @known-bug` |
| `npx playwright test tests/e2e/checkout` | a folder / file / `file:line` |

## Reporting to TestDino

Set `TESTDINO_TOKEN` (and optionally `TESTDINO_CI_RUN_ID`) in `.env` or the CI
environment. The `@testdino/playwright` reporter is added automatically when the token is
present. A GitHub Actions workflow with 4 shards + merged HTML report is in
`.github/workflows/playwright.yml`.

## Suite layout (suites → nested suites)

```
tests/
├── global.setup.ts            provisions the shared demo session (storage state)
├── smoke/                     Smoke → Storefront availability / Core journeys / Backend
├── e2e/
│   ├── auth/                  Login, Signup, Session & protected routes
│   ├── catalog/               Home, All Products, Search, Filters, Product detail, Reviews
│   ├── cart/                  Drawer, Cart page (+ pricing matrix), Persistence
│   ├── wishlist/              Empty state, With items, Cross-page consistency
│   ├── checkout/              Access, Shipping address, Payment methods, Order placement
│   ├── account/               Navigation, Profile (details/security), Addresses, Orders
│   └── content/               Header nav, Footer, Contact Us, Static/policy/FAQ/404/SEO
├── api/                       Health, Auth, User, Addresses, Orders, Security hardening
├── responsive/                Mobile navigation, Mobile shopping (mobile-chrome project)
├── visual/                    Screenshot baselines (tests/visual/__screenshots__)
├── accessibility/             axe-core WCAG 2.1 A/AA scans + keyboard/semantics
└── performance/               Navigation-timing budgets
src/
├── pages/                     Page objects (+ Header, Footer, CartDrawer components)
├── fixtures/test.ts           page-object fixtures, demoPage, per-worker user, freshUser
├── data/                      product catalog, users, addresses, payments
└── utils/                     ApiClient, chaos helper, localStorage seeding helpers
```

Every `describe` block maps to a suite in TestDino; folders give the top level, files the
second, and nested `describe`s the third.

## Test data & isolation

* **Shared demo account** (`DEMO_USER_*`) is only used read-only and for login tests.
* **Per-worker user** – `workerUser` registers a fresh account (with one address) via the
  API when a worker starts and deletes it at the end. `userPage` / `u` are authenticated
  as that user, so mutating tests never collide across parallel workers.
* **`freshUser`** – a test-scoped user with no addresses/orders for empty-state flows.
* Cart and wishlist live in `localStorage`; `seedCart` / `seedWishlist` inject state
  through `addInitScript` so tests start exactly where they need to.
* Deep links to `/product/:slug` and `/status/:id` go through the app's own
  `/?redirect=` mechanism because hard loads of nested routes are broken (see bugs below).

## Result mix (for demo data)

| Kind | How it is produced | Control |
| --- | --- | --- |
| **Passing** | ordinary assertions | – |
| **Failing** | tests tagged `@known-bug` assert the *intended* behaviour for real defects found in the codebase (annotated with a `STORE-xxx` issue id in the report) | `--grep-invert @known-bug` |
| **Flaky** | `src/utils/chaos.ts` – selected tests fail their *first* attempt with a realistic timeout error some of the time; with `retries: 2` Playwright marks them *flaky*. Performance budgets are also tightened on the first attempt. | `CHAOS=off`, `FLAKY_RATE=0.2` |
| **Skipped** | a handful of `test.skip`/`fixme` cases with reasons | – |

## Real defects surfaced by the suite (a selection)

| Id | Where | Defect |
| --- | --- | --- |
| STORE-001 | hosting | `index.html` uses relative asset paths → hard-loading `/product/*` or `/status/*` yields a blank page (`Unexpected token '<'`) |
| STORE-002/003 | checkout | UI reads `address.firstName` but API returns `firstname`; UI posts `firstName` but API stores `firstname` |
| STORE-004 | profile | profile update sends `firstname` while API expects `firstName` → first-name changes silently ignored |
| STORE-030 | checkout | the empty-cart branch with `data-testid`s is unreachable |
| STORE-031/035 | checkout | state/country and cardholder name are marked required but never validated |
| STORE-041/042 | catalog | products have no `category`; "Uncategorized" filter matches nothing; empty-state reset uses `[0, 100000]` |
| STORE-011 | footer | "COSTUMER POLICY" typo |
| STORE-118 | login | direct `/login` visit redirects to `/checkout` after sign-in |
| STORE-204 | API | `PUT /reset-password` is unauthenticated – anyone can reset any account |
| STORE-205/221/232 | API | IDOR on delete-user, add-address and cancel-order |
| STORE-230 | API | order `totalAmount` is trusted from the client |
| STORE-093/095 | wishlist/cart | duplicate `data-testid`s and missing test ids on the mobile cart layout |

## Conventions

* Selectors: `data-testid` first (`testIdAttribute` is configured), roles second.
* Never `waitForTimeout` – wait on state (`toHaveCount(0)` on skeletons, `waitForResponse`).
* Titles read as behaviour ("increment beyond 9 shows the limit toast"), tags at the end.
* Known bugs: tag `@known-bug` **and** push an `issue` annotation with the tracking id.
