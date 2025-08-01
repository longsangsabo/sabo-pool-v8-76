// Standard navigation patterns for consistent behavior across all layouts

export interface NavigationConfig {
  showBottomNav: boolean;
  showSidebar: boolean;
  showHeader: boolean;
  headerHeight: string;
  sidebarWidth: {
    collapsed: string;
    expanded: string;
  };
  bottomNavHeight: string;
}

export const NAVIGATION_CONFIGS = {
  mobile: {
    showBottomNav: true,
    showSidebar: false,
    showHeader: true,
    headerHeight: 'h-16',
    sidebarWidth: {
      collapsed: 'w-0',
      expanded: 'w-0',
    },
    bottomNavHeight: 'h-16',
  },
  tablet: {
    showBottomNav: true,
    showSidebar: false,
    showHeader: true,
    headerHeight: 'h-16',
    sidebarWidth: {
      collapsed: 'w-0',
      expanded: 'w-0',
    },
    bottomNavHeight: 'h-20',
  },
  desktop: {
    showBottomNav: false,
    showSidebar: true,
    showHeader: true,
    headerHeight: 'h-14',
    sidebarWidth: {
      collapsed: 'w-16',
      expanded: 'w-64',
    },
    bottomNavHeight: 'h-0',
  },
} as const;

export type NavigationMode = keyof typeof NAVIGATION_CONFIGS;

export const getNavigationConfig = (mode: NavigationMode): NavigationConfig => {
  return NAVIGATION_CONFIGS[mode];
};
