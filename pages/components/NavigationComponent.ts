import type { Locator, Page } from '@playwright/test';

/**
 * The header nav renders twice in the DOM (desktop list + mobile drawer list),
 * both matched by the same accessible names. Callers must scope to the
 * visible one via `desktop()`/`mobile()` rather than a bare getByRole lookup.
 */
export class NavigationComponent {
  readonly root: Locator;
  readonly desktopNav: Locator;
  readonly mobileNav: Locator;
  readonly hamburgerButton: Locator;
  readonly closeMenuButton: Locator;
  readonly mobileOverlay: Locator;
  readonly themeToggle: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('header.header');
    this.desktopNav = this.root.locator('[data-nav-type="desktop"]');
    this.mobileNav = this.root.locator('[data-nav-type="mobile"]');
    this.hamburgerButton = this.root.getByRole('button', { name: /menu button/i });
    this.closeMenuButton = this.root.getByRole('button', { name: /close menu/i });
    this.mobileOverlay = this.root.locator('.blur-container');
    this.themeToggle = page.getByRole('button', { name: /toggle theme/i });
  }

  desktopLink(name: string): Locator {
    return this.desktopNav.getByRole('link', { name, exact: true });
  }

  mobileLink(name: string): Locator {
    return this.mobileNav.getByRole('link', { name, exact: true });
  }

  async openMobileMenu(): Promise<void> {
    await this.hamburgerButton.click();
    await this.mobileOverlay.evaluate((el) => el.classList.contains('active'));
  }

  async closeMobileMenu(): Promise<void> {
    await this.closeMenuButton.click();
  }

  async isMobileMenuOpen(): Promise<boolean> {
    return this.mobileOverlay.evaluate((el) => el.classList.contains('active'));
  }

  async toggleTheme(): Promise<void> {
    // The toggle only becomes visible/interactive after scrolling past 100px
    // (see the site's scroll listener) - mirror real user behavior rather
    // than forcing a click through CSS that's deliberately hiding it.
    // window.scrollBy (not mouse.wheel) - the latter isn't supported in mobile WebKit.
    await this.page.evaluate(() => window.scrollBy(0, 200));
    await this.themeToggle.waitFor({ state: 'visible' });
    await this.themeToggle.click();
  }

  async currentTheme(): Promise<string | null> {
    return this.page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  }
}
