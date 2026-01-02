import { createAdminClient } from "@/lib/supabase/admin";

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

