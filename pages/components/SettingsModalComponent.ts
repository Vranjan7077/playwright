import type { Locator, Page } from '@playwright/test';

export type SettingsToggleName =
  'CSS' | 'Web Fonts' | 'High Contrast' | 'Reduce Motion' | 'Terminal Mode';

/**
 * The site persists these preferences to localStorage under `user-preferences`
 * and applies them as classes on <html>. Tests assert both the visible
 * aria-pressed state and the underlying storage/DOM effect.
 */
export class SettingsModalComponent {
  readonly openButton: Locator;
  readonly dialog: Locator;
  readonly closeButton: Locator;
  readonly resetToggle: Locator;

  constructor(private readonly page: Page) {
    this.openButton = page.getByRole('button', { name: /open site settings/i });
    this.dialog = page.locator('#settings-modal');
    this.closeButton = page.getByRole('button', { name: /close settings/i });
    this.resetToggle = this.dialog.getByRole('button', { name: /toggle reset preferences/i });
  }

  toggle(name: SettingsToggleName): Locator {
    return this.dialog.getByRole('button', { name: new RegExp(`toggle ${name}`, 'i') });
  }

  async open(): Promise<void> {
    await this.openButton.click();
    await this.dialog.waitFor({ state: 'visible' });
  }

  async close(): Promise<void> {
    await this.closeButton.click();
  }

  async isOpen(): Promise<boolean> {
    return this.dialog.isVisible();
  }

  async isPressed(name: SettingsToggleName): Promise<boolean> {
    return (await this.toggle(name).getAttribute('aria-pressed')) === 'true';
  }

  async readStoredPreferences(): Promise<Record<string, unknown>> {
    return this.page.evaluate(() => JSON.parse(localStorage.getItem('user-preferences') ?? '{}'));
  }
}
