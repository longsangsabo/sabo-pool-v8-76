import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TournamentMatch } from './useTournamentMatches';
import { useOptimisticTournamentUpdates } from './useOptimisticTournamentUpdates';

export const useEnhancedTournamentMatches = (tournamentId: string | null) => {
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  const optimistic = useOptimisticTournamentUpdates();
  const debounceRef = useRef<NodeJS.Timeout>();
  const lastFetchRef = useRef<number>(0);

  const fetchMatches = useCallback(
    async (skipDelay = false) => {
      if (!tournamentId) {
        setLoading(false);
        return;
      }

      // Debounce rapid requests
      const now = Date.now();
      if (!skipDelay && now - lastFetchRef.current < 500) {
        return;
      }
      lastFetchRef.current = now;

      try {
        setError(null);
        if (skipDelay) setLoading(true);

        console.log(
          '🔄 Fetching enhanced matches for tournament:',
          tournamentId
        );

        const { data: matchesData, error: matchesError } = await supabase
          .from('tournament_matches')
          .select('*')
          .eq('tournament_id', tournamentId)
          .order('bracket_type', { ascending: true })
          .order('round_number', { ascending: true })
          .order('match_number', { ascending: true });

        if (matchesError) throw matchesError;

        // Fetch player profiles in parallel
        const matchesWithProfiles = await Promise.all(
          (matchesData || []).map(async match => {
            const [player1Profile, player2Profile] = await Promise.all([
              match.player1_id
                ? supabase
                    .from('profiles')
                    .select(
                      'user_id, full_name, display_name, avatar_url, verified_rank'
                    )
                    .eq('user_id', match.player1_id)
                    .single()
                : { data: null },
              match.player2_id
                ? supabase
                    .from('profiles')
                    .select(
                      'user_id, full_name, display_name, avatar_url, verified_rank'
                    )
                    .eq('user_id', match.player2_id)
                    .single()
                : { data: null },
            ]);

            return {
              ...match,
              player1: player1Profile.data,
              player2: player2Profile.data,
            };
          })
        );

        setMatches(matchesWithProfiles);
        setLastUpdateTime(new Date());
        console.log('✅ Enhanced matches loaded:', matchesWithProfiles.length);
      } catch (err: any) {
        console.error('❌ Error in enhanced fetchMatches:', err);
        setError(err.message || 'Failed to fetch matches');
      } finally {
        setLoading(false);
      }
    },
    [tournamentId]
  );

  // Enhanced real-time subscription with multiple event types
  useEffect(() => {
    if (!tournamentId) return;

    console.log(
      '🔄 Setting up enhanced real-time subscription for:',
      tournamentId
    );

    const channel = supabase
      .channel(`enhanced-tournament-matches-${tournamentId}`)

      // Listen to match updates
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_matches',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        payload => {
          console.log('🔄 Enhanced match update:', payload);

          // Instant UI update for better UX
          if (payload.eventType === 'UPDATE' && payload.new) {
            setMatches(currentMatches => {
              const updatedMatches = [...currentMatches];
              const matchIndex = updatedMatches.findIndex(
                m => m.id === payload.new.id
              );

              if (matchIndex >= 0) {
                // Preserve profiles while updating match data
                updatedMatches[matchIndex] = {
                  ...updatedMatches[matchIndex],
                  ...payload.new,
                };

                // Check if this confirms an optimistic update
                const optimisticUpdate = optimistic.getOptimisticMatch(
                  payload.new.id
                );
                if (optimisticUpdate && payload.new.winner_id) {
                  optimistic.confirmOptimisticUpdate(payload.new.id);
                }
              }

              return updatedMatches;
            });
          }

          // Debounced full refresh for accuracy
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            fetchMatches();
          }, 1000);
        }
      )

      // Listen to automation log for advancement feedback
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tournament_automation_log',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        payload => {
          const logData = payload.new as any;
          console.log('🤖 Automation log update:', logData);

          if (
            logData.action_type === 'auto_winner_advancement' &&
            logData.status === 'completed'
          ) {
            // Automation completed successfully
            setLastUpdateTime(new Date());

            // Trigger immediate refresh
            setTimeout(() => fetchMatches(true), 500);
          }
        }
      )

      .subscribe(status => {
        console.log(`🔗 Enhanced subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Enhanced real-time connected');
        }
      });

    return () => {
      console.log('🔌 Cleaning up enhanced subscription');
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [tournamentId, optimistic, fetchMatches]);

  // Initial fetch
  useEffect(() => {
    fetchMatches(true);
  }, [fetchMatches]);

  // Apply optimistic updates to matches
  const getEnhancedMatches = useCallback(() => {
    return matches.map(match => {
      const optimisticUpdate = optimistic.getOptimisticMatch(match.id);
      if (optimisticUpdate) {
        return {
          ...match,
          winner_id: optimisticUpdate.winnerId,
          score_player1: optimisticUpdate.score1,
          score_player2: optimisticUpdate.score2,
          status: 'completed',
          // Add visual indicator for pending advancement
          _isPendingAdvancement: optimistic.isPendingAdvancement(match.id),
        };
      }
      return match;
    });
  }, [matches, optimistic]);

  return {
    matches: getEnhancedMatches(),
    loading,
    error,
    lastUpdateTime,
    refetch: () => fetchMatches(true),
    optimistic,
    pendingAdvancements: optimistic.pendingCount,
  };
};
