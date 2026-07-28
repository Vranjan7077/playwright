import { test as base } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { HomePage } from '../pages/HomePage';
import { WorkPage } from '../pages/WorkPage';
import { BlogPage } from '../pages/BlogPage';
import { BlogPostPage } from '../pages/BlogPostPage';
import { ContactPage } from '../pages/ContactPage';

export interface FormSubmissionGuard {
  /** Change the HTTP status the mocked endpoint returns (default 200). */
  respondWith(status: number): void;
  /** Parsed body of the most recent intercepted POST, if any. */
  lastSubmission(): URLSearchParams | null;
  /** Number of POSTs the guard has intercepted so far this test. */
  interceptCount(): number;
}

interface Fixtures {
  homePage: HomePage;
  workPage: WorkPage;
  blogPage: BlogPage;
  blogPostPage: BlogPostPage;
  contactPage: ContactPage;
  formSubmissionGuard: FormSubmissionGuard;
  makeAxeBuilder: () => AxeBuilder;
}

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  workPage: async ({ page }, use) => {
    await use(new WorkPage(page));
  },
  blogPage: async ({ page }, use) => {
    await use(new BlogPage(page));
  },
  blogPostPage: async ({ page }, use) => {
    await use(new BlogPostPage(page));
  },
  contactPage: async ({ page }, use) => {
    await use(new ContactPage(page));
  },

  // Auto-applied for every test in the suite: the contact form POSTs to "/"
  // on the live production domain. Without this guard, any test that clicks
  // submit - intentionally or by accident - would create a real Netlify Forms
  // submission and notification email. Non-POST requests (page navigation,
  // assets) pass through untouched.
  formSubmissionGuard: [
    async ({ page, baseURL }, use) => {
      let status = 200;
      let submission: URLSearchParams | null = null;
      let count = 0;

      await page.route(`${baseURL}/`, async (route) => {
        if (route.request().method() !== 'POST') {
          await route.fallback();
          return;
        }
        count += 1;
        submission = new URLSearchParams(route.request().postData() ?? '');
        await route.fulfill({
          status,
          contentType: 'text/plain',
          body: status < 400 ? 'OK' : 'Simulated failure',
        });
      });

      await use({
        respondWith: (s: number) => {
          status = s;
        },
        lastSubmission: () => submission,
        interceptCount: () => count,
      });
    },
    { auto: true },
  ],

  makeAxeBuilder: async ({ page }, use) => {
    await use(() =>
      new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']),
    );
  },
});

export { expect } from '@playwright/test';
