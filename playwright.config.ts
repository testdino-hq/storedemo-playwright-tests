import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const isCI = !!process.env.CI;
const BASE_URL = process.env.BASE_URL || 'https://storedemo.testdino.com';
const crossBrowser = !!process.env.CROSS_BROWSER;

/**
 * TestDino Demo Store – Playwright test suite
 *
 * Projects
 *  - setup         : provisions the shared authenticated storage state (runs first)
 *  - chromium      : all UI suites (smoke, e2e, visual, a11y, performance)
 *  - mobile-chrome : responsive suites on a Pixel 7 profile
 *  - api           : pure API tests (no browser)
 *  - firefox/webkit: smoke + critical only, opt-in via CROSS_BROWSER=1
 */
export default defineConfig({
  testDir: './tests',
  snapshotDir: './tests/visual/__screenshots__',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: 1, // lets intermittent failures surface as "flaky"
  workers: isCI ? 8 : 16,
  timeout: 25 * 1000,
  expect: { timeout: 5 * 1000 },
  outputDir: 'test-results',

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['blob', { outputDir: 'blob-report' }],
    ...(process.env.TESTDINO_TOKEN
      ? ([['@testdino/playwright', { token: process.env.TESTDINO_TOKEN, ciRunId: process.env.TESTDINO_CI_RUN_ID }]] as any)
      : []),
  ],

  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 8 * 1000,
    navigationTimeout: 20 * 1000,
    testIdAttribute: 'data-testid',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      testIgnore: [/tests\/api\//, /tests\/responsive\//, /global\.setup\.ts/],
      grepInvert: /@known-bug/,
      dependencies: ['setup'],
    },
    {
      // Tests that document real defects – expected to fail, so never retried (keeps the run fast)
      name: 'known-bugs',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      testIgnore: [/tests\/api\//, /global\.setup\.ts/],
      grep: /@known-bug/,
      retries: 0,
      dependencies: ['setup'],
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      testMatch: /tests\/responsive\/.*\.spec\.ts/,
      grepInvert: /@known-bug/,
      dependencies: ['setup'],
    },
    {
      name: 'api',
      testMatch: /tests\/api\/.*\.spec\.ts/,
      retries: 0,
      use: { baseURL: (process.env.API_BASE_URL || 'https://storedemo-api.testdino.com/api').replace(/\/$/, '') + '/' },
    },
    ...(crossBrowser
      ? [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
            testMatch: /tests\/smoke\/.*\.spec\.ts/,
            dependencies: ['setup'],
          },
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
            testMatch: /tests\/smoke\/.*\.spec\.ts/,
            dependencies: ['setup'],
          },
        ]
      : []),
  ],
});
