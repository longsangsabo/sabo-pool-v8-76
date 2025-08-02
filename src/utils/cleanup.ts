/**
 * Production-ready cleanup utilities for memory leak prevention
 */

// Timer cleanup utility
export class TimerManager {
  private timers: Set<NodeJS.Timeout> = new Set();
  private intervals: Set<NodeJS.Timeout> = new Set();

  setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      callback();
    }, delay);
    this.timers.add(timer);
    return timer;
  }

  setInterval(callback: () => void, delay: number): NodeJS.Timeout {
    const interval = setInterval(callback, delay);
    this.intervals.add(interval);
    return interval;
  }

  clearTimeout(timer: NodeJS.Timeout): void {
    clearTimeout(timer);
    this.timers.delete(timer);
  }

  clearInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval);
    this.intervals.delete(interval);
  }

  clearAll(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.intervals.forEach(interval => clearInterval(interval));
    this.timers.clear();
    this.intervals.clear();
  }
}

// Event listener cleanup utility
export class EventManager {
  private listeners: Array<{
    target: EventTarget;
    type: string;
    listener: EventListener;
    options?: boolean | AddEventListenerOptions;
  }> = [];

  addEventListener(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    target.addEventListener(type, listener, options);
    this.listeners.push({ target, type, listener, options });
  }

  removeEventListener(
    target: EventTarget,
    type: string,
    listener: EventListener
  ): void {
    target.removeEventListener(type, listener);
    this.listeners = this.listeners.filter(
      l => !(l.target === target && l.type === type && l.listener === listener)
    );
  }

  removeAllListeners(): void {
    this.listeners.forEach(({ target, type, listener }) => {
      target.removeEventListener(type, listener);
    });
    this.listeners = [];
  }
}

// React hook for automatic cleanup
export function useCleanup() {
  const timers = new TimerManager();
  const events = new EventManager();

  const cleanup = () => {
    timers.clearAll();
    events.removeAllListeners();
  };

  return {
    timers,
    events,
    cleanup
  };
}

// Subscription manager for observable patterns
export class SubscriptionManager {
  private subscriptions: Array<() => void> = [];

  add(unsubscribe: () => void): void {
    this.subscriptions.push(unsubscribe);
  }

  unsubscribeAll(): void {
    this.subscriptions.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('Error during unsubscribe:', error);
      }
    });
    this.subscriptions = [];
  }
}

// Global cleanup for production
export const globalCleanup = {
  memoryLeakDetection: {
    enabled: process.env.NODE_ENV === 'development',
    
    detectLeaks() {
      if (!this.enabled) return;
      
      // Check for potential memory leaks
      const timers = (window as any).__timers_created || 0;
      const listeners = (window as any).__listeners_created || 0;
      
      if (timers > 100) {
        console.warn('🚨 Potential timer leak detected:', timers, 'timers created');
      }
      
      if (listeners > 100) {
        console.warn('🚨 Potential event listener leak detected:', listeners, 'listeners created');
      }
    }
  },
  
  performanceMonitoring: {
    enabled: process.env.NODE_ENV === 'production',
    
    trackPerformance() {
      if (!this.enabled || typeof window === 'undefined') return;
      
      // Track Core Web Vitals
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              const lcp = entry.startTime;
              if (lcp > 2500) {
                console.warn('⚠️ Poor LCP performance:', lcp, 'ms');
              }
            }
          }
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      }
    }
  }
};

// Production error boundary utility
export const productionErrorHandler = {
  setup() {
    if (process.env.NODE_ENV === 'production') {
      // Global error handler
      window.addEventListener('error', (event) => {
        // Only log critical errors in production
        if (event.error && !event.error.message?.includes('script error')) {
          console.error('Production error:', {
            message: event.error.message,
            stack: event.error.stack?.substring(0, 1000), // Limit stack trace
            timestamp: new Date().toISOString()
          });
        }
      });

      // Unhandled promise rejection handler
      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled rejection:', {
          reason: event.reason?.toString?.() || 'Unknown',
          timestamp: new Date().toISOString()
        });
      });
    }
  }
};