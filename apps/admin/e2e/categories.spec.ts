import { expect, test } from '@playwright/test';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/');
}

test('categories CRUD flow', async ({ page }) => {
  const runId = Date.now();
  const categoryName = `E2E Category ${runId}`;

  await login(page);
  await page.goto('/categories');
  await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible();

  await page.getByPlaceholder('Name').fill(categoryName);
  await page.getByPlaceholder('Description').fill('Created by Playwright');
  await page.getByRole('button', { name: 'Create category' }).click();

  await expect(page.getByText(categoryName)).toBeVisible();

  await page.getByRole('button', { name: 'Edit' }).first().click();
  await page.getByPlaceholder('Name').fill(`${categoryName} Updated`);
  await page.getByRole('button', { name: 'Save changes' }).click();

  await expect(page.getByText(`${categoryName} Updated`)).toBeVisible();
});
