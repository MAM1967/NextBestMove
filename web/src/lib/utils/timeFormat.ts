/**
 * Utility functions for time format conversion
 * Storage is always in 24-hour format (HH:MM)
 * Display can be in 12-hour (AM/PM) or 24-hour format based on user preference
 */

/**
 * Convert 24-hour time (HH:MM) to 12-hour format (h:MM AM/PM)
 * @param time24 - Time in 24-hour format (e.g., "09:30", "17:45", "23:15")
 * @returns Time in 12-hour format (e.g., "9:30 AM", "5:45 PM", "11:15 PM")
 */
export function convert24To12(time24: string): string {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Convert 12-hour time (h:MM AM/PM) to 24-hour format (HH:MM)
 * @param time12 - Time in 12-hour format (e.g., "9:30 AM", "5:45 PM", "11:15 PM")
 * @returns Time in 24-hour format (e.g., "09:30", "17:45", "23:15")
 */
export function convert12To24(time12: string): string {
  const match = time12.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) {
    throw new Error(`Invalid 12-hour time format: ${time12}`);
  }
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  
  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Format time for display based on user preference
 * @param time24 - Time in 24-hour format (HH:MM)
 * @param format - "12h" or "24h"
 * @returns Formatted time string
 */
export function formatTime(time24: string, format: "12h" | "24h"): string {
  if (format === "12h") {
    return convert24To12(time24);
  }
  return time24;
}

/**
 * Convert time input value (which may be in 12h or 24h) to 24-hour format for storage
 * HTML5 time input always uses 24-hour format, so this is mainly for display purposes
 * @param timeInput - Time from HTML5 time input (always 24h) or user-entered 12h format
 * @param currentFormat - Current format of the input
 * @returns Time in 24-hour format (HH:MM)
 */
export function normalizeTo24Hour(timeInput: string, currentFormat: "12h" | "24h"): string {
  if (currentFormat === "12h") {
    try {
      return convert12To24(timeInput);
    } catch {
      // If conversion fails, assume it's already in 24h format
      return timeInput;
    }
  }
  return timeInput;
}

