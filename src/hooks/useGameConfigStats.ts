import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GameConfigStats {
  eloRules: number;
  ranks: number;
  spaRewards: number;
  tournamentRewards: number;
  activePlayers: number;
  totalMatches: number;
  tournamentResults: number;
  averageElo: number;
  recentChanges: any[];
}

interface Inconsistency {
  table: string;
  type: 'missing' | 'mismatch' | 'extra';
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export const useGameConfigStats = () => {
  const [stats, setStats] = useState<GameConfigStats | null>(null);
  const [inconsistencies, setInconsistencies] = useState<Inconsistency[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Use existing tables instead of non-existent ones
      const [{ count: ranksCount }, { count: tournamentsCount }] =
        await Promise.all([
          supabase.from('ranks').select('*', { count: 'exact', head: true }),
          supabase
            .from('tournaments')
            .select('*', { count: 'exact', head: true }),
        ]);

      // Fetch system metrics
      const { data: playerStats } = await supabase
        .from('profiles')
        .select('elo')
        .eq('role', 'player')
        .not('elo', 'is', null);

      const { count: matchesCount } = await supabase
        .from('tournament_matches')
        .select('*', { count: 'exact', head: true });

      const { count: tournamentResultsCount } = await supabase
        .from('tournament_results')
        .select('*', { count: 'exact', head: true });

      // Use mock data for recent changes since table doesn't exist
      const recentChanges = [];

      // Calculate average ELO
      const averageElo =
        playerStats && playerStats.length > 0
          ? Math.round(
              playerStats.reduce((sum, p) => sum + (p.elo || 1000), 0) /
                playerStats.length
            )
          : 1000;

      setStats({
        eloRules: 0,
        ranks: ranksCount || 0,
        spaRewards: 0,
        tournamentRewards: tournamentsCount || 0,
        activePlayers: playerStats?.length || 0,
        totalMatches: matchesCount || 0,
        tournamentResults: tournamentResultsCount || 0,
        averageElo,
        recentChanges: recentChanges || [],
      });

      // Check for inconsistencies (simplified version)
      const issues: Inconsistency[] = [];

      // Example: Check if we have expected number of ranks
      if ((ranksCount || 0) < 5) {
        issues.push({
          table: 'ranks',
          type: 'missing',
          description: `Expected at least 5 ranks, found ${ranksCount || 0}`,
          severity: 'high',
        });
      }

      setInconsistencies(issues);
    } catch (error) {
      console.error('Error fetching game config stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    inconsistencies,
    loading,
    refetch: fetchStats,
  };
};
