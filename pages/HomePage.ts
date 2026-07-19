import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly path = '/';

  readonly heading: Locator;
  readonly downloadResumeLink: Locator;
  readonly linkedInLink: Locator;
  readonly githubLink: Locator;
  readonly skillsTabButton: Locator;
  readonly toolsTabButton: Locator;
  readonly lighthouseScores: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.downloadResumeLink = page.getByRole('link', { name: /download resume/i });
    this.linkedInLink = page.getByRole('link', { name: /connect with .* on linkedin/i });
    this.githubLink = page.getByRole('link', { name: /view .* projects on github/i });
    this.skillsTabButton = page.getByRole('button', { name: /show skills/i });
    this.toolsTabButton = page.getByRole('button', { name: /show tools/i });
    this.lighthouseScores = page.locator('.lighthouse-scores__item');
  }
}
