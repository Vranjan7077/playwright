import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Generic object for any /blog/post/<slug>/ page. Deliberately has no fixed
 * `path` default - tests navigate to a post discovered dynamically from
 * BlogPage rather than hardcoding a slug that will eventually be edited or
 * removed by the site owner.
 */
export class BlogPostPage extends BasePage {
  path = '';

  readonly heading: Locator;
  readonly publishDate: Locator;
  readonly tags: Locator;
  readonly article: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.article = page.locator('article');
    this.publishDate = page.locator('time.publishDate, time[datetime]').first();
    this.tags = page.locator('.blog-post__tags a, a[rel="tag"]');
  }

  async gotoPath(path: string): Promise<void> {
    this.path = path;
    await this.page.goto(path);
  }
}
