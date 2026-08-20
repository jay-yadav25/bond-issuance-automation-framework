import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import dotenv from 'dotenv';

dotenv.config({ path: process.env.ENV_FILE || '.env' });

defineBddConfig({
  paths: ['features/**/*.feature'],
  require: ['fixtures/test.ts', 'steps/**/*.bdd.ts'],
  outputDir: 'features-gen'
});

const requestedBrowsers = (process.env.BROWSERS || process.env.BROWSER || 'CHROME')
  .split(',')
  .map((browser) => browser.trim().toUpperCase())
  .filter(Boolean);

const browserProjects = {
  CHROME: {
    name: 'chrome',
    use: { ...devices['Desktop Chrome'], browserName: 'chromium' as const }
  },
  FIREFOX: {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'], browserName: 'firefox' as const }
  },
  SAFARI: {
    name: 'safari',
    use: { ...devices['Desktop Safari'], browserName: 'webkit' as const }
  },
  IPHONE: {
    name: 'iphone',
    use: { ...devices['iPhone 13'], browserName: 'webkit' as const }
  }
} as const;

const selectedBrowsers = requestedBrowsers
  .filter((browser): browser is keyof typeof browserProjects => browser in browserProjects);

const projects = (selectedBrowsers.length ? selectedBrowsers : ['CHROME' as const])
  .map((browser) => browserProjects[browser]);

export default defineConfig({
  testDir: './features-gen',
  timeout: Number(process.env.TEST_TIMEOUT || 30_000),
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.WORKERS ? Number(process.env.WORKERS) : undefined,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    headless: process.env.HEADLESS !== 'false',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects,
  reporter: [
    ['html', { outputFolder: 'reports/playwright', open: 'never' }],
    ['allure-playwright', { resultsDir: 'reports/allure' }]
  ]
});
