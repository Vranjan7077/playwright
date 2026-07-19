import type { Page, Request, Response } from '@playwright/test';

export interface PageDiagnostics {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: { url: string; status: number; method: string }[];
}

/**
 * Attaches listeners that record console errors, uncaught exceptions, and
 * non-2xx/3xx responses for the lifetime of the page. Call this before
 * navigating so nothing that happens during page load is missed.
 */
export function collectPageDiagnostics(page: Page): PageDiagnostics {
  const diagnostics: PageDiagnostics = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
  };

  page.on('console', (message) => {
    if (message.type() === 'error') {
      diagnostics.consoleErrors.push(message.text());
    }
  });

  page.on('pageerror', (error) => {
    diagnostics.pageErrors.push(error.message);
  });

  page.on('response', (response: Response) => {
    const status = response.status();
    if (status >= 400) {
      const request: Request = response.request();
      diagnostics.failedRequests.push({ url: response.url(), status, method: request.method() });
    }
  });

  return diagnostics;
}

/**
 * Third-party embeds (Disqus, Google Tag Manager) occasionally log console
 * noise or transient 4xx we don't own and can't fix. Filter by hostname
 * rather than suppressing errors wholesale so first-party regressions still fail.
 */
export function isThirdParty(url: string, siteOrigin: string): boolean {
  try {
    return new URL(url).origin !== siteOrigin;
  } catch {
    return false;
  }
}
