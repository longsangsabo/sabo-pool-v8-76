import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TournamentStats, Tournament } from '../types/tournament.types';
import { toast } from 'sonner';

export const useTournamentStats = (tournamentId: string) => {
  const [stats, setStats] = useState<TournamentStats>({
    totalParticipants: 0,
    registeredParticipants: 0,
    completedMatches: 0,
    upcomingMatches: 0,
    averageMatchDuration: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    if (!tournamentId) return;

    try {
      setLoading(true);
      setError(null);

      // Get participant counts
      const { count: totalCount } = await supabase
        .from('tournament_registrations')
        .select('*', { count: 'exact' })
        .eq('tournament_id', tournamentId);

      const { count: registeredCount } = await supabase
        .from('tournament_registrations')
        .select('*', { count: 'exact' })
        .eq('tournament_id', tournamentId)
        .eq('status', 'registered');

      // Get match statistics
      const { data: matches } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', tournamentId);

      const completedMatches = matches?.filter(m => m.status === 'completed') || [];
      const upcomingMatches = matches?.filter(m => m.status === 'pending') || [];

      // Calculate average match duration
      const avgDuration = completedMatches.reduce((acc, match) => {
        if (match.actual_start_time && match.actual_end_time) {
          const duration = new Date(match.actual_end_time).getTime() - 
                         new Date(match.actual_start_time).getTime();
          return acc + duration;
        }
        return acc;
      }, 0) / (completedMatches.length || 1);

      setStats({
        totalParticipants: totalCount || 0,
        registeredParticipants: registeredCount || 0,
        completedMatches: completedMatches.length,
        upcomingMatches: upcomingMatches.length,
        averageMatchDuration: avgDuration / (1000 * 60) // Convert to minutes
      });

    } catch (err) {
      setError(err as Error);
      console.error('Error fetching tournament stats:', err);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  return { stats, loading, error, fetchStats };
};
