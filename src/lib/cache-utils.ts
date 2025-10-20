/**
 * Simple in-memory cache with TTL support
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class Cache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Set a value in cache with TTL (time-to-live) in milliseconds
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get a value from cache if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if entry has expired
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if a key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get all keys in cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`Cache cleanup: removed ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Destroy cache and cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: this.keys(),
    };
  }
}

// Create singleton instance
export const cache = new Cache();

/**
 * Cache key generators for common data types
 */
export const cacheKeys = {
  students: (filter?: string) => `students${filter ? `-${filter}` : ''}`,
  teachers: (filter?: string) => `teachers${filter ? `-${filter}` : ''}`,
  classes: (filter?: string) => `classes${filter ? `-${filter}` : ''}`,
  payments: (filter?: string) => `payments${filter ? `-${filter}` : ''}`,
  student: (id: string) => `student-${id}`,
  teacher: (id: string) => `teacher-${id}`,
  class: (id: string) => `class-${id}`,
  dashboard: (userId: string, role: string) => `dashboard-${role}-${userId}`,
};

/**
 * Default TTL values (in milliseconds)
 */
export const cacheTTL = {
  short: 1 * 60 * 1000, // 1 minute
  medium: 5 * 60 * 1000, // 5 minutes
  long: 15 * 60 * 1000, // 15 minutes
  veryLong: 60 * 60 * 1000, // 1 hour
};

/**
 * Helper function to get or fetch data with caching
 */
export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = cacheTTL.medium
): Promise<T> {
  // Try to get from cache first
  const cached = cache.get<T>(key);
  if (cached !== null) {
    console.log(`Cache hit: ${key}`);
    return cached;
  }

  // Fetch fresh data
  console.log(`Cache miss: ${key}, fetching...`);
  const data = await fetchFn();

  // Store in cache
  cache.set(key, data, ttl);

  return data;
}

/**
 * Invalidate cache entries by pattern
 */
export function invalidateCache(pattern: string | RegExp): number {
  const keys = cache.keys();
  let count = 0;

  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

  keys.forEach((key) => {
    if (regex.test(key)) {
      cache.delete(key);
      count++;
    }
  });

  console.log(`Invalidated ${count} cache entries matching pattern: ${pattern}`);
  return count;
}
