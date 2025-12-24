/**
 * Promise utility functions for calculating promised due dates
 */

/**
 * Calculate end of day (EOD) in user's timezone
 * Uses user's work_end_time from settings, defaults to 5:00 PM
 * Returns a Date object representing EOD today in the user's timezone
 * 
 * Note: This creates a Date object in local browser timezone.
 * When stored as TIMESTAMPTZ in the database, PostgreSQL will convert it correctly.
 * For proper timezone handling, the date should be created considering the user's timezone,
 * but for MVP, we'll use local time and rely on the database to handle conversion.
 */
export function calculateEOD(userTimeZone: string = "America/New_York", workEndTime: string | null = null): Date {
  const now = new Date();
  
  // Default to 5:00 PM (17:00)
  const defaultHour = 17;
  const defaultMinute = 0;
  
  let hour = defaultHour;
  let minute = defaultMinute;
  
  if (workEndTime) {
    // Parse work_end_time (format: "HH:MM" or "HH:MM:SS")
    const timeParts = workEndTime.split(":");
    hour = parseInt(timeParts[0], 10) || defaultHour;
    minute = parseInt(timeParts[1], 10) || defaultMinute;
  }
  
  // Get today's date
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  
  // Create date with EOD time in local timezone
  // This will be converted to UTC when stored in the database
  const eodDate = new Date(year, month, day, hour, minute, 0);
  
  return eodDate;
}

/**
 * Calculate end of week (Sunday at EOD in user's timezone)
 */
export function calculateEndOfWeek(userTimeZone: string = "America/New_York", workEndTime: string | null = null): Date {
  const now = new Date();
  
  // Get current day of week (0 = Sunday, 6 = Saturday)
  const currentDay = now.getDay();
  const daysUntilSunday = currentDay === 0 ? 0 : 7 - currentDay; // Days until next Sunday (0 if already Sunday)
  
  // Get today's date
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  
  // Default to 5:00 PM (17:00)
  const defaultHour = 17;
  const defaultMinute = 0;
  
  let hour = defaultHour;
  let minute = defaultMinute;
  
  if (workEndTime) {
    const timeParts = workEndTime.split(":");
    hour = parseInt(timeParts[0], 10) || defaultHour;
    minute = parseInt(timeParts[1], 10) || defaultMinute;
  }
  
  // Calculate Sunday's date with EOD time
  const sundayDate = new Date(year, month, day + daysUntilSunday, hour, minute, 0);
  
  return sundayDate;
}

/**
 * Format promised_due_at for display
 */
export function formatPromiseDate(promisedDueAt: string): string {
  const date = new Date(promisedDueAt);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `Overdue promise (${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""})`;
  } else if (diffDays === 0) {
    // Check if it's today
    const dateOnly = date.toISOString().split("T")[0];
    const todayOnly = now.toISOString().split("T")[0];
    if (dateOnly === todayOnly) {
      return "Promised by EOD today";
    }
    return "Promised today";
  } else if (diffDays === 1) {
    return "Promised by EOD tomorrow";
  } else if (diffDays <= 7) {
    return `Promised by ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  } else {
    return `Promised by ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  }
}

/**
 * Check if a promise is overdue
 */
export function isPromiseOverdue(promisedDueAt: string | null | undefined): boolean {
  if (!promisedDueAt) return false;
  const promiseDate = new Date(promisedDueAt);
  const now = new Date();
  return promiseDate < now;
}

