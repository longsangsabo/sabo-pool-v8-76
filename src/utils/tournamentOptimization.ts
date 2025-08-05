// Tournament optimization utilities for performance and reliability

export interface TournamentOptimizationConfig {
  debounceTime: number;
  maxRetries: number;
  cacheTimeout: number;
  batchSize: number;
}

export const defaultOptimizationConfig: TournamentOptimizationConfig = {
  debounceTime: 800,
  maxRetries: 3,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  batchSize: 50,
};

// Rate limiting for tournament operations
const operationTimestamps = new Map<string, number>();

export const shouldAllowOperation = (
  operationKey: string,
  cooldownMs: number = 1000
): boolean => {
  const now = Date.now();
  const lastOperation = operationTimestamps.get(operationKey);

  if (!lastOperation || now - lastOperation > cooldownMs) {
    operationTimestamps.set(operationKey, now);
    return true;
  }

  return false;
};

// Cleanup stale data and prevent memory leaks
export const cleanupTournamentData = (tournamentId: string) => {
  // Clear localStorage entries for this tournament
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes(tournamentId) || key.includes('bracket-fix'))) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key));

  // Clear operation timestamps
  Array.from(operationTimestamps.keys())
    .filter(key => key.includes(tournamentId))
    .forEach(key => operationTimestamps.delete(key));

  console.log('🧹 Cleaned up tournament data for:', tournamentId);
};

// Debounced function utility
export const createDebouncedFunction = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout;

  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};

// Performance monitoring
export const trackTournamentPerformance = (
  operation: string,
  tournamentId: string,
  startTime: number
) => {
  const duration = Date.now() - startTime;
  console.log(`⚡ ${operation} for tournament ${tournamentId}: ${duration}ms`);

  // Log slow operations
  if (duration > 2000) {
    console.warn(`🐌 Slow operation detected: ${operation} took ${duration}ms`);
  }
};

// Batch profile loading utility
export const batchProfileLoader = async (
  userIds: string[],
  batchSize: number = 20
): Promise<any[]> => {
  const results: any[] = [];

  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    // This would be implemented by the profile cache
    // results.push(...await loadProfileBatch(batch));
  }

  return results;
};
