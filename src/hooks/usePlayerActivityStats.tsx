import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PlayerActivityStats {
  pending_challenges: number;
  matches_this_week: number;
  upcoming_tournaments: number;
}

export const usePlayerActivityStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['player-activity-stats', user?.id],
    queryFn: async (): Promise<PlayerActivityStats> => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await (supabase as any).rpc(
        'get_player_activity_stats',
        {
          p_user_id: user.id,
        }
      );

      if (error) {
        console.error('Activity stats error:', error);
        throw error;
      }

      return data as unknown as PlayerActivityStats;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};
