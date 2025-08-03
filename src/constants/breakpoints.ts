// Unified breakpoint system for consistent responsive behavior
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;
export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

// Helper functions for breakpoint calculations
export const getBreakpoint = (width: number): Breakpoint => {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
};

export const isBreakpoint = (
  width: number,
  breakpoint: Breakpoint
): boolean => {
  switch (breakpoint) {
    case 'mobile':
      return width < BREAKPOINTS.mobile;
    case 'tablet':
      return width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
    case 'desktop':
      return width >= BREAKPOINTS.tablet;
    default:
      return false;
  }
};

// CSS media queries for static styling
export const MEDIA_QUERIES = {
  mobile: `(max-width: ${BREAKPOINTS.mobile - 1}px)`,
  tablet: `(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`,
  desktop: `(min-width: ${BREAKPOINTS.tablet}px)`,
  mobileOnly: `(max-width: ${BREAKPOINTS.mobile - 1}px)`,
  tabletAndUp: `(min-width: ${BREAKPOINTS.mobile}px)`,
  desktopOnly: `(min-width: ${BREAKPOINTS.tablet}px)`,
} as const;
