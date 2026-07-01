import { chromium, type FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';

export default async function globalSetup(config: FullConfig) {
  const authDir = path.join(__dirname, '.auth');
  fs.mkdirSync(authDir, { recursive: true });
  const authFile = path.join(authDir, 'admin.json');
  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:3007';

  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (let attempt = 0; attempt < 6; attempt++) {
    await page.goto(`${baseURL}/login`);
    await page.getByLabel('Email').fill(ADMIN_EMAIL);
    await page.getByLabel('Password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();

    try {
      await page.waitForURL(`${baseURL}/`, { timeout: 10_000 });
      break;
    } catch {
      const throttled = await page.getByText(/Too Many Requests/i).isVisible();
      if (throttled && attempt < 5) {
        await page.waitForTimeout(65_000);
        continue;
      }
      throw new Error('Failed to authenticate for Playwright global setup');
    }
  }

  await page.context().storageState({ path: authFile });
  await browser.close();
}
