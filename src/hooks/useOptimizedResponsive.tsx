import { useState, useEffect, useCallback } from 'react';
import {
  BREAKPOINTS,
  getBreakpoint,
  type Breakpoint,
} from '@/constants/breakpoints';

interface ResponsiveState {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const DEBOUNCE_DELAY = 100; // ms

export const useOptimizedResponsive = () => {
  const [state, setState] = useState<ResponsiveState>(() => {
    // Initial state - fallback for SSR
    const initialWidth =
      typeof window !== 'undefined' ? window.innerWidth : 1024;
    const initialHeight =
      typeof window !== 'undefined' ? window.innerHeight : 768;
    const breakpoint = getBreakpoint(initialWidth);

    return {
      width: initialWidth,
      height: initialHeight,
      breakpoint,
      isMobile: breakpoint === 'mobile',
      isTablet: breakpoint === 'tablet',
      isDesktop: breakpoint === 'desktop',
    };
  });

  const handleResize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const breakpoint = getBreakpoint(width);

    setState({
      width,
      height,
      breakpoint,
      isMobile: breakpoint === 'mobile',
      isTablet: breakpoint === 'tablet',
      isDesktop: breakpoint === 'desktop',
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Debounced resize handler
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, DEBOUNCE_DELAY);
    };

    // Set initial values
    handleResize();

    // Add event listener
    window.addEventListener('resize', debouncedResize, { passive: true });

    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [handleResize]);

  return state;
};

// Performance optimized hook for components that only need breakpoint
export const useBreakpoint = (): Breakpoint => {
  const { breakpoint } = useOptimizedResponsive();
  return breakpoint;
};

// Hook for checking specific breakpoints
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};
