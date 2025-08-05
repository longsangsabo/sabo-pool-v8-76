import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PlayerDashboardStats {
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  win_percentage: number;
  tournaments_joined: number;
  current_ranking: number;
  spa_points: number;
  pending_challenges: number;
  matches_this_week: number;
  upcoming_tournaments: number;
}

export const usePlayerDashboard = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['player-dashboard', user?.id],
    queryFn: async (): Promise<PlayerDashboardStats> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      try {
        // Call the dashboard stats function
        const { data, error } = await (supabase as any).rpc(
          'calculate_player_dashboard_stats',
          {
            p_user_id: user.id,
          }
        );

        if (error) {
          console.error('Dashboard stats error:', error);
          throw error;
        }

        // Get additional activity stats
        const { data: activityData, error: activityError } = await (
          supabase as any
        ).rpc('get_player_activity_stats', {
          p_user_id: user.id,
        });

        if (activityError) {
          console.error('Activity stats error:', activityError);
          // Don't throw, just use default values for activity stats
        }

        const stats = data as any;
        const activityStats = activityData as any;

        return {
          matches_played: stats?.matches_played || 0,
          matches_won: stats?.matches_won || 0,
          matches_lost: stats?.matches_lost || 0,
          win_percentage: stats?.win_percentage || 0,
          tournaments_joined: stats?.tournaments_joined || 0,
          current_ranking: stats?.current_ranking || 1,
          spa_points: stats?.spa_points || 0,
          pending_challenges: activityStats?.pending_challenges || 0,
          matches_this_week: activityStats?.matches_this_week || 0,
          upcoming_tournaments: activityStats?.upcoming_tournaments || 0,
        };
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Return default values instead of throwing
        return {
          matches_played: 0,
          matches_won: 0,
          matches_lost: 0,
          win_percentage: 0,
          tournaments_joined: 0,
          current_ranking: 1,
          spa_points: 0,
          pending_challenges: 0,
          matches_this_week: 0,
          upcoming_tournaments: 0,
        };
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once to avoid too many failed attempts
  });
};
