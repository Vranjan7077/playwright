import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class WorkPage extends BasePage {
  readonly path = '/work/';

  readonly heading: Locator;
  readonly projectCards: Locator;
  readonly projectLinks: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.projectCards = page.locator('.professional-grid .container-wrapper');
    this.projectLinks = this.projectCards.getByRole('link');
  }
}
