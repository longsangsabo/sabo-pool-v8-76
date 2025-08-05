import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfileCache } from '@/hooks/useProfileCache';
import type { SABOMatch } from '../SABOLogicCore';

export const useSABOTournamentMatches = (tournamentId: string) => {
  const [matches, setMatches] = useState<SABOMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const { getMultipleProfiles } = useProfileCache();

  const loadMatches = useCallback(async () => {
    if (!tournamentId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🎯 Fetching SABO matches for tournament:', tournamentId);

      // Fetch matches with SABO-specific schema - ONLY SABO rounds
      const { data: matchesData, error: matchesError } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .in('round_number', [1, 2, 3, 101, 102, 103, 201, 202, 250, 300]) // SABO rounds only
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true });

      if (matchesError) {
        console.error('❌ Error fetching SABO matches:', matchesError);
        throw matchesError;
      }

      console.log('✅ Fetched SABO matches:', matchesData?.length || 0);

      // Collect all unique user IDs
      const userIds = new Set<string>();
      matchesData?.forEach(match => {
        if (match.player1_id) userIds.add(match.player1_id);
        if (match.player2_id) userIds.add(match.player2_id);
      });

      // Fetch all profiles at once using cache
      const profiles = await getMultipleProfiles(Array.from(userIds));
      const profileMap = profiles.reduce(
        (acc, profile) => {
          acc[profile.user_id] = profile;
          return acc;
        },
        {} as Record<string, any>
      );

      // Map matches with cached profiles and convert to SABO format
      const matchesWithProfiles = (matchesData || []).map(match => ({
        id: match.id,
        tournament_id: match.tournament_id,
        round_number: match.round_number,
        match_number: match.match_number,
        player1_id: match.player1_id,
        player2_id: match.player2_id,
        winner_id: match.winner_id,
        status: match.status as 'pending' | 'ready' | 'completed',
        bracket_type: match.bracket_type as
          | 'winners'
          | 'losers'
          | 'semifinals'
          | 'finals',
        branch_type: match.branch_type as 'A' | 'B' | undefined,
        player1_score: match.score_player1, // Map database column to interface property
        player2_score: match.score_player2, // Map database column to interface property
        player1: match.player1_id ? profileMap[match.player1_id] || null : null,
        player2: match.player2_id ? profileMap[match.player2_id] || null : null,
      })) as SABOMatch[];

      console.log(
        '✅ SABO matches with cached profiles:',
        matchesWithProfiles.length
      );
      setMatches(matchesWithProfiles);
      setLastUpdateTime(new Date());
    } catch (err: any) {
      console.error('❌ Error in loadMatches:', err);
      setError(err.message || 'Failed to fetch SABO matches');
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId, getMultipleProfiles]);

  // Optimized real-time subscription for SABO tournaments
  useEffect(() => {
    if (!tournamentId) return;

    console.log(
      '🔄 Setting up SABO real-time subscription for tournament:',
      tournamentId
    );

    let debounceTimer: NodeJS.Timeout;
    const updateQueue = new Set<string>();

    const debouncedRefetch = (isUrgent = false) => {
      clearTimeout(debounceTimer);

      // ✅ CRITICAL FIX: Immediate refresh for urgent updates (score submissions)
      if (isUrgent) {
        console.log('🚀 URGENT: Immediate SABO refresh triggered');
        updateQueue.clear();
        loadMatches();
        return;
      }

      // Regular debounced refresh for less critical updates
      debounceTimer = setTimeout(() => {
        if (updateQueue.size > 0) {
          console.log('🔄 Processing SABO queued updates:', updateQueue.size);
          updateQueue.clear();
          loadMatches();
        }
      }, 300); // ✅ Reduced from 800ms to 300ms for faster UI response
    };

    const channel = supabase
      .channel(`sabo-tournament-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_matches',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        payload => {
          console.log(
            '🔄 SABO match real-time update:',
            payload.eventType,
            payload.new
          );

          // Only process updates for SABO rounds
          if (payload.new && 'round_number' in payload.new) {
            const roundNumber = payload.new.round_number as number;
            const isSABORound = [
              1, 2, 3, 101, 102, 103, 201, 202, 250, 300,
            ].includes(roundNumber);

            if (!isSABORound) {
              console.log('🚫 Ignoring non-SABO round update:', roundNumber);
              return;
            }
          }

          // ✅ CRITICAL: Check if this is a score submission (urgent update)
          const isScoreUpdate =
            payload.eventType === 'UPDATE' &&
            payload.new &&
            ('score_player1' in payload.new ||
              'score_player2' in payload.new ||
              'winner_id' in payload.new ||
              'status' in payload.new);

          if (isScoreUpdate) {
            console.log(
              '🚀 URGENT: Score/status update detected, immediate refresh!'
            );

            // ✅ IMMEDIATE UI UPDATE: Update state immediately for instant feedback
            if (payload.new && 'id' in payload.new) {
              setMatches(currentMatches => {
                const updatedMatches = [...currentMatches];
                const matchIndex = updatedMatches.findIndex(
                  m => m.id === payload.new.id
                );

                if (matchIndex >= 0) {
                  // Merge the new data with existing match data
                  updatedMatches[matchIndex] = {
                    ...updatedMatches[matchIndex],
                    status:
                      payload.new.status || updatedMatches[matchIndex].status,
                    player1_score:
                      payload.new.score_player1 !== undefined
                        ? payload.new.score_player1
                        : updatedMatches[matchIndex].player1_score,
                    player2_score:
                      payload.new.score_player2 !== undefined
                        ? payload.new.score_player2
                        : updatedMatches[matchIndex].player2_score,
                    winner_id:
                      payload.new.winner_id !== undefined
                        ? payload.new.winner_id
                        : updatedMatches[matchIndex].winner_id,
                  };

                  console.log(
                    '✅ Immediate UI update applied for match:',
                    payload.new.id
                  );
                }

                return updatedMatches;
              });
            }

            // Also trigger full refresh after a short delay to get any related updates
            setTimeout(() => {
              console.log(
                '🔄 Following up with full refresh after score update'
              );
              loadMatches();
            }, 500);
            return;
          }

          // Queue the update for less critical changes
          if (payload.new && 'id' in payload.new) {
            updateQueue.add(payload.new.id as string);
          }

          debouncedRefetch();
        }
      )
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
          console.log(
            '🤖 SABO automation event:',
            logData.automation_type,
            logData.status
          );

          if (
            logData.automation_type === 'sabo_advancement' &&
            logData.status === 'completed'
          ) {
            // Immediate refresh for successful SABO automation
            setTimeout(() => loadMatches(), 200);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up SABO real-time subscription');
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [tournamentId, loadMatches]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  return {
    data: matches,
    isLoading,
    error,
    lastUpdateTime,
    refresh: loadMatches,
  };
};
