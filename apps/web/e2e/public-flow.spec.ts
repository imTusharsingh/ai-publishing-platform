import { expect, test } from '@playwright/test';

test('public home, category, article, and 404 pages', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Latest Articles' })).toBeVisible();

  await page.goto('/category/startups');
  await expect(page.getByRole('heading', { name: 'Startups Articles' })).toBeVisible();

  await page.goto('/articles/seed-funding-rebounds-ai-infrastructure-q2');
  await expect(
    page.getByRole('heading', {
      name: 'Seed Funding Rebounds as AI Infrastructure Startups Lead Q2',
    }),
  ).toBeVisible();

  await page.goto('/does-not-exist-page');
  await expect(page.getByRole('heading', { name: 'The signal has been lost.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return to Homepage' })).toBeVisible();
});
