/**
 * Test relationship fixtures for automated testing
 */

import type { RelationshipCadence, RelationshipTier } from "@/lib/leads/types";

export interface TestRelationship {
  name: string;
  email?: string;
  cadence: RelationshipCadence;
  tier: RelationshipTier;
  lastInteractionAt?: Date;
  nextTouchDueAt?: Date;
}

/**
 * Create a test relationship that needs attention (overdue)
 */
export function createOverdueRelationship(): TestRelationship {
  const lastInteractionAt = new Date();
  lastInteractionAt.setDate(lastInteractionAt.getDate() - 30); // 30 days ago
  
  const nextTouchDueAt = new Date();
  nextTouchDueAt.setDate(nextTouchDueAt.getDate() - 7); // 7 days overdue
  
  return {
    name: "Overdue Contact",
    email: "overdue@example.com",
    cadence: "moderate",
    tier: "active",
    lastInteractionAt,
    nextTouchDueAt,
  };
}

/**
 * Create a test relationship in rhythm (on track)
 */
export function createInRhythmRelationship(): TestRelationship {
  const lastInteractionAt = new Date();
  lastInteractionAt.setDate(lastInteractionAt.getDate() - 5); // 5 days ago
  
  const nextTouchDueAt = new Date();
  nextTouchDueAt.setDate(nextTouchDueAt.getDate() + 2); // Due in 2 days
  
  return {
    name: "In Rhythm Contact",
    email: "inrhythm@example.com",
    cadence: "moderate",
    tier: "active",
    lastInteractionAt,
    nextTouchDueAt,
  };
}

/**
 * Create a test relationship with intentional low touch
 */
export function createLowTouchRelationship(): TestRelationship {
  const lastInteractionAt = new Date();
  lastInteractionAt.setDate(lastInteractionAt.getDate() - 90); // 90 days ago
  
  const nextTouchDueAt = new Date();
  nextTouchDueAt.setDate(nextTouchDueAt.getDate() + 30); // Due in 30 days
  
  return {
    name: "Low Touch Contact",
    email: "lowtouch@example.com",
    cadence: "infrequent",
    tier: "warm",
    lastInteractionAt,
    nextTouchDueAt,
  };
}

