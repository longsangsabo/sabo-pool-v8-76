import { useState, useEffect } from 'react';
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

export const useRealMatches = () => {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveMatches = async () => {
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
          challenges!inner(race_to, bet_points)
        `
        )
        .eq('status', 'ongoing')
        .order('actual_start_time', { ascending: false });

      if (error) throw error;

      // Get unique player IDs to fetch profiles
      const playerIds = new Set<string>();
      (data || []).forEach(match => {
        if (match.player1_id) playerIds.add(match.player1_id);
        if (match.player2_id) playerIds.add(match.player2_id);
      });

      // Fetch profiles
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

      const formatted = (data || []).map(match => ({
        id: match.id,
        player1: {
          name: profileMap[match.player1_id]?.full_name || 'Unknown',
          avatar: profileMap[match.player1_id]?.avatar_url || '',
          rank: profileMap[match.player1_id]?.verified_rank || 'Unranked',
        },
        player2: {
          name: profileMap[match.player2_id]?.full_name || 'Unknown',
          avatar: profileMap[match.player2_id]?.avatar_url || '',
          rank: profileMap[match.player2_id]?.verified_rank || 'Unranked',
        },
        score: {
          player1: match.score_player1 || 0,
          player2: match.score_player2 || 0,
        },
        raceToTarget: match.challenges?.race_to || 16,
        location: 'CLB Online',
        startTime: match.actual_start_time || new Date().toISOString(),
        betPoints: match.challenges?.bet_points || 0,
      }));

      setLiveMatches(formatted);
    } catch (error) {
      console.error('Error fetching live matches:', error);
      setLiveMatches([]);
    }
  };

  const fetchUpcomingMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(
          `
          id,
          player1_id,
          player2_id,
          scheduled_time,
          challenges!inner(race_to, bet_points)
        `
        )
        .eq('status', 'scheduled')
        .gte('scheduled_time', new Date().toISOString())
        .order('scheduled_time', { ascending: true })
        .limit(10);

      if (error) throw error;

      // Get unique player IDs to fetch profiles
      const playerIds = new Set<string>();
      (data || []).forEach(match => {
        if (match.player1_id) playerIds.add(match.player1_id);
        if (match.player2_id) playerIds.add(match.player2_id);
      });

      // Fetch profiles
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

      const formatted = (data || []).map(match => ({
        id: match.id,
        player1: {
          name: profileMap[match.player1_id]?.full_name || 'Unknown',
          avatar: profileMap[match.player1_id]?.avatar_url || '',
          rank: profileMap[match.player1_id]?.verified_rank || 'Unranked',
        },
        player2: {
          name: profileMap[match.player2_id]?.full_name || 'Unknown',
          avatar: profileMap[match.player2_id]?.avatar_url || '',
          rank: profileMap[match.player2_id]?.verified_rank || 'Unranked',
        },
        scheduledTime: match.scheduled_time || new Date().toISOString(),
        raceToTarget: match.challenges?.race_to || 16,
        location: 'CLB Online',
        betPoints: match.challenges?.bet_points || 0,
      }));

      setUpcomingMatches(formatted);
    } catch (error) {
      console.error('Error fetching upcoming matches:', error);
      setUpcomingMatches([]);
    }
  };

  const fetchRecentResults = async () => {
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
          actual_start_time,
          challenges!inner(race_to, bet_points)
        `
        )
        .eq('status', 'completed')
        .not('actual_end_time', 'is', null)
        .order('actual_end_time', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get unique player IDs to fetch profiles
      const playerIds = new Set<string>();
      (data || []).forEach(match => {
        if (match.player1_id) playerIds.add(match.player1_id);
        if (match.player2_id) playerIds.add(match.player2_id);
      });

      // Fetch profiles and match results
      const [profilesRes, matchResultsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, verified_rank')
          .in('user_id', Array.from(playerIds)),
        supabase
          .from('match_results')
          .select('match_id, player_id, elo_change')
          .in(
            'match_id',
            (data || []).map(m => m.id)
          ),
      ]);

      const profileMap = (profilesRes.data || []).reduce(
        (acc, profile) => {
          acc[profile.user_id] = profile;
          return acc;
        },
        {} as Record<string, any>
      );

      const matchResultsMap = (matchResultsRes.data || []).reduce(
        (acc, result) => {
          if (!acc[result.match_id]) acc[result.match_id] = {};
          acc[result.match_id][result.player_id] = result;
          return acc;
        },
        {} as Record<string, Record<string, any>>
      );

      const formatted = (data || []).map(match => {
        const duration = calculateDuration(
          match.actual_start_time,
          match.actual_end_time
        );
        const winner: 'player1' | 'player2' =
          match.winner_id === match.player1_id ? 'player1' : 'player2';

        // Get ELO changes
        const player1EloChange =
          matchResultsMap[match.id]?.[match.player1_id]?.elo_change || 0;
        const player2EloChange =
          matchResultsMap[match.id]?.[match.player2_id]?.elo_change || 0;

        return {
          id: match.id,
          player1: {
            name: profileMap[match.player1_id]?.full_name || 'Unknown',
            avatar: profileMap[match.player1_id]?.avatar_url || '',
            rank: profileMap[match.player1_id]?.verified_rank || 'Unranked',
          },
          player2: {
            name: profileMap[match.player2_id]?.full_name || 'Unknown',
            avatar: profileMap[match.player2_id]?.avatar_url || '',
            rank: profileMap[match.player2_id]?.verified_rank || 'Unranked',
          },
          finalScore: {
            player1: match.score_player1 || 0,
            player2: match.score_player2 || 0,
          },
          winner,
          raceToTarget: match.challenges?.race_to || 16,
          completedAt: match.actual_end_time || new Date().toISOString(),
          duration,
          location: 'CLB Online',
          betPoints: match.challenges?.bet_points || 0,
          eloChanges: {
            player1: player1EloChange,
            player2: player2EloChange,
          },
        };
      });

      setRecentResults(formatted);
    } catch (error) {
      console.error('Error fetching recent results:', error);
      setRecentResults([]);
    }
  };

  const calculateDuration = (
    start: string | null,
    end: string | null
  ): string => {
    if (!start || !end) return '0m';

    const startTime = new Date(start);
    const endTime = new Date(end);
    const diff = endTime.getTime() - startTime.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchLiveMatches(),
      fetchUpcomingMatches(),
      fetchRecentResults(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();

    // Set up real-time subscriptions
    const liveSubscription = supabase
      .channel('live-matches')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: 'status=eq.ongoing',
        },
        () => {
          fetchLiveMatches();
        }
      )
      .subscribe();

    const upcomingSubscription = supabase
      .channel('upcoming-matches')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: 'status=eq.scheduled',
        },
        () => {
          fetchUpcomingMatches();
        }
      )
      .subscribe();

    const recentSubscription = supabase
      .channel('recent-matches')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: 'status=eq.completed',
        },
        () => {
          fetchRecentResults();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(liveSubscription);
      supabase.removeChannel(upcomingSubscription);
      supabase.removeChannel(recentSubscription);
    };
  }, []);

  return {
    liveMatches,
    upcomingMatches,
    recentResults,
    loading,
    refreshAll,
  };
};
