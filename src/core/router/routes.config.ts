// =============================================================================
// FOUNDATION ROUTING STRUCTURE
// =============================================================================
// This file defines the core routing structure for SABO Pool application
// Components will be mapped to existing ones after team cleanup

export interface RouteConfig {
  path: string;
  element: React.ComponentType;
  layout: 'user' | 'admin' | 'club' | 'public';
  roles?: string[];
  permissions?: string[];
}

// Route structure definition
export const ROUTE_STRUCTURE = {
  // Public routes
  PUBLIC: {
    home: '/',
    about: '/about',
    contact: '/contact', 
    privacy: '/privacy',
    terms: '/terms',
    news: '/news',
    tournaments: '/tournaments',
    leaderboard: '/leaderboard',
    clubs: '/clubs',
    clubDetail: '/clubs/:id',
  },

  // Auth routes
  AUTH: {
    base: '/auth',
    login: '/auth?mode=login',
    register: '/auth?mode=register',
    forgotPassword: '/auth?mode=forgot-password',
    resetPassword: '/auth?mode=reset-password',
    callback: '/auth/callback',
  },

  // User routes
  USER: {
    base: '/user',
    dashboard: '/user/dashboard',
    profile: '/user/profile',
    challenges: '/user/challenges',
    community: '/user/community',
    calendar: '/user/calendar',
    settings: '/user/settings',
    wallet: '/user/wallet',
    marketplace: '/user/marketplace',
    feed: '/user/feed',
  },

  // Club routes
  CLUB: {
    base: '/club',
    dashboard: '/club/dashboard',
    registration: '/club/registration',
    management: '/club/management',
    tournaments: '/club/management/tournaments',
    challenges: '/club/management/challenges',
    verification: '/club/management/verification',
    members: '/club/management/members',
    notifications: '/club/management/notifications',
    schedule: '/club/management/schedule',
    payments: '/club/management/payments',
    settings: '/club/management/settings',
  },

  // Admin routes
  ADMIN: {
    base: '/admin',
    dashboard: '/admin',
    users: '/admin/users',
    clubs: '/admin/clubs',
    rankVerification: '/admin/rank-verification',
    transactions: '/admin/transactions',
    challenges: '/admin/challenges',
    tournaments: '/admin/tournaments',
    analytics: '/admin/analytics',
    notifications: '/admin/notifications',
    database: '/admin/database',
    automation: '/admin/automation',
    system: '/admin/system',
    tools: '/admin/tools',
    settings: '/admin/settings',
  },

  // Legacy redirects
  LEGACY: {
    '/dashboard': '/user/dashboard',
    '/profile': '/user/profile',
    '/challenges': '/user/challenges',
    '/community': '/user/community',
    '/calendar': '/user/calendar',
    '/settings': '/user/settings',
    '/wallet': '/user/wallet',
    '/marketplace': '/user/marketplace',
    '/feed': '/user/feed',
    '/clb': '/club/dashboard',
    '/club-registration': '/club/registration',
    '/club-management': '/club/management',
    '/login': '/auth?mode=login',
    '/register': '/auth?mode=register',
    '/forgot-password': '/auth?mode=forgot-password',
    '/reset-password': '/auth?mode=reset-password',
  },
} as const;

export default ROUTE_STRUCTURE;
