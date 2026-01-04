import type { ActionState } from "@/app/app/actions/types";

// User-friendly status labels (less formal, more satisfying)
export type ActionStatus = 'pending' | 'waiting' | 'snoozed' | 'done';

export function mapStateToStatus(state: ActionState): ActionStatus {
  switch (state) {
    case 'NEW':
      return 'pending';
    case 'SENT':
      return 'waiting'; // "Waiting" instead of "Acknowledged" - more satisfying
    case 'SNOOZED':
      return 'snoozed'; // "Snoozed" instead of "Deferred" - keep current language
    case 'DONE':
    case 'REPLIED':
      return 'done'; // "Done" instead of "Completed" - mentally satisfying
    case 'ARCHIVED':
      return 'done'; // Archived is also done
    default:
      return 'pending';
  }
}

export function mapStatusToStates(status: ActionStatus): ActionState[] {
  switch (status) {
    case 'pending':
      return ['NEW'];
    case 'waiting':
      return ['SENT'];
    case 'snoozed':
      return ['SNOOZED'];
    case 'done':
      return ['DONE', 'REPLIED'];
    default:
      return [];
  }
}

