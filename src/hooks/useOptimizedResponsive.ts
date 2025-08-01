import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BREAKPOINTS,
  getBreakpoint,
  type Breakpoint,
} from '@/constants/breakpoints';

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: Breakpoint;
  width: number;
  height: number;
}

// Debounce function to prevent excessive re-renders
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const getInitialState = (): ResponsiveState => {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      breakpoint: 'desktop',
      width: 1024,
      height: 768,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const breakpoint = getBreakpoint(width);

  return {
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    breakpoint,
    width,
    height,
  };
};

export const useOptimizedResponsive = (): ResponsiveState => {
  const [state, setState] = useState<ResponsiveState>(getInitialState);

  const updateState = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const breakpoint = getBreakpoint(width);

    const newState = {
      isMobile: breakpoint === 'mobile',
      isTablet: breakpoint === 'tablet',
      isDesktop: breakpoint === 'desktop',
      breakpoint,
      width,
      height,
    };

    // Only update if something actually changed
    setState(prevState => {
      if (
        prevState.breakpoint === newState.breakpoint &&
        prevState.width === newState.width &&
        prevState.height === newState.height
      ) {
        return prevState;
      }
      return newState;
    });
  }, []);

  // Debounced resize handler
  const debouncedUpdateState = useMemo(
    () => debounce(updateState, 150),
    [updateState]
  );

  useEffect(() => {
    // Initial update
    updateState();

    // Add event listener with debounced handler
    window.addEventListener('resize', debouncedUpdateState);

    // Cleanup
    return () => {
      window.removeEventListener('resize', debouncedUpdateState);
    };
  }, [updateState, debouncedUpdateState]);

  return state;
};

// CSS-first responsive utilities using consistent breakpoints
export const responsiveClasses = {
  mobileOnly: 'lg:hidden',
  tabletOnly: 'hidden md:block lg:hidden',
  desktopOnly: 'hidden lg:block',
  mobileAndTablet: 'lg:hidden',
  tabletAndDesktop: 'hidden md:block',
} as const;
