import { useAuth } from './useAuth';
import { useAdminCheck } from './useAdminCheck';
import { useClubRole } from './useClubRole';
import { useAdminDashboard } from './useAdminDashboard';
import { useSocialFeed } from './useSocialFeed';

/**
 * Unified dashboard hook that provides data based on user role
 */
export const useUnifiedDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { isClubOwner, isLoading: clubLoading } = useClubRole();

  // Admin dashboard data
  const adminData = useAdminDashboard();

  // Social feed data for regular users
  const socialData = useSocialFeed();

  const isLoading = authLoading || adminLoading || clubLoading;

  // Determine user role and dashboard type
  const getDashboardType = () => {
    if (!user) return 'guest';
    if (isAdmin) return 'admin';
    if (isClubOwner) return 'club';
    return 'player';
  };

  const dashboardType = getDashboardType();

  // Return appropriate data based on role
  const getDashboardData = () => {
    switch (dashboardType) {
      case 'admin':
        return {
          type: 'admin' as const,
          data: adminData,
          stats: adminData.stats,
          recentActivity: adminData.recentActivity,
        };
      case 'club':
        return {
          type: 'club' as const,
          data: null, // TODO: Add club dashboard data
          stats: null,
          recentActivity: [],
        };
      case 'player':
        return {
          type: 'player' as const,
          data: socialData,
          feedPosts: socialData.feedPosts,
          stories: socialData.stories,
        };
      default:
        return {
          type: 'guest' as const,
          data: null,
        };
    }
  };

  return {
    user,
    dashboardType,
    isLoading,
    ...getDashboardData(),
    refreshData: () => {
      if (dashboardType === 'admin') {
        adminData.refetch();
      } else if (dashboardType === 'player') {
        socialData.refreshFeed();
      }
    },
  };
};
