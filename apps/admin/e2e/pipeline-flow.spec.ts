import { expect, test } from '@playwright/test';
import { sidebarLink } from './helpers';

test('full admin pipeline pages render and key actions work', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible();

  await sidebarLink(page, '/categories').click();
  await expect(page.getByRole('heading', { name: 'News Categories' })).toBeVisible();
  await expect(page.getByPlaceholder('Search categories...')).toBeVisible();

  await sidebarLink(page, '/topics').click();
  await expect(page.getByRole('heading', { name: 'AI Topic Discovery' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sync Now' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Queue', exact: true })).toBeVisible();

  await sidebarLink(page, '/ideas').click();
  await expect(page.getByRole('heading', { name: 'Idea Pipeline' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create idea' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'All ideas' })).toBeVisible();

  await sidebarLink(page, '/articles').click();
  await expect(page.getByRole('heading', { name: 'Article Management' })).toBeVisible();
  const firstRow = page.locator('tbody tr').first();
  if (await firstRow.isVisible()) {
    await firstRow.click();
    await expect(page.getByText('Select an article to preview.')).not.toBeVisible();
  }

  await sidebarLink(page, '/jobs').click();
  await expect(page.getByRole('heading', { name: 'AI Agent Orchestration' })).toBeVisible();
  await page.getByRole('button', { name: 'Create New Job' }).click();
  await expect(page.getByRole('columnheader', { name: 'Job Type' })).toBeVisible({
    timeout: 10_000,
  });

  await sidebarLink(page, '/audit').click();
  await expect(page.getByRole('heading', { name: 'Platform Audit' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Action' })).toBeVisible();
});
