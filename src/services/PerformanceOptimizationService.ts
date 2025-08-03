import { debounce } from 'lodash';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  cacheHitRate: number;
}

class PerformanceOptimizationService {
  private cache = new Map<string, CacheEntry>();
  private metrics = new Map<string, PerformanceMetrics>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  // Memoization with TTL
  memoize<T>(key: string, fn: () => T, ttl: number = this.DEFAULT_TTL): T {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      this.updateMetrics(key, 'cache_hit');
      return cached.data;
    }

    const result = fn();
    this.cache.set(key, {
      data: result,
      timestamp: Date.now(),
      ttl,
    });

    this.updateMetrics(key, 'cache_miss');
    return result;
  }

  // Direct debounce method for compatibility
  debounce<T extends (...args: any[]) => any>(fn: T, delay: number = 300): T {
    return debounce(fn, delay) as T;
  }

  // Debounced function creator
  createDebouncedFunction<T extends (...args: any[]) => any>(
    fn: T,
    delay: number = 300
  ): T {
    return debounce(fn, delay) as T;
  }

  // Performance measurement
  measurePerformance<T>(key: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    this.updateRenderMetrics(key, end - start);
    return result;
  }

  // Lazy loading utility
  createLazyComponent<T>(importFn: () => Promise<T>) {
    let componentPromise: Promise<T> | null = null;

    return () => {
      if (!componentPromise) {
        componentPromise = importFn();
      }
      return componentPromise;
    };
  }

  // Cache cleanup
  cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get performance metrics
  getMetrics(
    key?: string
  ): PerformanceMetrics | Map<string, PerformanceMetrics> {
    if (key) {
      return (
        this.metrics.get(key) || {
          renderCount: 0,
          lastRenderTime: 0,
          averageRenderTime: 0,
          cacheHitRate: 0,
        }
      );
    }
    return this.metrics;
  }

  private updateMetrics(key: string, type: 'cache_hit' | 'cache_miss'): void {
    const current = this.metrics.get(key) || {
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      cacheHitRate: 0,
    };

    if (type === 'cache_hit') {
      current.cacheHitRate = (current.cacheHitRate + 1) / 2;
    } else {
      current.cacheHitRate = current.cacheHitRate / 2;
    }

    this.metrics.set(key, current);
  }

  private updateRenderMetrics(key: string, renderTime: number): void {
    const current = this.metrics.get(key) || {
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      cacheHitRate: 0,
    };

    current.renderCount++;
    current.lastRenderTime = renderTime;
    current.averageRenderTime =
      (current.averageRenderTime * (current.renderCount - 1) + renderTime) /
      current.renderCount;

    this.metrics.set(key, current);
  }
}

export const performanceService = new PerformanceOptimizationService();

// Auto cleanup cache every 10 minutes
setInterval(
  () => {
    performanceService.cleanupCache();
  },
  10 * 60 * 1000
);
