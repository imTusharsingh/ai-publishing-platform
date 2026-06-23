import { expect, test } from '@playwright/test';

test('category page renders articles and SEO metadata', async ({ page }) => {
  await page.goto('/category/startups');

  await expect(page.getByRole('heading', { name: 'Startups Articles' })).toBeVisible();
  await expect(
    page.getByText('Seed Funding Rebounds as AI Infrastructure Startups Lead Q2'),
  ).toBeVisible();
  await expect(page).toHaveTitle('Startups Articles');

  const description = page.locator('meta[name="description"]');
  await expect(description).toHaveAttribute('content', 'Early-stage companies and founder stories');
});
