import type { Config } from '@playwright/test';

const config: Config = {
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3007',
  },
  webServer: [
    {
      command: 'npm run dev --workspace=@repo/api',
      url: 'http://localhost:3008/v1/health',
      reuseExistingServer: true,
      cwd: '../..',
      timeout: 120_000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:3007',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
};

export default config;
