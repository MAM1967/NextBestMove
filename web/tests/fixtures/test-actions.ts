/**
 * Test action fixtures for automated testing
 */

import type { ActionLane } from "@/lib/decision-engine/types";
import type { ActionType, ActionState } from "@/app/app/actions/types";

export interface TestAction {
  title: string;
  actionType: ActionType;
  state: ActionState;
  lane?: ActionLane;
  nextMoveScore?: number;
  estimatedMinutes?: number;
  promisedDueAt?: Date;
  leadId: string;
}

/**
 * Create a Priority lane action (high urgency)
 */
export function createPriorityAction(leadId: string): TestAction {
  return {
    title: "Urgent follow-up",
    actionType: "FOLLOW_UP",
    state: "NEW",
    lane: "priority",
    nextMoveScore: 95,
    estimatedMinutes: 10,
    leadId,
  };
}

/**
 * Create an In Motion lane action (steady progress)
 */
export function createInMotionAction(leadId: string): TestAction {
  return {
    title: "Regular check-in",
    actionType: "NURTURE",
    state: "NEW",
    lane: "in_motion",
    nextMoveScore: 65,
    estimatedMinutes: 15,
    leadId,
  };
}

/**
 * Create an On Deck lane action (future planning)
 */
export function createOnDeckAction(leadId: string): TestAction {
  return {
    title: "Future outreach",
    actionType: "OUTREACH",
    state: "NEW",
    lane: "on_deck",
    nextMoveScore: 45,
    estimatedMinutes: 30,
    leadId,
  };
}

/**
 * Create a promised action (overdue)
 */
export function createPromisedAction(leadId: string): TestAction {
  const promisedDueAt = new Date();
  promisedDueAt.setDate(promisedDueAt.getDate() - 1); // 1 day overdue
  
  return {
    title: "Promised deliverable",
    actionType: "FOLLOW_UP",
    state: "NEW",
    lane: "priority",
    nextMoveScore: 98,
    estimatedMinutes: 20,
    promisedDueAt,
    leadId,
  };
}

