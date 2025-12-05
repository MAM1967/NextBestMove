import { test as base } from "@playwright/test";
import { signUpUser, signInUser } from "../helpers/auth";
import { cleanupTestUser } from "../helpers/test-data";
import { generateTestUser } from "../helpers/staging-config";

type StagingUserFixtures = {
  authenticatedUser: {
    email: string;
    password: string;
    name: string;
  };
};

/**
 * Playwright fixture for authenticated staging user
 * Automatically signs up a new user and cleans up after test
 */
export const test = base.extend<StagingUserFixtures>({
  authenticatedUser: async ({ page }, use) => {
    // Sign up a new user
    const user = await signUpUser(page);
    
    // Use the user in the test
    await use(user);
    
    // Clean up after test
    await cleanupTestUser(user.email);
  },
});

export { expect } from "@playwright/test";

