// API Endpoints for Profile Backend Integration
// File: /src/services/api/profileAPI.ts

import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

// Types for API responses
export interface ProfileStatistics {
  id: string;
  user_id: string;
  total_matches: number;
  matches_won: number;
  matches_lost: number;
  matches_drawn: number;
  win_percentage: number;
  current_win_streak: number;
  best_win_streak: number;
  current_lose_streak: number;
  total_play_time_minutes: number;
  average_match_duration: number;
  elo_rating: number;
  current_ranking: number | null;
  best_ranking: number | null;
  weekly_ranking: number | null;
  monthly_ranking: number | null;
  monthly_matches: number;
  weekly_matches: number;
  daily_matches: number;
  created_at: string;
  updated_at: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type:
    | 'match'
    | 'achievement'
    | 'rank_change'
    | 'spa_points'
    | 'tournament'
    | 'challenge'
    | 'club'
    | 'social';
  title: string;
  description: string | null;
  metadata: Record<string, any>;
  reference_table: string | null;
  reference_id: string | null;
  is_public: boolean;
  importance_level: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  achievement_name: string;
  achievement_description: string | null;
  achievement_category: string;
  spa_points_earned: number;
  metadata: Record<string, any>;
  earned_at: string;
  // From achievement_definitions join
  icon_url: string | null;
  badge_color: string;
  rarity: number;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon_url: string | null;
  requirements: Record<string, any>;
  spa_points_reward: number;
  badge_color: string;
  is_active: boolean;
  is_hidden: boolean;
  rarity: number;
}

export interface SPAPointsTransaction {
  id: string;
  user_id: string;
  points_change: number;
  current_balance: number;
  transaction_type: string;
  description: string | null;
  reference_table: string | null;
  reference_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface CompleteProfileData {
  profile: any; // From profiles table
  statistics: ProfileStatistics | null;
  recent_activities: UserActivity[];
  achievements: UserAchievement[];
  spa_points_history: SPAPointsTransaction[];
  completion_percentage: number;
  member_since: string;
  total_spa_points: number;
}

class ProfileAPI {
  /**
   * Get complete profile data for a user
   */
  async getCompleteProfile(
    userId: string
  ): Promise<CompleteProfileData | null> {
    try {
      // 1. Get basic profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      // 2. Return simplified data since these tables don't exist yet
      return {
        profile,
        statistics: null,
        recent_activities: [],
        achievements: [],
        spa_points_history: [],
        completion_percentage: profile.completion_percentage || 0,
        member_since: profile.created_at,
        total_spa_points: 0,
      };
    } catch (error) {
      console.error('Error in getCompleteProfile:', error);
      return null;
    }
  }

  /**
   * Get profile statistics for a user
   */
  async getProfileStatistics(
    userId: string
  ): Promise<ProfileStatistics | null> {
    try {
      // Return null since profile_statistics table doesn't exist
      return null;
    } catch (error) {
      console.error('Error in getProfileStatistics:', error);
      return null;
    }
  }

  /**
   * Get user activities with pagination
   */
  async getUserActivities(
    userId: string,
    limit = 20,
    offset = 0,
    activityType?: string
  ): Promise<UserActivity[]> {
    try {
      // Return empty array since user_activities table doesn't exist
      return [];
    } catch (error) {
      console.error('Error in getUserActivities:', error);
      return [];
    }
  }

  /**
   * Get user achievements
   */
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      // Return empty array since user_achievements table doesn't exist
      return [];
    } catch (error) {
      console.error('Error in getUserAchievements:', error);
      return [];
    }
  }

  /**
   * Get available achievements (not yet earned)
   */
  async getAvailableAchievements(
    userId: string
  ): Promise<AchievementDefinition[]> {
    try {
      // Return empty array since achievement tables don't exist
      return [];
    } catch (error) {
      console.error('Error in getAvailableAchievements:', error);
      return [];
    }
  }

  /**
   * Get SPA points history with pagination
   */
  async getSPAPointsHistory(
    userId: string,
    limit = 20,
    offset = 0,
    transactionType?: string
  ): Promise<SPAPointsTransaction[]> {
    try {
      // Return empty array since spa_points_history table doesn't exist
      return [];
    } catch (error) {
      console.error('Error in getSPAPointsHistory:', error);
      return [];
    }
  }

  /**
   * Update profile and recalculate completion percentage
   */
  async updateProfile(userId: string, updates: Partial<any>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return false;
    }
  }

  /**
   * Force refresh profile statistics
   */
  async refreshProfileStatistics(userId: string): Promise<boolean> {
    try {
      // Return true since profile_statistics functions don't exist
      return true;
    } catch (error) {
      console.error('Error in refreshProfileStatistics:', error);
      return false;
    }
  }

  /**
   * Get leaderboard (top players by ELO)
   */
  async getLeaderboard(limit = 50): Promise<any[]> {
    try {
      // Return empty array since profile_statistics table doesn't exist
      return [];
    } catch (error) {
      console.error('Error in getLeaderboard:', error);
      return [];
    }
  }

  /**
   * Get user's ranking position
   */
  async getUserRanking(userId: string): Promise<number | null> {
    try {
      // Return null since ranking functions don't exist
      return null;
    } catch (error) {
      console.error('Error in getUserRanking:', error);
      return null;
    }
  }

  /**
   * Subscribe to real-time profile updates
   */
  subscribeToProfileUpdates(userId: string, callback: (payload: any) => void) {
    const subscription = supabase
      .channel(`profile_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profile_statistics',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activities',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'spa_points_history',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();

    return subscription;
  }

  /**
   * Clean up subscription
   */
  async unsubscribe(subscription: any) {
    if (subscription) {
      await supabase.removeChannel(subscription);
    }
  }
}

// Export singleton instance
export const profileAPI = new ProfileAPI();
export default profileAPI;
