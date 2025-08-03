// Hook for leaderboard and ranking
// File: /src/hooks/profile/useLeaderboard.ts

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { profileAPI } from '@/services/api/profileAPI';

export const useLeaderboard = (limit = 50) => {
  const {
    data: leaderboard,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: async () => {
      return await profileAPI.getLeaderboard(limit);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  return {
    leaderboard: leaderboard || [],
    isLoading,
    error,
    refetch
  };
};

export const useUserRanking = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const {
    data: ranking,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['user-ranking', targetUserId],
    queryFn: async (): Promise<number | null> => {
      if (!targetUserId) {
        return null;
      }

      return await profileAPI.getUserRanking(targetUserId);
    },
    enabled: !!targetUserId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    ranking,
    isLoading,
    error,
    refetch
  };
};

// Combined leaderboard with user position
export const useLeaderboardWithUserPosition = (userId?: string, limit = 50) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  const { leaderboard, isLoading: leaderboardLoading } = useLeaderboard(limit);
  const { ranking, isLoading: rankingLoading } = useUserRanking(targetUserId);

  // Find user in leaderboard
  const userInLeaderboard = leaderboard.find(
    entry => entry.profiles.user_id === targetUserId
  );

  const isUserInTopRanks = !!userInLeaderboard;
  const userPosition = userInLeaderboard 
    ? leaderboard.indexOf(userInLeaderboard) + 1 
    : ranking;

  return {
    leaderboard,
    userPosition,
    isUserInTopRanks,
    ranking,
    isLoading: leaderboardLoading || rankingLoading
  };
};
