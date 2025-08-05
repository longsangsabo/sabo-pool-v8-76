import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SocialFeedPost {
  id: string;
  type: 'match_result' | 'achievement' | 'challenge' | 'tournament_update';
  user: {
    id: string;
    name: string;
    avatar: string;
    rank: string;
  };
  content: string;
  timestamp: string;
  stats?: {
    likes: number;
    comments: number;
    shares: number;
    score?: string;
    opponent?: string;
    achievement?: string;
    challenge_type?: string;
    tournament_name?: string;
  };
  isLiked?: boolean;
  raw_data?: any;
}

export interface SocialStoryItem {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  type: 'live_match' | 'achievement' | 'highlight' | 'tournament';
  thumbnail?: string;
  isLive?: boolean;
  title: string;
}

export const useSocialFeed = () => {
  const [feedPosts, setFeedPosts] = useState<SocialFeedPost[]>([]);
  const [stories, setStories] = useState<SocialStoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transform match data to feed post
  const transformMatchToPost = (match: any): SocialFeedPost => {
    const winner =
      match.winner_id === match.player1_id
        ? {
            id: match.player1_id,
            name:
              match.player1?.full_name ||
              match.player1?.display_name ||
              'Player 1',
          }
        : {
            id: match.player2_id,
            name:
              match.player2?.full_name ||
              match.player2?.display_name ||
              'Player 2',
          };

    const loser =
      match.winner_id === match.player1_id
        ? {
            id: match.player2_id,
            name:
              match.player2?.full_name ||
              match.player2?.display_name ||
              'Player 2',
          }
        : {
            id: match.player1_id,
            name:
              match.player1?.full_name ||
              match.player1?.display_name ||
              'Player 1',
          };

    return {
      id: `match_${match.id}`,
      type: 'match_result',
      user: {
        id: winner.id,
        name: winner.name,
        avatar: '/api/placeholder/40/40',
        rank: 'Expert',
      },
      content: `Vừa thắng ${loser.name} với tỷ số ${match.score_player1 || 0}-${match.score_player2 || 0}! 🎱`,
      timestamp:
        new Date(match.created_at).toLocaleDateString('vi-VN') +
        ' ' +
        new Date(match.created_at).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      stats: {
        likes: Math.floor(Math.random() * 20) + 5,
        comments: Math.floor(Math.random() * 10) + 1,
        shares: Math.floor(Math.random() * 5) + 1,
        score: `${match.score_player1 || 0}-${match.score_player2 || 0}`,
        opponent: loser.name,
      },
      isLiked: Math.random() > 0.7,
      raw_data: match,
    };
  };

  // Transform challenge data to feed post
  const transformChallengeToPost = (challenge: any): SocialFeedPost => {
    const challenger = challenge.challenger || {
      full_name: 'Unknown Player',
      display_name: 'Unknown',
    };

    return {
      id: `challenge_${challenge.id}`,
      type: 'challenge',
      user: {
        id: challenge.challenger_id,
        name:
          challenger.full_name || challenger.display_name || 'Unknown Player',
        avatar: '/api/placeholder/40/40',
        rank: 'Pro',
      },
      content: `Ai dám nhận thách đấu với tôi không? Đặt cược ${challenge.bet_points || 100} điểm! 🔥`,
      timestamp:
        new Date(challenge.created_at).toLocaleDateString('vi-VN') +
        ' ' +
        new Date(challenge.created_at).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      stats: {
        likes: Math.floor(Math.random() * 15) + 3,
        comments: Math.floor(Math.random() * 8) + 1,
        shares: Math.floor(Math.random() * 3) + 1,
        challenge_type: `Race to ${challenge.race_to || 5}`,
      },
      isLiked: Math.random() > 0.8,
      raw_data: challenge,
    };
  };

  // Transform tournament data to feed post
  const transformTournamentToPost = (tournament: any): SocialFeedPost => {
    return {
      id: `tournament_${tournament.id}`,
      type: 'tournament_update',
      user: {
        id: 'system',
        name: 'SABO Arena',
        avatar: '/api/placeholder/40/40',
        rank: 'System',
      },
      content: `${tournament.name} đang mở đăng ký! Phí tham gia ${tournament.entry_fee || 50000}đ. Hãy đăng ký ngay để nhận vị trí tốt nhất! 🎯`,
      timestamp:
        new Date(tournament.created_at).toLocaleDateString('vi-VN') +
        ' ' +
        new Date(tournament.created_at).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      stats: {
        likes: Math.floor(Math.random() * 30) + 10,
        comments: Math.floor(Math.random() * 15) + 5,
        shares: Math.floor(Math.random() * 8) + 2,
        tournament_name: tournament.name,
      },
      isLiked: Math.random() > 0.6,
      raw_data: tournament,
    };
  };

  // Transform tournament to story
  const transformTournamentToStory = (tournament: any): SocialStoryItem => {
    return {
      id: `story_tournament_${tournament.id}`,
      user: {
        name: 'SABO',
        avatar: '/api/placeholder/64/64',
      },
      type: 'tournament',
      title: tournament.name?.substring(0, 15) + '...' || 'Tournament',
      isLive: tournament.status === 'ongoing',
    };
  };

  // Fetch social feed data
  const fetchFeedData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch recent completed matches
      const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select(
          `
          *,
          player1:profiles!matches_player1_id_fkey(full_name, display_name, avatar_url),
          player2:profiles!matches_player2_id_fkey(full_name, display_name, avatar_url)
        `
        )
        .eq('status', 'completed')
        .not('winner_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent challenges
      const { data: challenges, error: challengeError } = await supabase
        .from('challenges')
        .select(
          `
          *,
          challenger:profiles!challenger_id(full_name, display_name, avatar_url)
        `
        )
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch active tournaments
      const { data: tournaments, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .in('status', ['registration_open', 'ongoing'])
        .order('created_at', { ascending: false })
        .limit(3);

      if (matchError) console.error('Error fetching matches:', matchError);
      if (challengeError)
        console.error('Error fetching challenges:', challengeError);
      if (tournamentError)
        console.error('Error fetching tournaments:', tournamentError);

      // Transform and combine data
      const allPosts: SocialFeedPost[] = [];

      if (matches) {
        allPosts.push(...matches.map(transformMatchToPost));
      }

      if (challenges) {
        allPosts.push(...challenges.map(transformChallengeToPost));
      }

      if (tournaments) {
        allPosts.push(...tournaments.map(transformTournamentToPost));
      }

      // Sort by timestamp (most recent first)
      allPosts.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setFeedPosts(allPosts);

      // Create stories from tournaments
      const tournamentStories: SocialStoryItem[] = tournaments
        ? tournaments.map(transformTournamentToStory)
        : [];

      setStories(tournamentStories);
    } catch (err) {
      console.error('Error fetching social feed:', err);
      setError('Failed to load social feed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    // Initial fetch
    fetchFeedData();

    // Subscribe to matches updates
    const matchesChannel = supabase
      .channel('matches-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => fetchFeedData()
      )
      .subscribe();

    // Subscribe to challenges updates
    const challengesChannel = supabase
      .channel('challenges-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'challenges' },
        () => fetchFeedData()
      )
      .subscribe();

    // Subscribe to tournaments updates
    const tournamentsChannel = supabase
      .channel('tournaments-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tournaments' },
        () => fetchFeedData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(challengesChannel);
      supabase.removeChannel(tournamentsChannel);
    };
  }, [fetchFeedData]);

  // Social interaction handlers
  const handleLike = useCallback((postId: string) => {
    setFeedPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              stats: {
                ...post.stats!,
                likes: post.isLiked
                  ? post.stats!.likes - 1
                  : post.stats!.likes + 1,
              },
            }
          : post
      )
    );
  }, []);

  const refreshFeed = useCallback(() => {
    fetchFeedData();
  }, [fetchFeedData]);

  return {
    feedPosts,
    stories,
    loading,
    error,
    refreshFeed,
    handleLike,
    isConnected: true,
  };
};

export default useSocialFeed;
