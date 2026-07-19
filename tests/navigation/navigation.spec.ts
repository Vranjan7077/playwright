import { test, expect } from '../../fixtures';

test.describe('Primary navigation', () => {
  test('desktop nav links navigate to the correct page and mark it active', async ({
    homePage,
    page,
  }) => {
    await homePage.goto();
    // eslint-disable-next-line playwright/no-skipped-test -- responsive layout: this nav variant isn't present at narrow viewports
    test.skip(
      !(await homePage.nav.desktopNav.isVisible()),
      'desktop nav is hidden at this viewport',
    );

    const destinations: { label: string; path: string; dataCurrent: string }[] = [
      { label: 'Work', path: '/work/', dataCurrent: 'work' },
      { label: 'Blog', path: '/blog/', dataCurrent: 'blog' },
      { label: 'Contact', path: '/contact/', dataCurrent: 'contact' },
      { label: 'Home', path: '/', dataCurrent: 'home' },
    ];

    for (const destination of destinations) {
      await homePage.nav.desktopLink(destination.label).click();
      await expect(page).toHaveURL(new RegExp(`${destination.path.replace(/\//g, '\\/')}$`));
      await expect(page.locator('html')).toHaveAttribute('data-current', destination.dataCurrent);
      await expect(homePage.nav.desktopLink(destination.label)).toHaveAttribute(
        'aria-current',
        'page',
      );
    }
  });

  test('mobile hamburger menu opens, links work, and closes', async ({ homePage, page }) => {
    await homePage.goto();
    // eslint-disable-next-line playwright/no-skipped-test -- responsive layout: hamburger only renders at narrow viewports
    test.skip(
      !(await homePage.nav.hamburgerButton.isVisible()),
      'hamburger button is hidden at this viewport',
    );

    await homePage.nav.openMobileMenu();
    expect(await homePage.nav.isMobileMenuOpen()).toBe(true);
    await expect(homePage.nav.mobileLink('Work')).toBeVisible();

    await homePage.nav.mobileLink('Work').click();
    await expect(page).toHaveURL(/\/work\/$/);
  });

  test('mobile menu closes via the close button', async ({ homePage }) => {
    await homePage.goto();
    // eslint-disable-next-line playwright/no-skipped-test -- responsive layout: hamburger only renders at narrow viewports
    test.skip(
      !(await homePage.nav.hamburgerButton.isVisible()),
      'hamburger button is hidden at this viewport',
    );
    await homePage.nav.openMobileMenu();
    await homePage.nav.closeMobileMenu();
    expect(await homePage.nav.isMobileMenuOpen()).toBe(false);
  });

  test('skip-to-main link moves focus past the header', async ({ homePage, page, browserName }) => {
    // WebKit only tabs through form controls by default, matching real Safari -
    // a platform default, not a defect in this site's markup. Checked by
    // engine, not project name, since Mobile Safari/Tablet are WebKit too.
    // eslint-disable-next-line playwright/no-skipped-test -- browser-default divergence, not app behavior
    test.skip(
      browserName === 'webkit',
      'WebKit does not tab through links by default (matches Safari)',
    );

    // A freshly loaded page starts with no focused element - no need to
    // (and clicking near the top-left corner would actually focus the
    // header logo link that sits there, not "reset" anything).
    await homePage.goto();
    await page.keyboard.press('Tab');
    await expect(homePage.skipLink).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(homePage.main).toBeFocused();
  });

  test('back-to-top button appears on scroll and returns focus to main content', async ({
    homePage,
  }) => {
    await homePage.goto();
    await expect(homePage.backToTopButton).not.toBeInViewport();

    await homePage.scrollDown(600);
    await expect(homePage.backToTopButton).toBeVisible();

    await homePage.backToTopButton.click();
    await expect(homePage.main).toBeFocused();
  });
});
