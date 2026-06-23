import type { Config } from '@playwright/test';

const config: Config = {
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3006',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3006',
    reuseExistingServer: true,
  },
};

export default config;
