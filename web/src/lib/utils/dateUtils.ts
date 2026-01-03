/**
 * Date utility functions using date-fns for reliable date handling
 * These functions ensure dates are parsed and compared in the user's local timezone
 */

import { parse, format, startOfDay, differenceInDays, isValid } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Parse a date string (YYYY-MM-DD) as a local date (not UTC)
 * This is critical because new Date('YYYY-MM-DD') treats it as UTC midnight,
 * which can cause off-by-one day errors in some timezones.
 */
export function parseLocalDate(dateString: string): Date {
  // Remove time component if present (e.g., "2025-11-29T00:00:00Z" -> "2025-11-29")
  const dateOnly = dateString.split('T')[0];
  
  // Parse as local date using date-fns parse with explicit format
  // This ensures the date is interpreted in the local timezone, not UTC
  const parsed = parse(dateOnly, 'yyyy-MM-dd', new Date());
  
  if (!isValid(parsed)) {
    console.error('Invalid date string:', dateString);
    return startOfDay(new Date()); // Fallback to today
  }
  
  // Normalize to local midnight
  return startOfDay(parsed);
}

/**
 * Get today's date at local midnight
 */
export function getTodayLocal(): Date {
  return startOfDay(new Date());
}

/**
 * Get today's date string (YYYY-MM-DD) in a specific timezone
 * This is critical for ensuring the date matches what the user sees
 */
export function getTodayInTimezone(timezone: string = 'America/New_York'): string {
  const now = new Date();
  // Format the current date in the user's timezone
  return formatInTimeZone(now, timezone, 'yyyy-MM-dd');
}

/**
 * Get the day of week (0 = Sunday, 6 = Saturday) in a specific timezone
 */
export function getDayOfWeekInTimezone(timezone: string = 'America/New_York'): number {
  const now = new Date();
  // Get day of week in user's timezone
  const dayName = formatInTimeZone(now, timezone, 'EEEE'); // Full day name
  const dayNames: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  return dayNames[dayName] ?? 1; // Default to Monday if not found
}

/**
 * Check if a date is a weekend in a specific timezone
 */
export function isWeekendInTimezone(timezone: string = 'America/New_York'): boolean {
  const dayOfWeek = getDayOfWeekInTimezone(timezone);
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Calculate the difference in days between a due date and today
 * Returns positive number if overdue, 0 if due today, negative if in the future
 */
export function getDaysDifference(dueDateString: string): number {
  const dueDate = parseLocalDate(dueDateString);
  const today = getTodayLocal();
  return differenceInDays(today, dueDate);
}

/**
 * Format a date string for display
 */
export function formatDateForDisplay(dateString: string, includeYear?: boolean): string {
  const date = parseLocalDate(dateString);
  const currentYear = new Date().getFullYear();
  const dateYear = date.getFullYear();
  
  if (includeYear || dateYear !== currentYear) {
    return format(date, 'MMM d, yyyy');
  }
  return format(date, 'MMM d');
}

