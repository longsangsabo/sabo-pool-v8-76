import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TournamentResultWithPlayer } from '@/types/tournamentResults';

export const useTournamentResults = (tournamentId?: string) => {
  const [results, setResults] = useState<TournamentResultWithPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async () => {
    if (!tournamentId) {
      setResults([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🏆 Fetching tournament results for:', tournamentId);

      const { data, error: fetchError } = await supabase
        .from('tournament_results')
        .select(
          `
          *,
          profiles!tournament_results_user_id_fkey (
            user_id,
            full_name,
            display_name,
            avatar_url,
            verified_rank
          )
        `
        )
        .eq('tournament_id', tournamentId)
        .order('final_position', { ascending: true });

      if (fetchError) {
        console.error('❌ Error fetching tournament results:', fetchError);
        throw fetchError;
      }

      console.log('✅ Tournament results fetched:', data?.length || 0);

      // Transform data to match TournamentResultWithPlayer interface
      const transformedResults: TournamentResultWithPlayer[] = (data || []).map(
        result => ({
          user_id: result.user_id,
          full_name: result.profiles?.full_name || 'Unknown Player',
          display_name:
            result.profiles?.display_name ||
            result.profiles?.full_name ||
            'Unknown Player',
          avatar_url: result.profiles?.avatar_url || '',
          verified_rank: result.profiles?.verified_rank || 'Unranked',
          final_position: result.final_position || 0,
          total_matches: result.matches_played || 0,
          wins: result.matches_won || 0,
          losses: result.matches_lost || 0,
          win_percentage: Number(result.win_percentage) || 0,
          spa_points_earned: result.spa_points_earned || 0,
          elo_points_awarded: result.elo_points_earned || 0,
          prize_amount: result.prize_amount || 0,
          physical_rewards: Array.isArray(result.physical_rewards)
            ? (result.physical_rewards as string[])
            : [],
          placement_type: result.placement_type || '',
          id: result.id,
        })
      );

      setResults(transformedResults);
    } catch (err: any) {
      console.error('❌ Error in fetchResults:', err);
      setError(err.message || 'Failed to fetch tournament results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [tournamentId]);

  // Set up real-time subscription for tournament results
  useEffect(() => {
    if (!tournamentId) return;

    console.log(
      '🔄 Setting up real-time subscription for tournament results:',
      tournamentId
    );

    const channel = supabase
      .channel(`tournament-results-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_results',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        payload => {
          console.log('🔄 Tournament results real-time update:', payload);

          // Immediately refetch results to ensure accuracy
          fetchResults();
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up tournament results real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  return {
    results,
    loading,
    error,
    refetch: fetchResults,
  };
};
