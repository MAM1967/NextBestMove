/**
 * Simple in-memory cache for free/busy data.
 * Key: userId:date (e.g., "user123:2025-01-27")
 * Value: { freeMinutes, busySlots, capacity, timestamp }
 */

type CacheEntry = {
  freeMinutes: number;
  busySlots: Array<{ start: string; end: string }>;
  capacity: "micro" | "light" | "standard" | "heavy" | "default";
  suggestedActionCount: number;
  timestamp: number;
};

const cache = new Map<string, CacheEntry>();

/**
 * Get cache TTL based on date (today is more likely to change).
 */
function getCacheTTL(date: string): number {
  const today = new Date().toISOString().split("T")[0];
  const isToday = date === today;
  const isPast = date < today;

  if (isPast) {
    return 60 * 60 * 1000; // 1 hour for past dates
  } else if (isToday) {
    return 5 * 60 * 1000; // 5 minutes for today
  } else {
    return 10 * 60 * 1000; // 10 minutes for future dates
  }
}

/**
 * Get cached free/busy data if available and fresh.
 */
export function getCachedFreeBusy(
  userId: string,
  date: string
): CacheEntry | null {
  const key = `${userId}:${date}`;
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  const ttl = getCacheTTL(date);
  const age = Date.now() - entry.timestamp;

  if (age > ttl) {
    // Cache expired, remove it
    cache.delete(key);
    return null;
  }

  return entry;
}

/**
 * Store free/busy data in cache.
 */
export function setCachedFreeBusy(
  userId: string,
  date: string,
  data: Omit<CacheEntry, "timestamp">
): void {
  const key = `${userId}:${date}`;
  cache.set(key, {
    ...data,
    timestamp: Date.now(),
  });
}

/**
 * Invalidate cache for a specific user and date (or all dates for user).
 */
export function invalidateCache(userId: string, date?: string): void {
  if (date) {
    const key = `${userId}:${date}`;
    cache.delete(key);
  } else {
    // Remove all entries for this user
    for (const key of cache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        cache.delete(key);
      }
    }
  }
}

/**
 * Clear all cache (useful for testing or memory management).
 */
export function clearCache(): void {
  cache.clear();
}


