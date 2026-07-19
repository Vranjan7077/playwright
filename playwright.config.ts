import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

/**
 * Base URL for the app under test. Override in CI to target a deploy-preview
 * or staging build instead of production.
 */
const BASE_URL = process.env.BASE_URL ?? 'https://vranjan.dev';

const CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : CI ? '50%' : undefined,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      // Live production content (build timestamps, ad-hoc copy changes) makes
      // pixel-perfect diffing noisy; a small tolerance absorbs anti-aliasing
      // and font-hinting differences without hiding real regressions.
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    },
  },
  // In CI, shards each produce a 'blob' report that a later CI job merges into
  // one HTML report (Playwright's recommended pattern for sharded runs) -
  // see .github/workflows/playwright.yml. Locally, generate everything directly.
  reporter: CI
    ? [
        ['list'],
        ['github'],
        ['blob', { outputFile: `blob-report/report-${process.env.SHARD_INDEX ?? 0}.zip` }],
      ]
    : [
        ['list'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
      ],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    ...(process.env.RECORD_HAR === '1'
      ? { recordHar: { path: 'test-results/network.har', mode: 'minimal' as const } }
      : {}),
  },

  projects: [
    // --- Primary desktop matrix: full functional + a11y + security + perf coverage ---
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/visual/**'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: ['**/visual/**'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: ['**/visual/**'],
    },

    // --- Mobile / tablet: golden-path coverage only (smoke, navigation, forms). ---
    // Full functional/a11y/security regression on every viewport is redundant cost
    // for a static content site — real cross-viewport risk is layout/interaction,
    // which smoke + navigation + forms already exercise.
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 7'] },
      testMatch: ['**/smoke/**', '**/navigation/**', '**/forms/**'],
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 14'] },
      testMatch: ['**/smoke/**', '**/navigation/**', '**/forms/**'],
    },
    {
      name: 'Tablet',
      use: { ...devices['iPad (gen 7)'] },
      testMatch: ['**/smoke/**', '**/navigation/**'],
    },

    // --- Visual regression: isolated project so baselines aren't multiplied
    // across every browser/device combination above. Chromium only, fixed
    // viewport, animations/motion disabled for determinism. ---
    {
      name: 'visual-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
        contextOptions: { reducedMotion: 'reduce' },
      },
      testMatch: ['**/visual/**'],
    },
  ],

  // No webServer entry: the app under test is a live, externally-hosted
  // site (BASE_URL), not something this repo builds or serves itself.
});
