import { test, expect } from '../../fixtures';

/**
 * Scoped, masked screenshots rather than full-page captures. This is a live
 * production site: the blog list grows, footer shows a relative build time
 * and a live-measured load time, and images are lazy-loaded. Full-page diffs
 * against that content would be noise, not signal - so each test targets a
 * structurally stable region and masks the few dynamic bits inside it.
 */
test.describe('Visual regression', () => {
  test('header - light theme', async ({ homePage, page }) => {
    await homePage.goto();
    await expect(page.locator('header.header')).toHaveScreenshot('header-light.png');
  });

  test('header - dark theme', async ({ homePage, page }) => {
    await homePage.goto();
    await homePage.nav.toggleTheme();
    await expect(page.locator('header.header')).toHaveScreenshot('header-dark.png');
  });

  test('footer skeleton (dynamic timestamps masked)', async ({ homePage, page }) => {
    await homePage.goto();
    const footer = page.locator('footer.footer');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toHaveScreenshot('footer.png', {
      mask: [page.locator('#loadtime'), page.locator('#relative-build-time')],
    });
  });

  test('contact form', async ({ contactPage }) => {
    await contactPage.goto();
    await expect(contactPage.form).toHaveScreenshot('contact-form.png');
  });

  test('work page project grid', async ({ workPage, page }) => {
    await workPage.goto();
    await expect(workPage.projectCards.first()).toBeVisible();
    await expect(page.locator('.professional-grid')).toHaveScreenshot('work-grid.png', {
      mask: [page.locator('.professional-grid img')],
    });
  });

  test('home hero section', async ({ homePage, page }) => {
    await homePage.goto();
    await expect(page.locator('.page-container__about')).toHaveScreenshot('home-hero.png');
  });
});

test.describe('Visual regression - mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('home page header on mobile', async ({ homePage, page }) => {
    await homePage.goto();
    await expect(page.locator('header.header')).toHaveScreenshot('header-mobile.png');
  });
});
