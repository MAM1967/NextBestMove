import type { ActionType } from "@/app/app/actions/types";

const RELATIONSHIP_REQUIRED_TYPES: ActionType[] = [
  'FOLLOW_UP',
  'OUTREACH',
  'CALL_PREP',
  'POST_CALL',
];

export function requiresRelationship(actionType: ActionType): boolean {
  return RELATIONSHIP_REQUIRED_TYPES.includes(actionType);
}

export function validateActionRelationship(
  actionType: ActionType,
  personId: string | null | undefined
): { valid: boolean; error?: string } {
  if (requiresRelationship(actionType) && !personId) {
    return {
      valid: false,
      error: `${actionType} actions require a relationship`,
    };
  }
  return { valid: true };
}

