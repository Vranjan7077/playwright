import type { Locator, Page } from '@playwright/test';
import { NavigationComponent } from './components/NavigationComponent';
import { SettingsModalComponent } from './components/SettingsModalComponent';

/**
 * Shared chrome present on (almost) every page: skip link, nav, settings
 * modal, back-to-top. Concrete pages extend this and add page-specific
 * locators/actions rather than re-declaring the chrome each time.
 */
export abstract class BasePage {
  readonly nav: NavigationComponent;
  readonly settings: SettingsModalComponent;
  readonly skipLink: Locator;
  readonly backToTopButton: Locator;
  readonly main: Locator;

  protected constructor(protected readonly page: Page) {
    this.nav = new NavigationComponent(page);
    this.settings = new SettingsModalComponent(page);
    this.skipLink = page.locator('#skip-to-main');
    this.backToTopButton = page.getByRole('button', { name: /scroll to top of page/i });
    this.main = page.locator('#main-content');
  }

  abstract readonly path: string;

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }

  /**
   * Back-to-top only appears once scrollY > 300 (site's own threshold).
   * Uses window.scrollBy rather than mouse.wheel - the latter isn't
   * supported in mobile WebKit (Mobile Safari / iPad emulation).
   */
  async scrollDown(pixels = 500): Promise<void> {
    await this.page.evaluate((y) => window.scrollBy(0, y), pixels);
  }
}
