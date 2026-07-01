import { expect, test } from '@playwright/test';
import { sidebarLink } from './helpers';

const PAGES = [
  {
    path: '/',
    navLabel: 'Dashboard',
    heading: 'Dashboard Overview',
    breadcrumb: 'Dashboard',
  },
  {
    path: '/categories',
    navLabel: 'Categories',
    heading: 'News Categories',
    breadcrumb: 'Categories',
  },
  {
    path: '/topics',
    navLabel: 'Topics',
    heading: 'AI Topic Discovery',
    breadcrumb: 'Topics Discovery',
  },
  {
    path: '/ideas',
    navLabel: 'Ideas',
    heading: 'Idea Pipeline',
    breadcrumb: 'Article Ideas',
  },
  {
    path: '/articles',
    navLabel: 'Articles',
    heading: 'Article Management',
    breadcrumb: 'Articles',
  },
  {
    path: '/jobs',
    navLabel: 'AI Jobs',
    heading: 'AI Agent Orchestration',
    breadcrumb: 'AI Jobs',
  },
  {
    path: '/audit',
    navLabel: 'Audit Log',
    heading: 'Platform Audit',
    breadcrumb: 'Audit Log',
  },
] as const;

test.describe('admin navigation', () => {
  for (const adminPage of PAGES) {
    test(`${adminPage.navLabel} page loads with header`, async ({ page }) => {
      await page.goto('/');
      await sidebarLink(page, adminPage.path).click();
      await expect(page).toHaveURL(adminPage.path);
      await expect(page.getByRole('heading', { name: adminPage.heading })).toBeVisible();
      await expect(
        page.getByRole('banner').getByText(adminPage.breadcrumb, { exact: true }),
      ).toBeVisible();
    });
  }

  test('removed settings route returns 404', async ({ page }) => {
    const response = await page.goto('/settings');
    expect(response?.status()).toBe(404);
  });

  test('sidebar highlights active route', async ({ page }) => {
    await page.goto('/topics');
    await expect(sidebarLink(page, '/topics')).toHaveClass(/bg-primary/);
  });
});
