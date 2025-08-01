import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SystemStats {
  activePlayers: number;
  totalMatches: number;
  totalClubs: number;
  avgTrustScore: number;
  loading: boolean;
  error: string | null;
}

export const useSystemStats = () => {
  const [stats, setStats] = useState<SystemStats>({
    activePlayers: 0,
    totalMatches: 0,
    totalClubs: 0,
    avgTrustScore: 0,
    loading: true,
    error: null,
  });

  const fetchSystemStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Get active players count from player_rankings
      const { count: activePlayersCount } = await supabase
        .from('player_rankings')
        .select('*', { count: 'exact', head: true })
        .gt('total_matches', 0);

      // Get total matches this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: totalMatchesCount } = await supabase
        .from('tournament_matches')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())
        .eq('status', 'completed');

      // Get total clubs
      const { count: totalClubsCount } = await supabase
        .from('club_profiles')
        .select('*', { count: 'exact', head: true });

      // Get average trust score from player_rankings
      const { data: trustScores } = await supabase
        .from('player_rankings')
        .select('spa_points');

      const avgTrustScore =
        trustScores && trustScores.length > 0
          ? trustScores.reduce(
              (sum, score) => sum + (score.spa_points || 0),
              0
            ) / trustScores.length
          : 0;

      setStats({
        activePlayers: activePlayersCount || 0,
        totalMatches: totalMatchesCount || 0,
        totalClubs: totalClubsCount || 0,
        avgTrustScore,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch system stats',
      }));
    }
  };

  useEffect(() => {
    fetchSystemStats();
  }, []);

  return { ...stats, refetch: fetchSystemStats };
};
