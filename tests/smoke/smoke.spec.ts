import { test, expect } from '../../fixtures';

/**
 * Fast, high-confidence checks that the site is up and each primary route
 * renders its own content. Runs on every project including mobile/tablet -
 * this is the tier that must stay green within seconds, not minutes.
 */
test.describe('Smoke suite', { tag: '@smoke' }, () => {
  test('home page loads', async ({ homePage, page }) => {
    const response = await page.goto(homePage.path);
    expect(response?.status()).toBe(200);
    await expect(homePage.heading).toBeVisible();
    await expect(page).toHaveTitle(/Vinay Ranjan/);
  });

  test('work page loads', async ({ workPage, page }) => {
    const response = await page.goto(workPage.path);
    expect(response?.status()).toBe(200);
    await expect(workPage.heading).toHaveText(/professional work/i);
    await expect(workPage.projectCards.first()).toBeVisible();
  });

  test('blog page loads', async ({ blogPage, page }) => {
    const response = await page.goto(blogPage.path);
    expect(response?.status()).toBe(200);
    await expect(blogPage.posts.first()).toBeVisible();
  });

  test('contact page loads', async ({ contactPage, page }) => {
    const response = await page.goto(contactPage.path);
    expect(response?.status()).toBe(200);
    await expect(contactPage.form).toBeVisible();
  });

  test('primary navigation is present on every page', async ({ homePage }) => {
    await homePage.goto();
    // At narrow viewports the desktop link list is hidden and only the
    // hamburger button is visible (opening it, and that it reveals working
    // links, is covered by tests/navigation) - just confirm whichever
    // navigation entry point applies at this viewport is on screen.
    // Both elements always exist in the DOM (one is merely CSS-hidden), so
    // `.or()` can't disambiguate by visibility - poll each directly instead
    // of racing a single isVisible() snapshot against CSS/layout settling.
    await expect
      .poll(
        async () =>
          (await homePage.nav.desktopNav.isVisible()) ||
          (await homePage.nav.hamburgerButton.isVisible()),
        { timeout: 15_000 },
      )
      .toBe(true);

    const isDesktop = await homePage.nav.desktopNav.isVisible();
    const entryPoint = isDesktop ? homePage.nav.desktopNav : homePage.nav.hamburgerButton;
    await expect(entryPoint).toBeVisible();
  });
});
