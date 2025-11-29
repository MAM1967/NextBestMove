/**
 * Date utility functions using date-fns for reliable date handling
 * These functions ensure dates are parsed and compared in the user's local timezone
 */

import { parse, format, startOfDay, differenceInDays, isValid } from 'date-fns';

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

