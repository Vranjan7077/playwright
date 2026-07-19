import { test, expect } from '../../fixtures';
import { collectPageDiagnostics, isThirdParty } from '../../utils/diagnostics';

const pagesUnderTest: { name: string; path: string }[] = [
  { name: 'Home', path: '/' },
  { name: 'Work', path: '/work/' },
  { name: 'Blog', path: '/blog/' },
  { name: 'Contact', path: '/contact/' },
];

test.describe('Console & network health', () => {
  for (const { name, path } of pagesUnderTest) {
    test(`${name} page loads with no first-party console errors or failed requests`, async ({
      page,
      baseURL,
    }) => {
      const diagnostics = collectPageDiagnostics(page);
      await page.goto(path);
      // Deliberate use of networkidle: we need every request (including
      // late-firing analytics/fonts) to have settled before asserting on
      // collected diagnostics - there's no visible element to wait on instead.
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      const siteOrigin = new URL(baseURL ?? 'https://vranjan.dev').origin;
      const firstPartyErrors = diagnostics.consoleErrors;
      const firstPartyFailures = diagnostics.failedRequests.filter(
        (r) => !isThirdParty(r.url, siteOrigin),
      );

      expect(diagnostics.pageErrors, 'uncaught JS exceptions').toEqual([]);
      expect(firstPartyErrors, 'console.error calls').toEqual([]);
      expect(firstPartyFailures, 'failed first-party network requests').toEqual([]);
    });
  }
});

test.describe('Load timing', () => {
  for (const { name, path } of pagesUnderTest) {
    test(`${name} page: DOMContentLoaded and Largest Contentful Paint stay within budget`, async ({
      page,
    }) => {
      await page.addInitScript(() => {
        (window as unknown as { __lcp: number }).__lcp = 0;
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          if (last) (window as unknown as { __lcp: number }).__lcp = last.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      });

      await page.goto(path);
      await page.waitForLoadState('load');

      const timing = await page.evaluate(() => {
        const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (!nav) throw new Error('No navigation timing entry recorded');
        return {
          domContentLoaded: nav.domContentLoadedEventEnd,
          loadComplete: nav.loadEventEnd,
        };
      });
      const lcp = await page.evaluate(() => (window as unknown as { __lcp: number }).__lcp);

      // Generous budgets: this suite runs against the real production domain
      // over whatever network the CI runner has, not a local server - the
      // goal is catching gross regressions, not micro-benchmarking.
      expect(timing.domContentLoaded, 'DOMContentLoaded (ms)').toBeLessThan(8_000);
      expect(timing.loadComplete, 'window load (ms)').toBeLessThan(12_000);
      expect(lcp, 'Largest Contentful Paint (ms)').toBeLessThan(5_000);
    });
  }
});

test.describe('Resource weight guard', () => {
  test('no single first-party resource on the home page exceeds 3MB', async ({ page, baseURL }) => {
    const siteOrigin = new URL(baseURL ?? 'https://vranjan.dev').origin;
    const oversized: { url: string; bytes: number }[] = [];

    page.on('response', async (response) => {
      if (isThirdParty(response.url(), siteOrigin)) return;
      const header = response.headers()['content-length'];
      const bytes = header ? Number(header) : 0;
      if (bytes > 3 * 1024 * 1024) {
        oversized.push({ url: response.url(), bytes });
      }
    });

    await page.goto('/');
    // eslint-disable-next-line playwright/no-networkidle -- need all resources settled before asserting sizes
    await page.waitForLoadState('networkidle');

    expect(oversized).toEqual([]);
  });
});
