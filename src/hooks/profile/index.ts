// Export all profile-related hooks
// File: /src/hooks/profile/index.ts

export { useProfileStatistics } from './useProfileStatistics';
export { useUserActivities, useRecentActivities } from './useUserActivities';
export {
  useUserAchievements,
  useAvailableAchievements,
  useAchievementOverview,
} from './useUserAchievements';
export {
  useSPAPointsHistory,
  useRecentSPAPointsTransactions,
  useSPAPointsSummary,
} from './useSPAPoints';
export {
  useLeaderboard,
  useUserRanking,
  useLeaderboardWithUserPosition,
} from './useLeaderboard';

// Re-export main unified profile hook
export { useUnifiedProfile } from '../useUnifiedProfile';
