/**
 * Role-based dynamic loading utilities
 * Prevents loading admin code for regular users
 */

export const loadAdminModule = async () => {
  // Only load admin modules when explicitly requested
  const adminModule = await import('@/router/AdminRouter');
  return adminModule.default;
};

export const loadUserModule = async (moduleName: string) => {
  // Load user-specific modules
  switch (moduleName) {
    case 'dashboard':
      return (await import('@/pages/DashboardPage')).default;
    case 'challenges':
      return (await import('@/pages/EnhancedChallengesPageV2')).default;
    case 'tournaments':
      return (await import('@/pages/TournamentsPage')).default;
    default:
      throw new Error(`Unknown user module: ${moduleName}`);
  }
};

export const getUserPermissions = (userRole?: string) => {
  const permissions = {
    canAccessAdmin: false,
    canManageUsers: false,
    canManageClubs: false,
    canAccessAnalytics: false,
  };

  if (userRole === 'admin') {
    return {
      canAccessAdmin: true,
      canManageUsers: true,
      canManageClubs: true,
      canAccessAnalytics: true,
    };
  }

  return permissions;
};
