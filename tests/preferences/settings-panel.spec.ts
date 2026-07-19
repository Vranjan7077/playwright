import { test, expect } from '../../fixtures';

test.describe('Settings panel', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  test('opens and closes via the open/close buttons', async ({ homePage }) => {
    await homePage.settings.open();
    expect(await homePage.settings.isOpen()).toBe(true);

    await homePage.settings.close();
    expect(await homePage.settings.isOpen()).toBe(false);
  });

  test('closes when clicking outside the dialog content', async ({ homePage, page }) => {
    await homePage.settings.open();
    // The dialog is a centered, auto-sized box; a click near the viewport
    // corner lands on its ::backdrop (which the app treats as "outside"),
    // not inside the modal content itself.
    await page.mouse.click(5, 5);
    expect(await homePage.settings.isOpen()).toBe(false);
  });

  test('High Contrast toggle updates aria-pressed, the <html> class, and localStorage', async ({
    homePage,
    page,
  }) => {
    await homePage.settings.open();
    expect(await homePage.settings.isPressed('High Contrast')).toBe(false);

    await homePage.settings.toggle('High Contrast').click();

    expect(await homePage.settings.isPressed('High Contrast')).toBe(true);
    await expect(page.locator('html')).toHaveClass(/high-contrast/);
    expect((await homePage.settings.readStoredPreferences()).contrastEnabled).toBe(true);
  });

  test('Reduce Motion toggle updates aria-pressed, the <html> class, and localStorage', async ({
    homePage,
    page,
  }) => {
    await homePage.settings.open();
    await homePage.settings.toggle('Reduce Motion').click();

    expect(await homePage.settings.isPressed('Reduce Motion')).toBe(true);
    await expect(page.locator('html')).toHaveClass(/reduce-motion/);
    expect((await homePage.settings.readStoredPreferences()).motionReduced).toBe(true);
  });

  test('preferences persist across a reload', async ({ homePage, page }) => {
    await homePage.settings.open();
    await homePage.settings.toggle('High Contrast').click();

    await page.reload();
    await expect(page.locator('html')).toHaveClass(/high-contrast/);
  });

  test('Reset Preferences clears storage and reloads the page', async ({ homePage, page }) => {
    await homePage.settings.open();
    await homePage.settings.toggle('High Contrast').click();

    // Reset is disabled (aria-disabled) until at least one preference is set,
    // and reload happens ~500-600ms after the click - wait for the actual
    // `load` event rather than a URL match, since the URL never changes.
    await Promise.all([page.waitForEvent('load'), homePage.settings.resetToggle.click()]);

    expect(await page.evaluate(() => localStorage.getItem('user-preferences'))).toBeNull();
    await expect(page.locator('html')).not.toHaveClass(/high-contrast/);
  });
});
