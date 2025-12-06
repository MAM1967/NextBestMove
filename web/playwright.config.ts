import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for staging environment smoke tests
 * Tests run against staging.nextbestmove.app (behind Basic Auth)
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false, // Run sequentially to avoid email rate limits
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Run one test at a time to avoid Supabase email rate limits
  reporter: "html",
  
  use: {
    baseURL: "https://staging.nextbestmove.app",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off", // Disabled for faster runs
    // Basic Auth credentials for staging
    // Defaults: staging / Jer29:11esv (from Phase 1.4 setup)
    httpCredentials: {
      username: process.env.STAGING_USER || "staging",
      password: process.env.STAGING_PASS || "Jer29:11esv",
    },
    actionTimeout: 30000, // 30 seconds per action
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

