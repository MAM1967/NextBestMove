import { describe, it, expect } from "vitest";
import { calculateNextMoveScore } from "@/lib/decision-engine/scoring";
import type { RelationshipState } from "@/lib/decision-engine/state";

describe("Decision Engine Scoring", () => {
  const createMockAction = (overrides: Partial<{
    id: string;
    due_date: string | Date;
    estimated_minutes: number | null;
    promised_due_at: string | Date | null;
  }> = {}) => ({
    id: "action-1",
    due_date: new Date().toISOString(),
    estimated_minutes: null,
    promised_due_at: null,
    person_id: "person-1",
    ...overrides,
  });

  const createMockRelationshipState = (
    overrides: Partial<RelationshipState> = {}
  ): RelationshipState => ({
    relationshipId: "rel-1",
    userId: "user-1",
    daysSinceLastInteraction: null,
    pendingActionsCount: 0,
    overdueActionsCount: 0,
    awaitingResponse: false,
    earliestRelevantInsightDate: null,
    cadence: "moderate",
    cadenceDays: null,
    tier: "active",
    lastInteractionAt: new Date(),
    nextTouchDueAt: new Date(),
    momentumScore: 50,
    momentumTrend: "stable",
    nextMoveActionId: null,
    ...overrides,
  });

  describe("calculateNextMoveScore", () => {
    it("should calculate score for action with relationship state", () => {
      const action = createMockAction({
        due_date: new Date().toISOString(),
        estimated_minutes: 15,
      });

      const relationshipState = createMockRelationshipState({
        momentumScore: 75,
        momentumTrend: "increasing",
      });

      const emailSignals = {
        daysSinceLastEmail: 2,
        hasUnread: false,
        threadCount: 5,
        hasOpenLoops: false,
        hasUnansweredAsks: false,
        recentEmailCount: 5,
      };

      const result = calculateNextMoveScore(action, relationshipState, new Date(), emailSignals);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.actionId).toBe("action-1");
    });

    it("should handle missing email signals gracefully", () => {
      const action = createMockAction();
      const relationshipState = createMockRelationshipState({
        momentumScore: 60,
      });

      const result = calculateNextMoveScore(action, relationshipState, new Date(), null);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("should prioritize overdue actions", () => {
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - 7); // 7 days overdue

      const overdueAction = createMockAction({
        due_date: overdueDate.toISOString(),
      });

      const onTimeDate = new Date();
      onTimeDate.setDate(onTimeDate.getDate() + 7); // Due in 7 days

      const onTimeAction = createMockAction({
        due_date: onTimeDate.toISOString(),
      });

      const relationshipState = createMockRelationshipState({
        momentumScore: 50,
      });

      const overdueResult = calculateNextMoveScore(overdueAction, relationshipState, new Date(), null);
      const onTimeResult = calculateNextMoveScore(onTimeAction, relationshipState, new Date(), null);

      expect(overdueResult.score).toBeGreaterThan(onTimeResult.score);
    });

    it("should boost score for high momentum", () => {
      const action = createMockAction();

      const highMomentum = createMockRelationshipState({
        momentumScore: 90,
        momentumTrend: "increasing",
      });

      const lowMomentum = createMockRelationshipState({
        momentumScore: 30,
        momentumTrend: "declining",
      });

      const highScore = calculateNextMoveScore(action, highMomentum, new Date(), null);
      const lowScore = calculateNextMoveScore(action, lowMomentum, new Date(), null);

      expect(highScore.score).toBeGreaterThan(lowScore.score);
    });

    it("should handle Priority tier relationships", () => {
      const action = createMockAction();

      const priorityTier = createMockRelationshipState({
        tier: "inner",
        momentumScore: 50,
      });

      const backgroundTier = createMockRelationshipState({
        tier: "background",
        momentumScore: 50,
      });

      const priorityResult = calculateNextMoveScore(action, priorityTier, new Date(), null);
      const backgroundResult = calculateNextMoveScore(action, backgroundTier, new Date(), null);

      expect(priorityResult.score).toBeGreaterThan(backgroundResult.score);
    });

    it("should return deterministic scores for same inputs", () => {
      const action = createMockAction({
        due_date: new Date().toISOString(),
        estimated_minutes: 20,
      });

      const relationshipState = createMockRelationshipState({
        momentumScore: 60,
      });

      const emailSignals = {
        daysSinceLastEmail: 3,
        hasUnread: true,
        threadCount: 2,
        hasOpenLoops: false,
        hasUnansweredAsks: false,
        recentEmailCount: 2,
      };

      const today = new Date();
      const result1 = calculateNextMoveScore(action, relationshipState, today, emailSignals);
      const result2 = calculateNextMoveScore(action, relationshipState, today, emailSignals);

      expect(result1.score).toBe(result2.score);
    });

    it("should boost score for overdue promises", () => {
      const overduePromiseDate = new Date();
      overduePromiseDate.setDate(overduePromiseDate.getDate() - 1); // 1 day overdue

      const actionWithPromise = createMockAction({
        due_date: new Date().toISOString(),
        promised_due_at: overduePromiseDate.toISOString(),
      });

      const actionWithoutPromise = createMockAction({
        due_date: new Date().toISOString(),
      });

      const relationshipState = createMockRelationshipState();

      const promiseResult = calculateNextMoveScore(actionWithPromise, relationshipState, new Date(), null);
      const noPromiseResult = calculateNextMoveScore(actionWithoutPromise, relationshipState, new Date(), null);

      expect(promiseResult.score).toBeGreaterThan(noPromiseResult.score);
    });
  });
});

