// Hook for user activities feed
// File: /src/hooks/profile/useUserActivities.ts

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { profileAPI, type UserActivity } from '@/services/api/profileAPI';

export const useUserActivities = (
  userId?: string,
  activityType?: string,
  limit = 20
) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['user-activities', targetUserId, activityType, limit],
    queryFn: async ({ pageParam = 0 }) => {
      if (!targetUserId) {
        throw new Error('No user ID provided');
      }

      const activities = await profileAPI.getUserActivities(
        targetUserId,
        limit,
        pageParam * limit,
        activityType
      );

      return {
        activities,
        nextPage: activities.length === limit ? pageParam + 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!targetUserId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Flatten all pages into a single array
  const activities = data?.pages.flatMap(page => page.activities) || [];

  return {
    activities,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  };
};

// Simple hook for recent activities (non-paginated)
export const useRecentActivities = (userId?: string, limit = 10) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const {
    data: activities,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['recent-activities', targetUserId, limit],
    queryFn: async (): Promise<UserActivity[]> => {
      if (!targetUserId) {
        return [];
      }

      return await profileAPI.getUserActivities(targetUserId, limit);
    },
    enabled: !!targetUserId,
    staleTime: 1 * 60 * 1000, // 1 minute for recent activities
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    activities: activities || [],
    isLoading,
    error,
    refetch
  };
};
