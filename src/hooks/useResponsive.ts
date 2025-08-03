import { useOptimizedResponsive } from './useOptimizedResponsive';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: Breakpoint;
  width: number;
  height: number;
}

// Re-export the optimized hook as the main responsive hook
export const useResponsive = useOptimizedResponsive;

// Legacy hook - now uses the optimized version under the hood
// Kept for backward compatibility but redirects to optimized implementation

// Import responsive classes from optimized hook
export { responsiveClasses } from './useOptimizedResponsive';
