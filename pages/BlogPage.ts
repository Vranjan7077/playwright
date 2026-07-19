import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class BlogPage extends BasePage {
  readonly path = '/blog/';

  readonly heading: Locator;
  readonly posts: Locator;
  readonly postTitleLinks: Locator;
  readonly tagLinks: Locator;
  readonly nextPageLink: Locator;
  readonly prevPageLink: Locator;
  readonly paginationSummary: Locator;

  readonly openSearchButton: Locator;
  readonly closeSearchButton: Locator;
  readonly searchOverlay: Locator;
  readonly searchOverlayBackdrop: Locator;
  readonly searchInput: Locator;
  readonly searchResults: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.posts = page.locator('article.blog-post');
    this.postTitleLinks = this.posts.locator('.blog-post__title a');
    this.tagLinks = page.locator('.blog-post__tags a');
    this.nextPageLink = page.getByRole('link', { name: /next page/i });
    this.prevPageLink = page.getByRole('link', { name: /prev(ious)? page/i });
    this.paginationSummary = page.locator('.pagination-nav__pages');

    this.openSearchButton = page.getByRole('button', { name: /open search/i });
    this.closeSearchButton = page.getByRole('button', { name: /close search/i });
    this.searchOverlay = page.locator('#search-overlay');
    this.searchOverlayBackdrop = page.locator('.search-overlay-backdrop');
    this.searchInput = page.locator('.pagefind-ui__search-input');
    this.searchResults = page.locator('.pagefind-ui__result');
  }

  async openSearchViaKeyboard(): Promise<void> {
    await this.page.keyboard.press('Control+k');
  }

  /**
   * Opens the overlay and waits past the ~100ms the widget takes to wire up
   * its input listener (app implementation detail) - use this over a bare
   * `openSearchButton.click()` whenever a test is about to type a query.
   */
  async openSearchAndAwaitReady(): Promise<void> {
    await this.openSearchButton.click();
    await this.page.waitForTimeout(200);
  }

  async postCount(): Promise<number> {
    return this.posts.count();
  }

  async totalPostsFromSummary(): Promise<number> {
    const text = await this.paginationSummary.locator('.pagination-nav__total').textContent();
    return Number(text?.trim() ?? NaN);
  }
}
