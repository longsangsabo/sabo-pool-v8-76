import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Crown,
  Trophy,
  Users,
  GitBranch,
  Target,
  Settings,
} from 'lucide-react';
import { useTournamentMatches } from '@/hooks/useTournamentMatches';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DoubleBracketVisualizationProps {
  tournamentId: string;
  isClubOwner?: boolean;
  onScoreSubmit?: (
    matchId: string,
    player1Score: number,
    player2Score: number,
    winnerId: string
  ) => void;
}

interface MatchCardProps {
  match: any;
  isClubOwner?: boolean;
  onScoreSubmit?: (
    matchId: string,
    player1Score: number,
    player2Score: number,
    winnerId: string
  ) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  isClubOwner,
  onScoreSubmit,
}) => {
  const getPlayerName = (player: any) => {
    if (!player) return 'TBD';
    return player.display_name || player.full_name || 'Unknown Player';
  };

  const getMatchStatus = (match: any) => {
    if (match.status === 'completed') return 'completed';
    if (match.player1_id && match.player2_id) return 'ready';
    return 'pending';
  };

  const status = getMatchStatus(match);

  return (
    <Card
      className={`
      w-48 h-24 text-xs transition-colors duration-200
      ${
        status === 'completed'
          ? 'bg-green-50 border-green-200'
          : status === 'ready'
            ? 'bg-blue-50 border-blue-200'
            : 'bg-gray-50 border-gray-200'
      }
    `}
    >
      <CardContent className='p-2'>
        <div className='flex flex-col justify-between h-full'>
          <div className='flex justify-between items-center'>
            <span className='font-medium text-xs'>
              R{match.round_number}M{match.match_number}
            </span>
            <Badge
              variant={
                status === 'completed'
                  ? 'default'
                  : status === 'ready'
                    ? 'secondary'
                    : 'outline'
              }
              className='text-xs px-1 py-0'
            >
              {status === 'completed' ? '✓' : status === 'ready' ? '⏳' : '⏸️'}
            </Badge>
          </div>

          <div className='space-y-1'>
            <div
              className={`flex justify-between items-center p-1 rounded text-xs ${
                match.winner_id === match.player1_id ? 'bg-yellow-100' : ''
              }`}
            >
              <span className='truncate max-w-24'>
                {getPlayerName(match.player1)}
              </span>
              <span className='font-mono ml-2'>
                {match.score_player1 ?? '-'}
              </span>
            </div>

            <div
              className={`flex justify-between items-center p-1 rounded text-xs ${
                match.winner_id === match.player2_id ? 'bg-yellow-100' : ''
              }`}
            >
              <span className='truncate max-w-24'>
                {getPlayerName(match.player2)}
              </span>
              <span className='font-mono ml-2'>
                {match.score_player2 ?? '-'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const DoubleBracketVisualization: React.FC<
  DoubleBracketVisualizationProps
> = ({ tournamentId, isClubOwner = false, onScoreSubmit }) => {
  const { matches, loading, error } = useTournamentMatches(tournamentId);

  const handleManualAdvance = async () => {
    try {
      toast.loading('Đang tiến hành manual advance...');

      const { data, error } = await supabase.functions.invoke(
        'manual-tournament-advance',
        {
          body: { tournament_id: tournamentId },
        }
      );

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast.success(
          `Manual advance thành công! Đã cập nhật ${data.updated_matches} trận đấu`
        );
        // Refresh matches by reloading the page or refetching data
        window.location.reload();
      } else {
        toast.error(data?.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Manual advance error:', error);
      toast.error('Lỗi khi thực hiện manual advance');
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2'></div>
          <p className='text-sm text-muted-foreground'>
            Loading double elimination bracket...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center p-8'>
        <p className='text-destructive'>Error loading bracket: {error}</p>
      </div>
    );
  }

  // Group matches by bracket type
  const winnerMatches = matches.filter(m => m.bracket_type === 'winners');
  const loserMatches = matches.filter(m => m.bracket_type === 'losers');
  const grandFinalMatches = matches.filter(
    m => m.bracket_type === 'grand_final'
  );

  // Group by rounds
  const groupByRounds = (matches: any[]) => {
    const rounds: { [key: number]: any[] } = {};
    matches.forEach(match => {
      if (!rounds[match.round_number]) {
        rounds[match.round_number] = [];
      }
      rounds[match.round_number].push(match);
    });
    return rounds;
  };

  const winnerRounds = groupByRounds(winnerMatches);
  const loserRounds = groupByRounds(loserMatches);

  const renderRound = (
    roundMatches: any[],
    roundNumber: number,
    title: string
  ) => (
    <div key={roundNumber} className='flex flex-col items-center space-y-2'>
      <h4 className='text-sm font-medium text-center mb-2'>{title}</h4>
      <div className='space-y-2'>
        {roundMatches.map(match => (
          <MatchCard
            key={match.id}
            match={match}
            isClubOwner={isClubOwner}
            onScoreSubmit={onScoreSubmit}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='text-center'>
        <h2 className='text-2xl font-bold flex items-center justify-center gap-2 mb-2'>
          <GitBranch className='h-6 w-6 text-primary' />
          Double Elimination Bracket
        </h2>
        <p className='text-muted-foreground mb-4'>
          Players get a second chance in the Loser's Bracket
        </p>

        {/* Manual Advance Button */}
        {isClubOwner && (
          <div className='flex justify-center mb-4'>
            <Button
              onClick={handleManualAdvance}
              variant='outline'
              size='sm'
              className='flex items-center gap-2'
            >
              <Settings className='h-4 w-4' />
              Manual Advance Tournament
            </Button>
          </div>
        )}
      </div>

      {/* Winner's Bracket */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Crown className='h-5 w-5 text-yellow-500' />
            Winner's Bracket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex gap-6 overflow-x-auto pb-4'>
            {Object.entries(winnerRounds)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([roundNum, roundMatches]) =>
                renderRound(roundMatches, Number(roundNum), `Round ${roundNum}`)
              )}
          </div>
        </CardContent>
      </Card>

      {/* Loser's Bracket */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Target className='h-5 w-5 text-orange-500' />
            Loser's Bracket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex gap-6 overflow-x-auto pb-4'>
            {Object.entries(loserRounds)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([roundNum, roundMatches]) => {
                // Group by branch for losers bracket
                const branchA = roundMatches.filter(m => m.branch_type === 'A');
                const branchB = roundMatches.filter(m => m.branch_type === 'B');

                return (
                  <div
                    key={roundNum}
                    className='flex flex-col items-center space-y-4'
                  >
                    <h4 className='text-sm font-medium'>Round {roundNum}</h4>

                    {branchA.length > 0 && (
                      <div className='space-y-2'>
                        <Badge variant='outline' className='text-xs'>
                          Branch A
                        </Badge>
                        {branchA.map(match => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            isClubOwner={isClubOwner}
                            onScoreSubmit={onScoreSubmit}
                          />
                        ))}
                      </div>
                    )}

                    {branchB.length > 0 && (
                      <div className='space-y-2'>
                        <Badge variant='outline' className='text-xs'>
                          Branch B
                        </Badge>
                        {branchB.map(match => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            isClubOwner={isClubOwner}
                            onScoreSubmit={onScoreSubmit}
                          />
                        ))}
                      </div>
                    )}

                    {branchA.length === 0 && branchB.length === 0 && (
                      <div className='space-y-2'>
                        {roundMatches.map(match => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            isClubOwner={isClubOwner}
                            onScoreSubmit={onScoreSubmit}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Grand Final */}
      {grandFinalMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Trophy className='h-5 w-5 text-gold' />
              Grand Final
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex justify-center'>
              {grandFinalMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  isClubOwner={isClubOwner}
                  onScoreSubmit={onScoreSubmit}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tournament Stats */}
      <Card>
        <CardContent className='pt-6'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-center'>
            <div>
              <div className='text-2xl font-bold text-primary'>
                {matches.length}
              </div>
              <div className='text-sm text-muted-foreground'>Total Matches</div>
            </div>
            <div>
              <div className='text-2xl font-bold text-green-600'>
                {matches.filter(m => m.status === 'completed').length}
              </div>
              <div className='text-sm text-muted-foreground'>Completed</div>
            </div>
            <div>
              <div className='text-2xl font-bold text-blue-600'>
                {winnerMatches.length}
              </div>
              <div className='text-sm text-muted-foreground'>
                Winner's Bracket
              </div>
            </div>
            <div>
              <div className='text-2xl font-bold text-orange-600'>
                {loserMatches.length}
              </div>
              <div className='text-sm text-muted-foreground'>
                Loser's Bracket
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoubleBracketVisualization;
