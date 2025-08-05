// Specialized hooks for profile features
// File: /src/hooks/profile/useProfileStatistics.ts

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { profileAPI, type ProfileStatistics } from '@/services/api/profileAPI';

export const useProfileStatistics = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const {
    data: statistics,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['profile-statistics', targetUserId],
    queryFn: async (): Promise<ProfileStatistics | null> => {
      if (!targetUserId) {
        throw new Error('No user ID provided');
      }

      return await profileAPI.getProfileStatistics(targetUserId);
    },
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const refreshStatistics = async () => {
    if (targetUserId) {
      await profileAPI.refreshProfileStatistics(targetUserId);
      return refetch();
    }
  };

  return {
    statistics,
    isLoading,
    error,
    refetch,
    refreshStatistics,
  };
};
