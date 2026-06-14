import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import dotenv from 'dotenv';  
const ENV = process.env.ENV || 'dev';
dotenv.config({ path: `config/.env.${ENV}` });
console.log(`Running tests in ${ENV} environment`);

// BDD project config — generates test files from .feature + step definitions
const bddTestDir = defineBddConfig({
  features: './features/**/*.feature',
  steps: ['./features/steps/**/*.ts', './features/fixtures.ts'],
});
/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
reporter: [
    ["list"],
    ["html", { outputFolder: "reports/html-report", open: "never" }],
    ["allure-playwright", {
      outputFolder: "allure-results",
      suiteTitle: true,
    }],
    ["./src/utils/JiraReporter.ts"],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
     baseURL: process.env.BASE_URL, // This env will be selected from top configuration based on the ENV variable set in the .env file
     screenshot: 'only-on-failure',
     video: 'retain-on-failure',
     headless: true,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    //     name: 'api',
    //     use: { 
    //         baseURL: 'https://restful-booker.herokuapp.com',
    //     },
    // },
    {
      name: 'security',
      testDir: './security',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
        actionTimeout: 30_000,
        navigationTimeout: 60_000,
      },
      timeout: 120_000,   // HAR recording flows take longer
    },
    {
      name: 'bdd-chromium',
      testDir: bddTestDir,
      use: {
        ...devices['Desktop Chrome'],
        actionTimeout: 15_000,
        navigationTimeout: 60_000,
      },
      timeout: 90_000,
    },
    // },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },

  
});
