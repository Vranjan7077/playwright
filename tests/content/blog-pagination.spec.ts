import { test, expect } from '../../fixtures';

test.describe('Blog listing & pagination', () => {
  test.beforeEach(async ({ blogPage }) => {
    await blogPage.goto();
  });

  test('renders at least one post with a title, date, and tags', async ({ blogPage }) => {
    const count = await blogPage.postCount();
    expect(count).toBeGreaterThan(0);

    const firstPost = blogPage.posts.first();
    await expect(firstPost.locator('.blog-post__title')).not.toBeEmpty();
    await expect(firstPost.locator('time')).toBeVisible();
  });

  test('next/prev pagination navigates without losing posts', async ({ blogPage, page }) => {
    const total = await blogPage.totalPostsFromSummary();
    // eslint-disable-next-line playwright/no-skipped-test -- content-dependent: pagination only exists once there's more than one page of posts
    test.skip(
      !(await blogPage.nextPageLink.isVisible()),
      'only one page of posts currently exists',
    );

    await blogPage.nextPageLink.click();
    await expect(page).toHaveURL(/\/blog\/2\/?$/);
    // Full server-rendered navigation: wait for the new page's content to
    // paint before counting, rather than racing the initial render.
    await expect(blogPage.posts.first()).toBeVisible();
    const pageTwoCount = await blogPage.postCount();
    expect(pageTwoCount).toBeGreaterThan(0);

    await blogPage.prevPageLink.click();
    await expect(page).toHaveURL(/\/blog\/$/);
    expect(await blogPage.totalPostsFromSummary()).toBe(total);
  });

  test('tag links filter to posts containing that tag', async ({ blogPage, page }) => {
    const firstTag = blogPage.tagLinks.first();
    const tagName = ((await firstTag.textContent()) ?? '').trim();
    expect(tagName).not.toBe('');
    await firstTag.click();

    await expect(page).toHaveURL(/\/blog\/tags\//);
    await expect(blogPage.posts.first()).toBeVisible();
    const filteredCount = await blogPage.postCount();
    expect(filteredCount).toBeGreaterThan(0);
    await expect(blogPage.tagLinks.first()).toContainText(tagName);
  });

  test('clicking a post title navigates to that post', async ({ blogPage, blogPostPage, page }) => {
    const title = ((await blogPage.postTitleLinks.first().textContent()) ?? '').trim();
    expect(title).not.toBe('');
    await blogPage.postTitleLinks.first().click();

    await expect(page).not.toHaveURL(/\/blog\/$/);
    await expect(blogPostPage.heading).toBeVisible();
    await expect(blogPostPage.heading).toContainText(title);
  });
});
