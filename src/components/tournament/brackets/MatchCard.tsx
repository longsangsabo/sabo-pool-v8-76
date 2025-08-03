import React, { FC, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Crown, Trophy, User } from 'lucide-react';
import { cn } from '@/lib/utils';

import { TournamentMatch } from '@/hooks/useTournamentMatches';

interface MatchCardProps {
  match: TournamentMatch;
  onScoreSubmit: (
    matchId: string,
    scores: { player1: number; player2: number }
  ) => void;
  allowInput: boolean;
  roundType: string;
  roundName: string;
  branch?: 'A' | 'B';
  isHighlighted?: boolean;
  isFinal?: boolean;
}

export const MatchCard: FC<MatchCardProps> = ({
  match,
  onScoreSubmit,
  allowInput,
  roundType,
  roundName,
  branch,
  isHighlighted = false,
  isFinal = false,
}) => {
  const [player1Score, setPlayer1Score] = useState(
    match.score_player1?.toString() || ''
  );
  const [player2Score, setPlayer2Score] = useState(
    match.score_player2?.toString() || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const score1 = parseInt(player1Score) || 0;
    const score2 = parseInt(player2Score) || 0;

    if (score1 === score2) {
      alert('Scores cannot be tied');
      return;
    }

    setIsSubmitting(true);
    try {
      await onScoreSubmit(match.id, { player1: score1, player2: score2 });
    } catch (error) {
      console.error('Score submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'ongoing':
        return 'bg-yellow-500';
      case 'scheduled':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPlayerName = (playerId: string | null, playerData?: any) => {
    if (!playerId) return 'TBD';
    if (playerData) {
      return (
        playerData.display_name || playerData.full_name || 'Unknown Player'
      );
    }
    return `Player ${playerId.slice(-4)}`;
  };

  const isCompleted = match.status === 'completed';
  const canSubmitScore =
    allowInput && !isCompleted && match.player1_id && match.player2_id;

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        isHighlighted && 'ring-2 ring-primary/20 bg-primary/5',
        isFinal &&
          'border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20',
        isCompleted && 'border-green-300 bg-green-50/50 dark:bg-green-950/20'
      )}
    >
      <CardContent className='p-4'>
        {/* Match Header */}
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center space-x-2'>
            {isFinal && <Trophy className='h-4 w-4 text-yellow-600' />}
            <span className='font-medium text-sm'>{roundName}</span>
            {branch && (
              <Badge variant='outline' className='text-xs'>
                {branch}
              </Badge>
            )}
          </div>

          <Badge
            variant='secondary'
            className={cn('text-xs', getStatusColor(match.status))}
          >
            {match.status}
          </Badge>
        </div>

        {/* Players and Scores */}
        <div className='space-y-3'>
          {/* Player 1 */}
          <div
            className={cn(
              'flex items-center justify-between p-2 rounded border',
              match.winner_id === match.player1_id &&
                'bg-green-100 dark:bg-green-900/30 border-green-300'
            )}
          >
            <div className='flex items-center space-x-2'>
              {match.winner_id === match.player1_id && (
                <Crown className='h-4 w-4 text-yellow-600' />
              )}
              <User className='h-4 w-4 text-muted-foreground' />
              <span className='font-medium text-sm'>
                {getPlayerName(match.player1_id, (match as any).player1)}
              </span>
            </div>

            <div className='flex items-center space-x-2'>
              {canSubmitScore ? (
                <Input
                  type='number'
                  value={player1Score}
                  onChange={e => setPlayer1Score(e.target.value)}
                  className='w-16 h-8 text-center'
                  min='0'
                  placeholder='0'
                />
              ) : (
                <div className='w-8 h-8 flex items-center justify-center bg-muted rounded text-sm font-medium'>
                  {match.score_player1 ?? '-'}
                </div>
              )}
            </div>
          </div>

          {/* Player 2 */}
          <div
            className={cn(
              'flex items-center justify-between p-2 rounded border',
              match.winner_id === match.player2_id &&
                'bg-green-100 dark:bg-green-900/30 border-green-300'
            )}
          >
            <div className='flex items-center space-x-2'>
              {match.winner_id === match.player2_id && (
                <Crown className='h-4 w-4 text-yellow-600' />
              )}
              <User className='h-4 w-4 text-muted-foreground' />
              <span className='font-medium text-sm'>
                {getPlayerName(match.player2_id, (match as any).player2)}
              </span>
            </div>

            <div className='flex items-center space-x-2'>
              {canSubmitScore ? (
                <Input
                  type='number'
                  value={player2Score}
                  onChange={e => setPlayer2Score(e.target.value)}
                  className='w-16 h-8 text-center'
                  min='0'
                  placeholder='0'
                />
              ) : (
                <div className='w-8 h-8 flex items-center justify-center bg-muted rounded text-sm font-medium'>
                  {match.score_player2 ?? '-'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        {canSubmitScore && (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !player1Score || !player2Score}
            className='w-full mt-3'
            size='sm'
          >
            {isSubmitting ? 'Submitting...' : 'Submit Score'}
          </Button>
        )}

        {/* Match Info */}
        <div className='text-xs text-muted-foreground mt-2 text-center'>
          Match #{match.match_number} • Round {match.round_number}
        </div>
      </CardContent>
    </Card>
  );
};
