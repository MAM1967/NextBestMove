/**
 * Response Time Middleware
 * 
 * Tracks API response times and logs slow requests.
 * Adds X-Response-Time header in development mode.
 */

import { logInfo, logWarn } from "@/lib/utils/logger";
import type { NextRequest, NextResponse } from "next/server";

interface ResponseTimeContext {
  url: string;
  method: string;
  duration: number;
  statusCode?: number;
}

// Track response time statistics (in-memory, resets on server restart)
const responseTimeStats = new Map<string, {
  count: number;
  total: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
  recent: number[]; // Keep last 100 durations for percentile calculation
}>();

const SLOW_REQUEST_THRESHOLD_MS = 1000; // Log requests > 1s
const STATS_WINDOW_SIZE = 100; // Keep last 100 requests per endpoint for percentile calculation

/**
 * Calculate percentiles from an array of durations
 */
function calculatePercentiles(durations: number[]): { p50: number; p95: number; p99: number } {
  if (durations.length === 0) {
    return { p50: 0, p95: 0, p99: 0 };
  }

  const sorted = [...durations].sort((a, b) => a - b);
  const p50Index = Math.floor(sorted.length * 0.5);
  const p95Index = Math.floor(sorted.length * 0.95);
  const p99Index = Math.floor(sorted.length * 0.99);

  return {
    p50: sorted[p50Index] || 0,
    p95: sorted[p95Index] || 0,
    p99: sorted[p99Index] || 0,
  };
}

/**
 * Update statistics for an endpoint
 */
function updateStats(endpoint: string, duration: number) {
  const stats = responseTimeStats.get(endpoint) || {
    count: 0,
    total: 0,
    min: Infinity,
    max: 0,
    p50: 0,
    p95: 0,
    p99: 0,
    recent: [],
  };

  stats.count++;
  stats.total += duration;
  stats.min = Math.min(stats.min, duration);
  stats.max = Math.max(stats.max, duration);

  // Keep rolling window of recent durations
  stats.recent.push(duration);
  if (stats.recent.length > STATS_WINDOW_SIZE) {
    stats.recent.shift();
  }

  // Recalculate percentiles
  const percentiles = calculatePercentiles(stats.recent);
  stats.p50 = percentiles.p50;
  stats.p95 = percentiles.p95;
  stats.p99 = percentiles.p99;

  responseTimeStats.set(endpoint, stats);
}

/**
 * Get normalized endpoint path (removes query params and IDs for grouping)
 */
function getNormalizedEndpoint(url: string, method: string): string {
  try {
    const urlObj = new URL(url);
    let path = urlObj.pathname;

    // Normalize common ID patterns (UUIDs, numeric IDs)
    path = path.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id');
    path = path.replace(/\/\d+/g, '/:id');

    return `${method} ${path}`;
  } catch {
    return `${method} ${url}`;
  }
}

/**
 * Wrap an API route handler with response time tracking
 */
export function withResponseTime<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    const start = Date.now();
    let response: NextResponse;

    try {
      // Get request from args (Next.js route handlers receive Request as first arg)
      const request = args[0] as NextRequest | Request;
      const url = request.url || '';
      const method = request.method || 'GET';
      const endpoint = getNormalizedEndpoint(url, method);

      // Execute the handler
      response = await handler(...args);
      const duration = Date.now() - start;

      // Update statistics
      updateStats(endpoint, duration);

      // Log slow requests
      if (duration > SLOW_REQUEST_THRESHOLD_MS) {
        logWarn(`Slow API request detected`, {
          endpoint,
          duration: `${duration}ms`,
          statusCode: response.status,
          url,
        });
      }

      // Add response time header in development mode
      if (process.env.NODE_ENV === "development") {
        response.headers.set("X-Response-Time", `${duration}ms`);
        
        // Add statistics header (every 10th request to reduce noise)
        const stats = responseTimeStats.get(endpoint);
        if (stats && stats.count % 10 === 0) {
          response.headers.set("X-Response-Time-Stats", JSON.stringify({
            count: stats.count,
            avg: Math.round(stats.total / stats.count),
            min: stats.min,
            max: stats.max,
            p50: Math.round(stats.p50),
            p95: Math.round(stats.p95),
            p99: Math.round(stats.p99),
          }));
        }
      }

      // Log info for all requests in development (can be verbose)
      if (process.env.NODE_ENV === "development" && process.env.LOG_ALL_REQUESTS === "true") {
        logInfo(`API ${endpoint}`, {
          duration: `${duration}ms`,
          statusCode: response.status,
        });
      }

      return response;
    } catch (error) {
      const duration = Date.now() - start;
      const request = args[0] as NextRequest | Request;
      const url = request?.url || '';
      const method = request?.method || 'GET';
      const endpoint = getNormalizedEndpoint(url, method);

      // Update stats even for errors
      updateStats(endpoint, duration);

      logWarn(`API request error`, {
        endpoint,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : String(error),
      });

      // Re-throw the error
      throw error;
    }
  }) as T;
}

/**
 * Get current response time statistics for all endpoints
 * Useful for monitoring/health check endpoints
 */
export function getResponseTimeStats(): Record<string, {
  count: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}> {
  const stats: Record<string, any> = {};

  for (const [endpoint, data] of responseTimeStats.entries()) {
    stats[endpoint] = {
      count: data.count,
      avg: data.count > 0 ? Math.round(data.total / data.count) : 0,
      min: data.min === Infinity ? 0 : data.min,
      max: data.max,
      p50: Math.round(data.p50),
      p95: Math.round(data.p95),
      p99: Math.round(data.p99),
    };
  }

  return stats;
}

/**
 * Reset response time statistics (useful for testing)
 */
export function resetResponseTimeStats() {
  responseTimeStats.clear();
}

