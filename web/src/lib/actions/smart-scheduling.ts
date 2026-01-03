import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Proposed action for batch scheduling
 */
export interface ProposedAction {
  proposedDueDate: string;
  // Additional metadata can be added here if needed
}

/**
 * Scheduled action result
 */
export interface ScheduledAction {
  scheduledDate: string;
  proposedDate: string;
}

/**
 * Find the next available date for an action for a given relationship
 * Ensures no more than 2 actions per day per relationship
 * 
 * @param userId - User ID
 * @param personId - Relationship ID
 * @param proposedDueDate - The originally proposed due date
 * @param maxActionsPerDay - Maximum actions per day (default: 2)
 * @returns ISO date string for the scheduled due date
 */
export async function findNextAvailableActionDate(
  userId: string,
  personId: string,
  proposedDueDate: string,
  maxActionsPerDay: number = 2
): Promise<string> {
  const supabase = createAdminClient();
  const proposedDate = new Date(proposedDueDate);
  proposedDate.setHours(0, 0, 0, 0);
  
  // Start checking from the proposed date, working backwards if needed
  // to fit all actions before the proposed date
  let currentDate = new Date(proposedDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Don't schedule before today
  if (currentDate < today) {
    currentDate = new Date(today);
  }
  
  // Try up to 30 days in the future to find an available slot
  const maxDaysToCheck = 30;
  let daysChecked = 0;
  
  while (daysChecked < maxDaysToCheck) {
    const dateStr = currentDate.toISOString().split("T")[0];
    
    // Count existing actions for this relationship on this date
    const { data: existingActions, error } = await supabase
      .from("actions")
      .select("id")
      .eq("user_id", userId)
      .eq("person_id", personId)
      .eq("due_date", dateStr)
      .in("state", ["NEW", "SENT", "SNOOZED"]); // Only count pending actions
    
    if (error) {
      console.error("[Smart Scheduling] Error checking existing actions:", error);
      // Fallback to proposed date if we can't check
      return proposedDueDate;
    }
    
    const actionCount = existingActions?.length || 0;
    
    // If we have space on this date, use it
    if (actionCount < maxActionsPerDay) {
      console.log(`[Smart Scheduling] Found available slot: ${dateStr} (${actionCount}/${maxActionsPerDay} actions)`);
      return dateStr;
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
    daysChecked++;
  }
  
  // If we couldn't find a slot within 30 days, return the proposed date anyway
  // (better than failing completely)
  console.warn(`[Smart Scheduling] Could not find available slot within 30 days, using proposed date: ${proposedDueDate}`);
  return proposedDueDate;
}

/**
 * Schedule multiple actions at once, ensuring proper spacing (max 2 per day)
 * More efficient than calling findNextAvailableActionDate multiple times sequentially
 * 
 * @param userId - User ID
 * @param personId - Relationship ID
 * @param proposedActions - Array of proposed actions with their proposed due dates
 * @param maxActionsPerDay - Maximum actions per day (default: 2)
 * @returns Array of scheduled dates in the same order as proposedActions
 */
export async function scheduleMultipleActions(
  userId: string,
  personId: string,
  proposedActions: ProposedAction[],
  maxActionsPerDay: number = 2
): Promise<ScheduledAction[]> {
  const supabase = createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get all existing pending actions for this relationship
  // This is more efficient than querying per-day in a loop
  const { data: existingActions, error: existingError } = await supabase
    .from("actions")
    .select("due_date")
    .eq("user_id", userId)
    .eq("person_id", personId)
    .in("state", ["NEW", "SENT", "SNOOZED"])
    .gte("due_date", today.toISOString().split("T")[0]); // Only future dates
  
  if (existingError) {
    console.error("[Smart Scheduling] Error fetching existing actions:", existingError);
    // Fallback: return proposed dates
    return proposedActions.map((action) => ({
      scheduledDate: action.proposedDueDate,
      proposedDate: action.proposedDueDate,
    }));
  }
  
  // Build a map of date -> count of existing actions
  const dateCountMap = new Map<string, number>();
  existingActions?.forEach((action) => {
    const dateStr = action.due_date;
    dateCountMap.set(dateStr, (dateCountMap.get(dateStr) || 0) + 1);
  });
  
  // Track scheduled dates for the new actions we're scheduling
  const scheduledDates = new Map<string, number>();
  
  const scheduled: ScheduledAction[] = [];
  const maxDaysToCheck = 30;
  
  for (const proposedAction of proposedActions) {
    const proposedDate = new Date(proposedAction.proposedDueDate);
    proposedDate.setHours(0, 0, 0, 0);
    
    // Don't schedule before today
    let currentDate = proposedDate < today ? new Date(today) : new Date(proposedDate);
    
    let daysChecked = 0;
    let scheduledDate: string | null = null;
    
    while (daysChecked < maxDaysToCheck && !scheduledDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      
      // Count existing actions + already-scheduled actions for this batch
      const existingCount = dateCountMap.get(dateStr) || 0;
      const scheduledCount = scheduledDates.get(dateStr) || 0;
      const totalCount = existingCount + scheduledCount;
      
      // If we have space on this date, use it
      if (totalCount < maxActionsPerDay) {
        scheduledDate = dateStr;
        scheduledDates.set(dateStr, scheduledCount + 1);
        console.log(`[Smart Scheduling] Scheduled action for ${dateStr} (${totalCount + 1}/${maxActionsPerDay} actions)`);
      } else {
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
        daysChecked++;
      }
    }
    
    // If we couldn't find a slot, fall back to proposed date
    if (!scheduledDate) {
      scheduledDate = proposedAction.proposedDueDate;
      console.warn(`[Smart Scheduling] Could not find slot for action, using proposed date: ${proposedAction.proposedDueDate}`);
    }
    
    scheduled.push({
      scheduledDate,
      proposedDate: proposedAction.proposedDueDate,
    });
  }
  
  return scheduled;
}

