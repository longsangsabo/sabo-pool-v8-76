/**
 * Production-ready application configuration
 * Implements security, performance, and monitoring optimizations
 */

export const PRODUCTION_CONFIG = {
  // Security configuration
  security: {
    // API timeout settings (prevent hanging requests)
    apiTimeout: 30000, // 30 seconds

    // Rate limiting configuration
    rateLimiting: {
      maxRequestsPerMinute: 100,
      maxConcurrentRequests: 10,
    },

    // Content Security Policy
    csp: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: [
        "'self'",
        'https://exlqvlbawytbglioqfbc.supabase.co',
        'wss://exlqvlbawytbglioqfbc.supabase.co',
      ],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    },
  },

  // Performance configuration
  performance: {
    // Bundle optimization
    bundleOptimization: {
      chunkSizeWarningLimit: 500000, // 500KB
      enableAutoChunking: true, // Use Vite's automatic chunking instead of manual configuration
      enableTreeShaking: true,
    },

    // Memory management
    memory: {
      maxComponentCacheSize: 100,
      enableMemoization: true,
      gcInterval: 300000, // 5 minutes
    },

    // Network optimization
    network: {
      enableCaching: true,
      cacheStrategy: 'cache-first',
      retryAttempts: 3,
      retryDelay: 1000,
    },
  },

  // Monitoring configuration
  monitoring: {
    // Error tracking
    errorTracking: {
      enabled: true,
      sampleRate: 1.0, // 100% for production
      maxBreadcrumbs: 50,
    },

    // Performance monitoring
    performanceMonitoring: {
      enabled: true,
      trackWebVitals: true,
      trackCustomMetrics: true,
    },

    // Analytics
    analytics: {
      enabled: true,
      trackPageViews: true,
      trackUserInteractions: true,
    },
  },

  // Database configuration
  database: {
    // Supabase configuration
    supabase: {
      url: 'https://exlqvlbawytbglioqfbc.supabase.co',
      anonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4bHF2bGJhd3l0YmdsaW9xZmJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODAwODgsImV4cCI6MjA2ODY1NjA4OH0.-WHrBx32yHJwhqXAYUOdW5fytPvpzc4AFttXBl3MykA',

      // Connection optimization
      connection: {
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 30000,
        keepAlive: true,
      },

      // Query optimization
      queries: {
        enableQueryCache: true,
        defaultCacheTime: 300000, // 5 minutes
        staleTime: 60000, // 1 minute
      },
    },
  },

  // Feature flags for gradual rollout
  features: {
    enablePWA: true,
    enableOfflineMode: true,
    enableNotifications: true,
    enableAnalytics: true,
    enablePerformanceMonitoring: true,
  },

  // Environment-specific settings
  environment: {
    isDevelopment: import.meta.env.MODE === 'development',
    isProduction: import.meta.env.MODE === 'production',
    isPreview: import.meta.env.MODE === 'preview',

    // Logging configuration
    logging: {
      level: import.meta.env.MODE === 'production' ? 'error' : 'debug',
      enableConsoleOutput: import.meta.env.MODE !== 'production',
      enableRemoteLogging: import.meta.env.MODE === 'production',
    },
  },
} as const;

// Security headers for Netlify deployment
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': Object.entries(PRODUCTION_CONFIG.security.csp)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; '),
};

// Performance optimization presets
export const PERFORMANCE_PRESETS = {
  // React optimization
  react: {
    enableStrictMode: true,
    enableConcurrentFeatures: true,
    enableSuspense: true,
  },

  // Vite optimization - completely removed all chunking configurations for safety
  vite: {
    build: {
      target: 'es2020',
      minify: 'esbuild', // Changed from 'terser' to 'esbuild' to match vite.config.ts
      // Fully rely on Vite's automatic chunking - all manual configurations removed
      // This prevents React conflicts and initialization errors
    },
  },
};

// Initialize production optimizations
export function initializeProductionOptimizations() {
  try {
    if (PRODUCTION_CONFIG.environment.isProduction) {
      // Disable console logs in production (except errors)
      if (!PRODUCTION_CONFIG.environment.logging.enableConsoleOutput) {
        const noop = () => {};
        console.log = noop;
        console.info = noop;
        console.warn = noop;
        console.debug = noop;
      }

      // Initialize performance monitoring
      if (PRODUCTION_CONFIG.monitoring.performanceMonitoring.enabled) {
        initializePerformanceMonitoring();
      }

      // Initialize error tracking
      if (PRODUCTION_CONFIG.monitoring.errorTracking.enabled) {
        initializeErrorTracking();
      }
    }
  } catch (err) {
    // Safe error handling to prevent initialization errors
    console.error('Failed to initialize production optimizations:', err);
  }
}

function initializePerformanceMonitoring() {
  // Core Web Vitals tracking
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        // Track and report performance metrics
        console.info('Performance metric:', {
          name: entry.name,
          value: (entry as any).value || entry.duration || entry.startTime,
          timestamp: entry.startTime,
        });
      }
    });

    observer.observe({
      entryTypes: ['measure', 'navigation', 'largest-contentful-paint'],
    });
  }
}

function initializeErrorTracking() {
  // Global error handler for production
  if (typeof window !== 'undefined') {
    window.addEventListener('error', event => {
      console.error('Global error:', {
        message: event.error?.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString(),
      });
    });
  }
}
