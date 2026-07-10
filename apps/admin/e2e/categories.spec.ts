import { expect, test } from '@playwright/test';
import { sidebarLink } from './helpers';

test('categories create and edit flow', async ({ page }) => {
  const runId = Date.now();
  const categoryName = `E2E Category ${runId}`;

  await page.goto('/categories');
  await expect(page.getByRole('heading', { name: 'News Categories' })).toBeVisible();

  await page.getByRole('button', { name: 'Add Category' }).click();
  await page.getByPlaceholder('Name').fill(categoryName);
  await page.getByPlaceholder('Description').fill('Created by Playwright');
  await page.getByRole('button', { name: 'Create category' }).click();

  await expect(page.getByText(categoryName)).toBeVisible();

  const row = page.getByRole('row').filter({ hasText: categoryName });
  await row.getByRole('button', { name: 'Edit' }).click();
  await page.getByPlaceholder('Name').fill(`${categoryName} Updated`);
  await page.getByRole('button', { name: 'Save changes' }).click();

  await expect(page.getByText(`${categoryName} Updated`)).toBeVisible();
});
