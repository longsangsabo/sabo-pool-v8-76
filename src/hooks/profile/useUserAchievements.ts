// Hook for user achievements system
// File: /src/hooks/profile/useUserAchievements.ts

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { profileAPI, type UserAchievement, type AchievementDefinition } from '@/services/api/profileAPI';

export const useUserAchievements = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const {
    data: achievements,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['user-achievements', targetUserId],
    queryFn: async (): Promise<UserAchievement[]> => {
      if (!targetUserId) {
        return [];
      }

      return await profileAPI.getUserAchievements(targetUserId);
    },
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  return {
    achievements: achievements || [],
    isLoading,
    error,
    refetch
  };
};

export const useAvailableAchievements = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const {
    data: availableAchievements,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['available-achievements', targetUserId],
    queryFn: async (): Promise<AchievementDefinition[]> => {
      if (!targetUserId) {
        return [];
      }

      return await profileAPI.getAvailableAchievements(targetUserId);
    },
    enabled: !!targetUserId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  return {
    availableAchievements: availableAchievements || [],
    isLoading,
    error,
    refetch
  };
};

// Combined hook for achievement overview
export const useAchievementOverview = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  const { achievements, isLoading: earnedLoading } = useUserAchievements(targetUserId);
  const { availableAchievements, isLoading: availableLoading } = useAvailableAchievements(targetUserId);

  // Calculate achievement statistics
  const stats = {
    total_earned: achievements.length,
    total_available: availableAchievements.length,
    total_achievements: achievements.length + availableAchievements.length,
    completion_percentage: achievements.length + availableAchievements.length > 0 
      ? Math.round((achievements.length / (achievements.length + availableAchievements.length)) * 100)
      : 0,
    total_spa_points_earned: achievements.reduce((sum, ach) => sum + ach.spa_points_earned, 0),
    categories: {
      match: achievements.filter(a => a.achievement_category === 'match').length,
      tournament: achievements.filter(a => a.achievement_category === 'tournament').length,
      social: achievements.filter(a => a.achievement_category === 'social').length,
      progression: achievements.filter(a => a.achievement_category === 'progression').length,
      special: achievements.filter(a => a.achievement_category === 'special').length,
    }
  };

  return {
    achievements,
    availableAchievements,
    stats,
    isLoading: earnedLoading || availableLoading
  };
};
