import { defineConfig, devices } from "@playwright/test"

/**
 * Playwright Configuration
 *
 * CI Strategy: Run only Chromium for speed and reliability.
 * Local: All browsers available for comprehensive testing.
 *
 * See docs/development/testing-guidelines.md for testing philosophy.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "html",
  timeout: 60 * 1000, // 60s global timeout
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    actionTimeout: 15000,
  },
  expect: {
    timeout: 15 * 1000,
  },
  // CI: Chromium only for speed. Local: All browsers.
  projects: process.env.CI
    ? [
        {
          name: "chromium",
          use: { ...devices["Desktop Chrome"] },
        },
      ]
    : [
        {
          name: "chromium",
          use: { ...devices["Desktop Chrome"] },
        },
        {
          name: "firefox",
          use: { ...devices["Desktop Firefox"] },
        },
        {
          name: "webkit",
          use: { ...devices["Desktop Safari"] },
        },
        {
          name: "Mobile Chrome",
          use: { ...devices["Pixel 5"] },
        },
        {
          name: "Mobile Safari",
          use: { ...devices["iPhone 12"] },
        },
      ],
  webServer: {
    command: process.env.CI ? "npm run build && npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 300 * 1000,
  },
  workers: process.env.CI ? 2 : undefined,
})
