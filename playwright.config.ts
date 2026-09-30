import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests', fullyParallel: true, timeout: 45000,
  expect: { timeout: 10000 }, retries: 0, workers: 2,
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: '.qa/browser-results.json' }]],
  use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium', channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless: true, screenshot: 'only-on-failure', trace: 'retain-on-failure', viewport: { width: 1440, height: 1000 } },
  webServer: process.env.APEX_EXTERNAL_PREVIEW === 'true' ? undefined : { command: 'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort --configLoader native', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI, timeout: 30000 },
});
