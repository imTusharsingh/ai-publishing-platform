import { expect, test } from '@playwright/test';
import { loginAsAdmin, logoutAdmin, sidebarLink } from './helpers';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';

test.describe('unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Aura Admin' })).toBeVisible();
  });

  test('login and logout flow', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByText(ADMIN_EMAIL)).toBeVisible();
    await logoutAdmin(page);
  });
});
