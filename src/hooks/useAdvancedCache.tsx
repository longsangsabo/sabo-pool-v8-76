import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from '@/utils/offlineStorage';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
  strategy?: 'lru' | 'fifo' | 'lfu'; // Eviction strategy
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccess: number;
}

export const useAdvancedCache = <T = any>(key: string, options: CacheOptions = {}) => {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    maxSize = 100,
    strategy = 'lru'
  } = options;

  const [cache, setCache] = useState<Map<string, CacheEntry<T>>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Initialize cache from storage
  useEffect(() => {
    const initCache = async () => {
      try {
        const stored = offlineStorage.get(`cache_${key}`) as [string, CacheEntry<T>][] | null;
        if (stored && Array.isArray(stored)) {
          setCache(new Map(stored));
        }
      } catch (error) {
        console.warn('Failed to load cache from storage:', error);
      }
    };
    initCache();
  }, [key]);

  // Persist cache to storage
  const persistCache = useCallback(async (cacheMap: Map<string, CacheEntry<T>>) => {
    try {
      offlineStorage.set(`cache_${key}`, Array.from(cacheMap.entries()));
    } catch (error) {
      console.warn('Failed to persist cache:', error);
    }
  }, [key]);

  // Check if cache entry is valid
  const isValidEntry = useCallback((entry: CacheEntry<T>): boolean => {
    return Date.now() - entry.timestamp < ttl;
  }, [ttl]);

  // Evict entries based on strategy
  const evictEntries = useCallback((cacheMap: Map<string, CacheEntry<T>>) => {
    if (cacheMap.size <= maxSize) return cacheMap;

    const entries = Array.from(cacheMap.entries());
    let sortedEntries: [string, CacheEntry<T>][];

    switch (strategy) {
      case 'lru':
        sortedEntries = entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);
        break;
      case 'lfu':
        sortedEntries = entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
        break;
      case 'fifo':
      default:
        sortedEntries = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        break;
    }

    // Remove oldest entries
    const toRemove = sortedEntries.slice(0, sortedEntries.length - maxSize);
    toRemove.forEach(([entryKey]) => cacheMap.delete(entryKey));

    return cacheMap;
  }, [maxSize, strategy]);

  // Get data from cache
  const get = useCallback((cacheKey: string): T | null => {
    const entry = cache.get(cacheKey);
    if (!entry || !isValidEntry(entry)) {
      cache.delete(cacheKey);
      return null;
    }

    // Update access stats
    entry.lastAccess = Date.now();
    entry.accessCount++;
    
    setCache(new Map(cache));
    return entry.data;
  }, [cache, isValidEntry]);

  // Set data in cache
  const set = useCallback(async (cacheKey: string, data: T) => {
    const newCache = new Map(cache);
    
    newCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccess: Date.now()
    });

    // Clean up expired entries
    for (const [key, entry] of newCache.entries()) {
      if (!isValidEntry(entry)) {
        newCache.delete(key);
      }
    }

    // Apply eviction strategy
    const evictedCache = evictEntries(newCache);
    setCache(evictedCache);
    await persistCache(evictedCache);
  }, [cache, isValidEntry, evictEntries, persistCache]);

  // Remove specific entry
  const remove = useCallback(async (cacheKey: string) => {
    const newCache = new Map(cache);
    newCache.delete(cacheKey);
    setCache(newCache);
    await persistCache(newCache);
  }, [cache, persistCache]);

  // Clear all cache
  const clear = useCallback(async () => {
    setCache(new Map());
    offlineStorage.remove(`cache_${key}`);
  }, [key]);

  // Cache-first data fetching
  const fetchWithCache = useCallback(async (
    cacheKey: string,
    fetchFn: () => Promise<T>,
    forceRefresh = false
  ): Promise<T> => {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = get(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    setIsLoading(true);
    try {
      const data = await fetchFn();
      await set(cacheKey, data);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, [get, set]);

  // Get cache statistics
  const getStats = useCallback(() => {
    const entries = Array.from(cache.values());
    const validEntries = entries.filter(isValidEntry);
    
    return {
      totalEntries: cache.size,
      validEntries: validEntries.length,
      expiredEntries: cache.size - validEntries.length,
      averageAccessCount: validEntries.length > 0 
        ? validEntries.reduce((sum, entry) => sum + entry.accessCount, 0) / validEntries.length 
        : 0,
      oldestEntry: validEntries.length > 0 
        ? Math.min(...validEntries.map(entry => entry.timestamp))
        : null,
      newestEntry: validEntries.length > 0 
        ? Math.max(...validEntries.map(entry => entry.timestamp))
        : null
    };
  }, [cache, isValidEntry]);

  return {
    get,
    set,
    remove,
    clear,
    fetchWithCache,
    getStats,
    isLoading,
    cacheSize: cache.size
  };
};