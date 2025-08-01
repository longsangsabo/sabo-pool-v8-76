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

/**
 * Utility to preload components on user interaction
 */
export const preloadComponent = (importFn: () => Promise<any>) => {
  return () => {
    importFn();
  };
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
