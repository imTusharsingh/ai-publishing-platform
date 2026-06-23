import { expect, test } from '@playwright/test';

test('article page renders content and SEO metadata', async ({ page }) => {
  await page.goto('/articles/seed-funding-rebounds-ai-infrastructure-q2');

  await expect(
    page.getByRole('heading', {
      name: 'Seed Funding Rebounds as AI Infrastructure Startups Lead Q2',
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/Venture capitalists are returning to seed-stage deals/),
  ).toBeVisible();
  await expect(page).toHaveTitle('Seed Funding Rebounds in Q2 | Startup News');

  const description = page.locator('meta[name="description"]');
  await expect(description).toHaveAttribute(
    'content',
    'Early-stage venture activity picked up in Q2, led by AI infrastructure and developer tools startups.',
  );
});

test('home page links to article detail', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('link', { name: /Seed Funding Rebounds/ })
    .first()
    .click();
  await expect(page).toHaveURL('/articles/seed-funding-rebounds-ai-infrastructure-q2');
  await expect(
    page.getByRole('heading', {
      name: 'Seed Funding Rebounds as AI Infrastructure Startups Lead Q2',
    }),
  ).toBeVisible();
});
