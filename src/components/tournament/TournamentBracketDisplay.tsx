import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UserAvatar from '@/components/UserAvatar';
import { Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Match {
  id: string;
  round_number: number;
  match_number: number;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  score_player1?: number | null;
  score_player2?: number | null;
  status: string;
  is_third_place_match?: boolean;
  scheduled_time: string | null;
  player1?: {
    full_name: string;
    display_name: string;
    avatar_url?: string;
    verified_rank?: string;
  };
  player2?: {
    full_name: string;
    display_name: string;
    avatar_url?: string;
    verified_rank?: string;
  };
}

interface TournamentBracketDisplayProps {
  tournamentId: string;
  showScoreInput?: boolean;
  onMatchUpdate?: (matchId: string, score1: number, score2: number) => void;
}

export const TournamentBracketDisplay: React.FC<
  TournamentBracketDisplayProps
> = ({ tournamentId, showScoreInput = false, onMatchUpdate }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_matches')
        .select(
          `
          *,
          player1:profiles!tournament_matches_player1_id_fkey(full_name, display_name, avatar_url, verified_rank),
          player2:profiles!tournament_matches_player2_id_fkey(full_name, display_name, avatar_url, verified_rank)
        `
        )
        .eq('tournament_id', tournamentId)
        .order('round_number')
        .order('match_number');

      if (error) throw error;
      setMatches((data || []) as unknown as Match[]);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('tournament-matches')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_matches',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        () => {
          fetchMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  // Group matches by round
  const matchesByRound = matches.reduce(
    (acc, match) => {
      const key = match.is_third_place_match
        ? 'third_place'
        : match.round_number;
      if (!acc[key]) acc[key] = [];
      acc[key].push(match);
      return acc;
    },
    {} as Record<string | number, Match[]>
  );

  const rounds = Object.keys(matchesByRound)
    .filter(key => key !== 'third_place')
    .map(Number)
    .sort((a, b) => a - b);

  const getRoundTitle = (round: number, totalRounds: number) => {
    if (round === totalRounds) return 'CHUNG KẾT';
    if (round === totalRounds - 1) return 'BÁN KẾT';
    if (round === totalRounds - 2) return 'TỨ KẾT';
    if (round === 1) return 'VÒNG 1/8';
    return `VÒNG ${round}`;
  };

  const getMatchStatus = (match: Match) => {
    if (match.winner_id) return 'completed';
    if (match.status === 'in_progress') return 'in_progress';
    if (match.player1_id && match.player2_id) return 'scheduled';
    return 'pending';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className='bg-green-600 text-white'>Hoàn thành</Badge>;
      case 'in_progress':
        return <Badge className='bg-blue-600 text-white'>Đang đấu</Badge>;
      case 'scheduled':
        return <Badge variant='outline'>Đã xếp lịch</Badge>;
      default:
        return <Badge variant='secondary'>Chờ</Badge>;
    }
  };

  const MatchCard = ({ match }: { match: Match }) => {
    const status = getMatchStatus(match);
    const isCompleted = status === 'completed';

    return (
      <Card
        className={`
        transition-all duration-300 hover:shadow-md border-2
        ${
          isCompleted
            ? 'border-green-200 bg-green-50/50'
            : status === 'in_progress'
              ? 'border-blue-200 bg-blue-50/50'
              : 'border-gray-200'
        }
      `}
      >
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-sm font-medium'>
              Trận {match.match_number}
            </CardTitle>
            {getStatusBadge(status)}
          </div>
        </CardHeader>
        <CardContent className='space-y-3'>
          {/* Player 1 */}
          <div
            className={`
            flex items-center justify-between p-2 rounded-lg transition-all
            ${match.winner_id === match.player1_id ? 'bg-yellow-100 border-2 border-yellow-300' : 'bg-gray-50'}
          `}
          >
            <div className='flex items-center gap-2'>
              {match.winner_id === match.player1_id && (
                <Crown className='h-4 w-4 text-yellow-600' />
              )}
              <UserAvatar userId={match.player1_id} size='sm' compact />
              <div className='flex flex-col'>
                <span className='font-medium text-sm'>
                  {match.player1?.display_name ||
                    match.player1?.full_name ||
                    'TBD'}
                </span>
                {match.player1 && (
                  <span className='text-xs text-muted-foreground'>
                    Hạng: {match.player1.verified_rank || 'N/A'}
                  </span>
                )}
              </div>
            </div>
            {isCompleted && (
              <Badge variant='outline' className='font-bold text-lg'>
                {match.score_player1 || 0}
              </Badge>
            )}
          </div>

          {/* VS Divider */}
          <div className='text-center text-xs text-muted-foreground font-medium'>
            VS
          </div>

          {/* Player 2 */}
          <div
            className={`
            flex items-center justify-between p-2 rounded-lg transition-all
            ${match.winner_id === match.player2_id ? 'bg-yellow-100 border-2 border-yellow-300' : 'bg-gray-50'}
          `}
          >
            <div className='flex items-center gap-2'>
              {match.winner_id === match.player2_id && (
                <Crown className='h-4 w-4 text-yellow-600' />
              )}
              <UserAvatar userId={match.player2_id} size='sm' compact />
              <div className='flex flex-col'>
                <span className='font-medium text-sm'>
                  {match.player2?.display_name ||
                    match.player2?.full_name ||
                    'TBD'}
                </span>
                {match.player2 && (
                  <span className='text-xs text-muted-foreground'>
                    Hạng: {match.player2.verified_rank || 'N/A'}
                  </span>
                )}
              </div>
            </div>
            {isCompleted && (
              <Badge variant='outline' className='font-bold text-lg'>
                {match.score_player2 || 0}
              </Badge>
            )}
          </div>

          {/* Match Time */}
          {match.scheduled_time && (
            <div className='text-xs text-muted-foreground text-center pt-2 border-t'>
              {new Date(match.scheduled_time).toLocaleString('vi-VN')}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='text-center'>
        <h2 className='text-2xl font-bold mb-2'>🏆 SƠ ĐỒ GIẢI ĐẤU</h2>
        <p className='text-muted-foreground'>
          Theo dõi tiến trình các trận đấu trong giải
        </p>
      </div>

      {/* Tournament Bracket */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {rounds.map(round => (
          <div key={round} className='space-y-4'>
            <h3 className='text-lg font-bold text-center p-3 bg-primary text-primary-foreground rounded-lg'>
              {getRoundTitle(round, Math.max(...rounds))}
            </h3>
            <div className='space-y-4'>
              {matchesByRound[round]?.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Third Place Match */}
      {matchesByRound.third_place && (
        <div className='mt-8'>
          <h3 className='text-lg font-bold text-center p-3 bg-orange-500 text-white rounded-lg mb-4'>
            TRANH HẠNG 3
          </h3>
          <div className='flex justify-center'>
            <div className='w-full max-w-sm'>
              {matchesByRound.third_place.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
