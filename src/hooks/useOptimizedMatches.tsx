import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Player {
  name: string;
  avatar: string;
  rank: string;
}

export interface LiveMatch {
  id: string;
  player1: Player;
  player2: Player;
  score: { player1: number; player2: number };
  raceToTarget: number;
  location: string;
  startTime: string;
  betPoints: number;
}

export interface UpcomingMatch {
  id: string;
  player1: Player;
  player2: Player;
  scheduledTime: string;
  raceToTarget: number;
  location: string;
  betPoints: number;
}

export interface RecentResult {
  id: string;
  player1: Player;
  player2: Player;
  finalScore: { player1: number; player2: number };
  winner: 'player1' | 'player2';
  raceToTarget: number;
  completedAt: string;
  duration: string;
  location: string;
  betPoints: number;
  eloChanges: { player1: number; player2: number };
}

export const useOptimizedMatches = () => {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveMatches = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(
          `
          id,
          player1_id,
          player2_id,
          score_player1,
          score_player2,
          actual_start_time,
          bet_points:challenge_id,
          race_to:challenge_id
        `
        )
        .eq('status', 'ongoing')
        .order('actual_start_time', { ascending: false })
        .limit(5);

      if (error) {
        console.warn('Live matches query failed, using fallback:', error);
        setLiveMatches([]);
        return;
      }

      if (!data || data.length === 0) {
        setLiveMatches([]);
        return;
      }

      // Get unique player IDs
      const playerIds = new Set<string>();
      data.forEach(match => {
        if (match.player1_id) playerIds.add(match.player1_id);
        if (match.player2_id) playerIds.add(match.player2_id);
      });

      // Fetch profiles with fallback
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, verified_rank')
        .in('user_id', Array.from(playerIds));

      const profileMap = (profiles || []).reduce(
        (acc, profile) => {
          acc[profile.user_id] = profile;
          return acc;
        },
        {} as Record<string, any>
      );

      const formatted = data.map(match => ({
        id: match.id,
        player1: {
          name: profileMap[match.player1_id]?.full_name || 'Player 1',
          avatar: profileMap[match.player1_id]?.avatar_url || '',
          rank: profileMap[match.player1_id]?.verified_rank || 'K',
        },
        player2: {
          name: profileMap[match.player2_id]?.full_name || 'Player 2',
          avatar: profileMap[match.player2_id]?.avatar_url || '',
          rank: profileMap[match.player2_id]?.verified_rank || 'K',
        },
        score: {
          player1: match.score_player1 || 0,
          player2: match.score_player2 || 0,
        },
        raceToTarget: 16, // Default fallback
        location: 'CLB Online',
        startTime: match.actual_start_time || new Date().toISOString(),
        betPoints: 200, // Default fallback
      }));

      setLiveMatches(formatted);
    } catch (error) {
      console.error('Error fetching live matches:', error);
      setLiveMatches([]);
    }
  }, []);

  const fetchUpcomingMatches = useCallback(async () => {
    try {
      // Query both scheduled matches and accepted challenges that should become matches
      const [scheduledMatches, acceptedChallenges] = await Promise.all([
        supabase
          .from('matches')
          .select(
            `
            id,
            player1_id,
            player2_id,
            scheduled_time
          `
          )
          .eq('status', 'scheduled')
          .gte('scheduled_time', new Date().toISOString())
          .order('scheduled_time', { ascending: true })
          .limit(3),

        supabase
          .from('challenges')
          .select(
            `
            id,
            challenger_id,
            opponent_id,
            bet_points,
            race_to,
            responded_at,
            created_at
          `
          )
          .eq('status', 'accepted')
          .not('opponent_id', 'is', null)
          .order('responded_at', { ascending: false })
          .limit(3),
      ]);

      const matches = scheduledMatches.data || [];
      const challenges = acceptedChallenges.data || [];

      if (scheduledMatches.error) {
        console.warn('Scheduled matches query failed:', scheduledMatches.error);
      }
      if (acceptedChallenges.error) {
        console.warn(
          'Accepted challenges query failed:',
          acceptedChallenges.error
        );
      }

      // Combine matches and accepted challenges
      const combinedData = [
        ...matches,
        ...challenges.map(challenge => ({
          id: `challenge-${challenge.id}`,
          player1_id: challenge.challenger_id,
          player2_id: challenge.opponent_id,
          scheduled_time: challenge.responded_at || challenge.created_at,
          bet_points: challenge.bet_points,
          race_to: challenge.race_to,
        })),
      ];

      if (combinedData.length === 0) {
        setUpcomingMatches([]);
        return;
      }

      // Get unique player IDs
      const playerIds = new Set<string>();
      combinedData.forEach(item => {
        if (item.player1_id) playerIds.add(item.player1_id);
        if (item.player2_id) playerIds.add(item.player2_id);
      });

      // Fetch profiles with fallback
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, verified_rank')
        .in('user_id', Array.from(playerIds));

      const profileMap = (profiles || []).reduce(
        (acc, profile) => {
          acc[profile.user_id] = profile;
          return acc;
        },
        {} as Record<string, any>
      );

      const formatted = combinedData.map(item => ({
        id: item.id,
        player1: {
          name: profileMap[item.player1_id]?.full_name || 'Player 1',
          avatar: profileMap[item.player1_id]?.avatar_url || '',
          rank: profileMap[item.player1_id]?.verified_rank || 'K',
        },
        player2: {
          name: profileMap[item.player2_id]?.full_name || 'Player 2',
          avatar: profileMap[item.player2_id]?.avatar_url || '',
          rank: profileMap[item.player2_id]?.verified_rank || 'K',
        },
        scheduledTime: item.scheduled_time || new Date().toISOString(),
        raceToTarget: (item as any).race_to || 16,
        location: 'CLB Online',
        betPoints: (item as any).bet_points || 200,
      }));

      setUpcomingMatches(formatted);
    } catch (error) {
      console.error('Error fetching upcoming matches:', error);
      setUpcomingMatches([]);
    }
  }, []);

  const fetchRecentResults = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(
          `
          id,
          player1_id,
          player2_id,
          score_player1,
          score_player2,
          winner_id,
          actual_end_time,
          actual_start_time
        `
        )
        .eq('status', 'completed')
        .not('actual_end_time', 'is', null)
        .order('actual_end_time', { ascending: false })
        .limit(5);

      if (error) {
        console.warn('Recent results query failed, using fallback:', error);
        setRecentResults([]);
        return;
      }

      if (!data || data.length === 0) {
        setRecentResults([]);
        return;
      }

      // Get unique player IDs
      const playerIds = new Set<string>();
      data.forEach(match => {
        if (match.player1_id) playerIds.add(match.player1_id);
        if (match.player2_id) playerIds.add(match.player2_id);
      });

      // Fetch profiles with fallback, skip match results for now to avoid join issues
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, verified_rank')
        .in('user_id', Array.from(playerIds));

      const profileMap = (profiles || []).reduce(
        (acc, profile) => {
          acc[profile.user_id] = profile;
          return acc;
        },
        {} as Record<string, any>
      );

      const formatted = data.map(match => {
        const duration = calculateDuration(
          match.actual_start_time,
          match.actual_end_time
        );
        const winner: 'player1' | 'player2' =
          match.winner_id === match.player1_id ? 'player1' : 'player2';

        return {
          id: match.id,
          player1: {
            name: profileMap[match.player1_id]?.full_name || 'Player 1',
            avatar: profileMap[match.player1_id]?.avatar_url || '',
            rank: profileMap[match.player1_id]?.verified_rank || 'K',
          },
          player2: {
            name: profileMap[match.player2_id]?.full_name || 'Player 2',
            avatar: profileMap[match.player2_id]?.avatar_url || '',
            rank: profileMap[match.player2_id]?.verified_rank || 'K',
          },
          finalScore: {
            player1: match.score_player1 || 0,
            player2: match.score_player2 || 0,
          },
          winner,
          raceToTarget: 16,
          completedAt: match.actual_end_time || new Date().toISOString(),
          duration,
          location: 'CLB Online',
          betPoints: 200,
          eloChanges: {
            player1: 0, // Fallback values
            player2: 0,
          },
        };
      });

      setRecentResults(formatted);
    } catch (error) {
      console.error('Error fetching recent results:', error);
      setRecentResults([]);
    }
  }, []);

  const calculateDuration = (
    start: string | null,
    end: string | null
  ): string => {
    if (!start || !end) return '0m';

    try {
      const startTime = new Date(start);
      const endTime = new Date(end);
      const diff = endTime.getTime() - startTime.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    } catch {
      return '0m';
    }
  };

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchLiveMatches(),
        fetchUpcomingMatches(),
        fetchRecentResults(),
      ]);
    } catch (err) {
      console.error('Error refreshing matches:', err);
      setError('Failed to refresh match data');
    } finally {
      setLoading(false);
    }
  }, [fetchLiveMatches, fetchUpcomingMatches, fetchRecentResults]);

  // Real-time subscriptions for both matches and challenges
  useEffect(() => {
    refreshAll();

    const matchesSubscription = supabase
      .channel('optimized-matches')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
        },
        () => {
          setTimeout(refreshAll, 1000);
        }
      )
      .subscribe();

    const challengesSubscription = supabase
      .channel('optimized-challenges')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'challenges',
        },
        payload => {
          // Refresh when challenges are accepted
          if (payload.new && (payload.new as any).status === 'accepted') {
            setTimeout(refreshAll, 500);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchesSubscription);
      supabase.removeChannel(challengesSubscription);
    };
  }, [refreshAll]);

  return {
    liveMatches,
    upcomingMatches,
    recentResults,
    loading,
    error,
    refreshAll,
  };
};
