/**
 * Common TypeScript types used across the application
 * 
 * These types provide a foundation for type safety and reduce the need for `any` types.
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success?: boolean;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

/**
 * Result type for operations that can fail
 * Similar to Rust's Result<T, E>
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Maybe type for nullable values
 */
export type Maybe<T> = T | null | undefined;

/**
 * Type guard for Error objects
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return String(error);
}

/**
 * Type guard for objects with a message property
 */
export function hasMessage(error: unknown): error is { message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
}

/**
 * Extract error message with fallback
 */
export function extractError(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (hasMessage(error)) {
    return error.message;
  }
  return String(error);
}

