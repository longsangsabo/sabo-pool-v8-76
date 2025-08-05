import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfileCache } from './useProfileCache';

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round_number: number;
  match_number: number;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  status: string;
  score_player1: number | null;
  score_player2: number | null;
  bracket_type: string | null;
  branch_type: string | null;
  scheduled_time: string | null;
  is_third_place_match: boolean;
  score_status?: string;
  score_input_by?: string;
  score_submitted_at?: string;
  actual_end_time?: string;
  match_stage?: string;
  loser_branch?: string;
  round_position?: number;
  player1?: {
    user_id: string;
    full_name: string;
    display_name: string;
    avatar_url: string | null;
    verified_rank: string | null;
  } | null;
  player2?: {
    user_id: string;
    full_name: string;
    display_name: string;
    avatar_url: string | null;
    verified_rank: string | null;
  } | null;
}

export const useTournamentMatches = (tournamentId: string | null) => {
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const { getMultipleProfiles } = useProfileCache();

  const fetchMatches = useCallback(async () => {
    if (!tournamentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🎯 Fetching matches for tournament:', tournamentId);

      // Fetch matches with enhanced schema
      const { data: matchesData, error: matchesError } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('match_stage', { ascending: true })
        .order('bracket_type', { ascending: true })
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true });

      if (matchesError) {
        console.error('❌ Error fetching matches:', matchesError);
        throw matchesError;
      }

      console.log('✅ Fetched matches:', matchesData?.length || 0);

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

      // Map matches with cached profiles
      const matchesWithProfiles = (matchesData || []).map(match => ({
        ...match,
        player1: match.player1_id ? profileMap[match.player1_id] || null : null,
        player2: match.player2_id ? profileMap[match.player2_id] || null : null,
      }));

      console.log(
        '✅ Matches with cached profiles:',
        matchesWithProfiles.length
      );
      setMatches(matchesWithProfiles);
      setLastUpdateTime(new Date());
    } catch (err: any) {
      console.error('❌ Error in fetchMatches:', err);
      setError(err.message || 'Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  }, [tournamentId, getMultipleProfiles]);

  // Optimized real-time subscription with debouncing
  useEffect(() => {
    if (!tournamentId) return;

    console.log(
      '🔄 Setting up optimized real-time subscription for tournament:',
      tournamentId
    );

    let debounceTimer: NodeJS.Timeout;
    const updateQueue = new Set<string>();

    const debouncedRefetch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (updateQueue.size > 0) {
          console.log('🔄 Processing queued updates:', updateQueue.size);
          updateQueue.clear();
          fetchMatches();
        }
      }, 800); // Increased debounce time
    };

    const channel = supabase
      .channel(`tournament-matches-optimized-${tournamentId}`)
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
            '🔄 Tournament match real-time update:',
            payload.eventType,
            payload.new
          );

          // Queue the update and debounce
          if (payload.new && 'id' in payload.new) {
            updateQueue.add(payload.new.id as string);
          }

          // Immediate UI update for critical changes
          if (
            payload.eventType === 'UPDATE' &&
            payload.new &&
            'id' in payload.new
          ) {
            setMatches(currentMatches => {
              const updatedMatches = [...currentMatches];
              const matchIndex = updatedMatches.findIndex(
                m => m.id === payload.new.id
              );

              if (matchIndex >= 0) {
                updatedMatches[matchIndex] = {
                  ...updatedMatches[matchIndex],
                  ...payload.new,
                };
              }

              return updatedMatches;
            });
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
            '🤖 Automation event:',
            logData.automation_type,
            logData.status
          );

          if (
            logData.automation_type === 'auto_winner_advancement' &&
            logData.status === 'completed'
          ) {
            // Immediate refresh for successful automation
            setTimeout(() => fetchMatches(), 200);
          }

          // Trigger refresh for semifinals completion
          if (
            logData.automation_type === 'semifinal_advancement' &&
            logData.status === 'completed'
          ) {
            setTimeout(() => fetchMatches(), 300);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up optimized real-time subscription');
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [tournamentId, fetchMatches]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return {
    matches,
    loading,
    error,
    lastUpdateTime,
    refetch: fetchMatches,
  };
};
