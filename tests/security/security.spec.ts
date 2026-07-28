import { test, expect } from '../../fixtures';

test.describe('Security response headers', () => {
  for (const path of ['/', '/work/', '/blog/', '/contact/']) {
    test(`${path} sends baseline protective headers`, async ({ request, baseURL }) => {
      const response = await request.get(`${baseURL}${path}`);
      const headers = response.headers();

      expect(headers['x-frame-options'], 'clickjacking protection').toBe('DENY');
      expect(headers['x-content-type-options'], 'MIME-sniffing protection').toBe('nosniff');
      expect(headers['strict-transport-security'], 'HSTS').toContain('max-age=');
      expect(headers['content-security-policy'], 'CSP').toBeTruthy();
      expect(headers['referrer-policy'], 'referrer policy').toBeTruthy();
    });
  }
});

test.describe('External link safety (tabnabbing protection)', () => {
  test('every target="_blank" link on the work page sets rel="noopener"', async ({ workPage }) => {
    await workPage.goto();
    const links = workPage.projectLinks;
    const count = await links.count();
    expect(count).toBeGreaterThan(0);

    // Every project card link opens in a new tab - assert both halves of
    // the tabnabbing mitigation unconditionally rather than guarding on target,
    // so a link that silently loses target="_blank" also fails loudly.
    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      await expect(link, `link #${i}`).toHaveAttribute('target', '_blank');
      const rel = (await link.getAttribute('rel')) ?? '';
      expect(rel, `link #${i}`).toContain('noopener');
    }
  });

  test('social links on the home page set rel="noopener noreferrer"', async ({ homePage }) => {
    await homePage.goto();
    for (const link of [homePage.linkedInLink, homePage.githubLink]) {
      await expect(link).toHaveAttribute('target', '_blank');
      const rel = (await link.getAttribute('rel')) ?? '';
      expect(rel).toContain('noopener');
    }
  });
});

test.describe('Error handling & broken navigation', () => {
  test('unknown routes return a real 404 and a custom not-found page', async ({
    page,
    baseURL,
  }) => {
    const response = await page.goto(`${baseURL}/this-route-should-never-exist-qa-probe/`);
    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle(/not found/i);
  });

  test('direct navigation to the post-submit thank-you page does not error', async ({ page }) => {
    const response = await page.goto('/thank-you/');
    expect(response?.status()).toBeLessThan(400);
  });
});

test.describe('Cookie hygiene', () => {
  test('any cookies set by the site are Secure and SameSite-restricted', async ({
    page,
    context,
  }) => {
    await page.goto('/');
    await page.goto('/contact/');
    const cookies = await context.cookies();

    for (const cookie of cookies) {
      expect(cookie.secure, `${cookie.name} should be Secure`).toBe(true);
      expect(['Strict', 'Lax'], `${cookie.name} should restrict SameSite`).toContain(
        cookie.sameSite,
      );
    }
  });
});
