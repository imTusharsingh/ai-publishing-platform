import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible();
}

export async function logoutAdmin(page: Page) {
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL('/login');
}

export function sidebarLink(page: Page, href: string) {
  return page.locator(`aside nav a[href="${href}"]`);
}
