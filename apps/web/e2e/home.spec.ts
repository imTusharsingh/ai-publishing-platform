import { expect, test } from '@playwright/test';

test('home page renders articles from API', async ({ page }) => {
  await page.route('**/v1/categories?activeOnly=true', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            id: 'cat-1',
            name: 'Startups',
            slug: 'startups',
            description: 'Startup news',
            priorityScore: 90,
            isActive: true,
          },
        ],
        meta: { total: 1 },
      }),
    });
  });

  await page.route('**/v1/articles*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            id: 'art-1',
            title: 'Playwright Test Article',
            slug: 'playwright-test-article',
            summary: 'Rendered via mocked API response.',
            publishedAt: '2026-06-20T10:00:00.000Z',
            authorName: 'AI Writer',
            featuredImageUrl: null,
            category: { id: 'cat-1', name: 'Startups', slug: 'startups' },
          },
        ],
        meta: { page: 1, limit: 6, total: 1, totalPages: 1 },
      }),
    });
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Latest Articles' })).toBeVisible();
  await expect(page.getByText('Playwright Test Article')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Startups' })).toBeVisible();
});
