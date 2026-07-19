import { test, expect } from '../../fixtures';

test.describe('Theme toggle', () => {
  test('switches data-theme and persists the choice to localStorage', async ({
    homePage,
    page,
  }) => {
    await homePage.goto();
    const initialTheme = await homePage.nav.currentTheme();

    await homePage.nav.toggleTheme();

    const newTheme = await homePage.nav.currentTheme();
    expect(newTheme).not.toBe(initialTheme);
    expect(['light', 'dark']).toContain(newTheme);

    const stored = await page.evaluate(() => localStorage.getItem('theme'));
    expect(stored).toBe(newTheme);
  });

  test('persists the chosen theme across a reload', async ({ homePage, page }) => {
    await homePage.goto();
    await homePage.nav.toggleTheme();
    const themeAfterToggle = await homePage.nav.currentTheme();

    await page.reload();

    expect(await homePage.nav.currentTheme()).toBe(themeAfterToggle);
  });

  test('is not shown on the contact page', async ({ contactPage }) => {
    await contactPage.goto();
    await contactPage.scrollDown(600);
    await expect(contactPage.nav.themeToggle).toBeHidden();
  });
});
