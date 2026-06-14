import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import dotenv from 'dotenv';
const ENV = process.env.ENV || 'dev';
dotenv.config({ path: `config/.env.${ENV}` });
console.log(`Running tests in ${ENV} environment`);

const bddTestDir = defineBddConfig({
  features: './features/**/*.feature',
  steps: ['./features/steps/**/*.ts', './features/fixtures.ts'],
});

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "reports/html-report", open: "never" }],
    ["allure-playwright", {
      outputFolder: "allure-results",
      suiteTitle: true,
    }],
    ["./src/utils/JiraReporter.ts"],
  ],

  // ✅ Global settings — baseURL removed from here so each project
  //    controls its own URL independently, no cross-contamination
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.BASE_URL, // ✅ UI tests use .env.dev BASE_URL
      },
    },

    {
      name: 'api',
      testDir: './tests/apiTests',
      use: {
        baseURL: 'https://restful-booker.herokuapp.com', // ✅ API tests use their own URL
      },
    },

    {
      name: 'security',
      testDir: './security',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.BASE_URL, // ✅ Security tests use .env.dev BASE_URL
        headless: true,
        actionTimeout: 30_000,
        navigationTimeout: 60_000,
      },
      timeout: 120_000,
    },

    {
      name: 'bdd-chromium',
      testDir: bddTestDir,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.BASE_URL, // ✅ BDD tests use .env.dev BASE_URL
        actionTimeout: 15_000,
        navigationTimeout: 60_000,
      },
      timeout: 90_000,
    },
  ],
});