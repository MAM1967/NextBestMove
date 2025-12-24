/**
 * Test user fixtures for automated testing
 * These are deterministic test users that can be created/cleaned up
 */

export interface TestUser {
  email: string;
  password: string;
  name: string;
  tier?: "free" | "standard" | "premium";
  trialEndsAt?: Date;
}

/**
 * Generate a unique test user email
 */
export function generateTestUserEmail(prefix: string = "test"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}+${timestamp}-${random}@staging.nextbestmove.app`;
}

/**
 * Standard test user (Free tier)
 */
export function createStandardTestUser(): TestUser {
  return {
    email: generateTestUserEmail("test"),
    password: "TestPassword123!",
    name: "Test User",
    tier: "free",
  };
}

/**
 * Trial test user (Standard tier, 14-day trial)
 */
export function createTrialTestUser(): TestUser {
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);
  
  return {
    email: generateTestUserEmail("trial"),
    password: "TestPassword123!",
    name: "Trial User",
    tier: "standard",
    trialEndsAt,
  };
}

/**
 * Premium test user (Premium tier, active subscription)
 */
export function createPremiumTestUser(): TestUser {
  return {
    email: generateTestUserEmail("premium"),
    password: "TestPassword123!",
    name: "Premium User",
    tier: "premium",
  };
}

