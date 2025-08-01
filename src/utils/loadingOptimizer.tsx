import { lazy, ComponentType, useRef, useEffect } from 'react';

/**
 * PHASE 3: Dynamic Import Optimization
 * Lazy load heavy dependencies only when needed
 */

// ✅ Heavy UI Components - Load on demand
export const LazyCharts = lazy(() => 
  import('recharts').then(module => ({
    default: () => <div>Charts loaded dynamically</div>
  }))
);

export const LazyAnimation = lazy(() =>
  import('framer-motion').then(module => ({
    default: module.motion.div
  }))
);

// ✅ Heavy Feature Modules - Using existing components
export const LazyTournamentBracket = lazy(() => 
  import('@/components/tournament/TournamentBracket').then(module => ({
    default: module.default || module.TournamentBracket
  }))
);

/**
 * Utility to preload components on user interaction
 */
export const preloadComponent = (importFn: () => Promise<any>) => {
  // Preload on hover/focus for better UX
  return () => {
    importFn();
  };
};

/**
 * HOC for progressive loading
 */
export const withProgressiveLoading = <P extends object>(
  Component: ComponentType<P>,
  fallback: ComponentType = () => <div>Loading...</div>
) => {
  return lazy(() =>
    Promise.resolve({ default: Component })
  );
};

/**
 * Intersection Observer for lazy loading
 */
export const useLazyLoad = (callback: () => void, threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback();
          observer.disconnect();
        }
      },
      { threshold }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [callback, threshold]);
  
  return ref;
};

/**
 * Smart dependency loader
 */
export class DependencyLoader {
  private static loadedDeps = new Set<string>();
  
  static async loadDependency(name: string, importFn: () => Promise<any>) {
    if (this.loadedDeps.has(name)) {
      return;
    }
    
    try {
      await importFn();
      this.loadedDeps.add(name);
      console.log(`✅ Loaded dependency: ${name}`);
    } catch (error) {
      console.error(`❌ Failed to load dependency: ${name}`, error);
    }
  }
  
  static async preloadCriticalDeps() {
    // Load critical dependencies in background
    const criticalDeps = [
      ['recharts', () => import('recharts')],
      ['framer-motion', () => import('framer-motion')],
      ['date-fns-locale', () => import('date-fns/locale/vi')],
    ];
    
    await Promise.allSettled(
      criticalDeps.map(([name, importFn]) => 
        this.loadDependency(name as string, importFn as () => Promise<any>)
      )
    );
  }
}

/**
 * Utility to preload components on user interaction
 */
export const preloadComponent = (importFn: () => Promise<any>) => {
  // Preload on hover/focus for better UX
  return () => {
    importFn();
  };
};

/**
 * HOC for progressive loading
 */
export const withProgressiveLoading = <P extends object>(
  Component: ComponentType<P>,
  fallback: ComponentType = () => <div>Loading...</div>
) => {
  return lazy(() =>
    Promise.resolve({ default: Component })
  );
};

/**
 * Intersection Observer for lazy loading
 */
export const useLazyLoad = (callback: () => void, threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback();
          observer.disconnect();
        }
      },
      { threshold }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [callback, threshold]);
  
  return ref;
};

/**
 * Smart dependency loader
 */
export class DependencyLoader {
  private static loadedDeps = new Set<string>();
  
  static async loadDependency(name: string, importFn: () => Promise<any>) {
    if (this.loadedDeps.has(name)) {
      return;
    }
    
    try {
      await importFn();
      this.loadedDeps.add(name);
      console.log(`✅ Loaded dependency: ${name}`);
    } catch (error) {
      console.error(`❌ Failed to load dependency: ${name}`, error);
    }
  }
  
  static async preloadCriticalDeps() {
    // Load critical dependencies in background
    const criticalDeps = [
      ['recharts', () => import('recharts')],
      ['framer-motion', () => import('framer-motion')],
      ['date-fns-locale', () => import('date-fns/locale/vi')],
    ];
    
    await Promise.allSettled(
      criticalDeps.map(([name, importFn]) => 
        this.loadDependency(name as string, importFn as () => Promise<any>)
      )
    );
  }
}
