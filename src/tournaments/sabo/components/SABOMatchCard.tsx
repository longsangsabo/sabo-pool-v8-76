import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Trophy, Target, Users, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SABOMatch } from '../SABOLogicCore';

interface SABOMatchCardProps {
  match: SABOMatch;
  onScoreSubmit: (
    matchId: string,
    scores: { player1: number; player2: number }
  ) => Promise<void>;
  isClubOwner: boolean;
  tournamentId: string;
  currentUserId?: string;
  roundType?: 'winners' | 'losers' | 'semifinals' | 'final';
  showLoserDestination?: string;
  eliminationRisk?: boolean;
  highlightWinner?: boolean;
  isChampionshipMatch?: boolean;
  variant?: 'yellow' | 'orange' | 'purple' | 'gold';
}

export const SABOMatchCard: React.FC<SABOMatchCardProps> = ({
  match,
  onScoreSubmit,
  isClubOwner,
  tournamentId,
  currentUserId,
  roundType = 'winners',
  showLoserDestination,
  eliminationRisk = false,
  highlightWinner = false,
  isChampionshipMatch = false,
  variant = 'yellow',
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [player1Score, setPlayer1Score] = useState('');
  const [player2Score, setPlayer2Score] = useState('');
  const [showScoreInput, setShowScoreInput] = useState(false);

  const { player1, player2, winner_id, status } = match;
  const isCompleted = status === 'completed';
  const hasPlayers = player1 && player2;
  const isPlayer1Winner = winner_id === player1?.user_id;
  const isPlayer2Winner = winner_id === player2?.user_id;

  // Club owner can always manage scores for scheduled/ready matches, players need both players present
  const canManageScore =
    !isCompleted &&
    (isClubOwner ||
      (hasPlayers &&
        (match.player1_id === currentUserId ||
          match.player2_id === currentUserId)));

  // Debug logging
  console.log('🎯 SABOMatchCard Debug:', {
    matchId: match.id,
    isClubOwner,
    hasPlayers,
    isCompleted,
    canManageScore,
    player1Id: match.player1_id,
    player2Id: match.player2_id,
    currentUserId,
    status,
  });

  const getVariantStyles = () => {
    switch (variant) {
      case 'orange':
        return {
          border: 'border-orange-200',
          background: 'bg-orange-50 dark:bg-orange-950/20',
          accent: 'text-orange-600',
          badge: 'border-orange-300 text-orange-700',
        };
      case 'purple':
        return {
          border: 'border-purple-200',
          background: 'bg-purple-50 dark:bg-purple-950/20',
          accent: 'text-purple-600',
          badge: 'border-purple-300 text-purple-700',
        };
      case 'gold':
        return {
          border: 'border-yellow-300',
          background:
            'bg-gradient-to-r from-yellow-50 to-orange-100 dark:from-yellow-950/30 dark:to-orange-900/30',
          accent: 'text-yellow-600',
          badge: 'border-yellow-300 text-yellow-700',
        };
      default: // yellow
        return {
          border: 'border-yellow-200',
          background: 'bg-yellow-50 dark:bg-yellow-950/20',
          accent: 'text-yellow-600',
          badge: 'border-yellow-300 text-yellow-700',
        };
    }
  };

  const styles = getVariantStyles();

  const handleScoreSubmit = async () => {
    if (player1Score === '' || player2Score === '') return;

    const scores = {
      player1: parseInt(player1Score),
      player2: parseInt(player2Score),
    };

    try {
      setIsSubmitting(true);

      // ✅ IMMEDIATE UI UPDATE: Close score input immediately for better UX
      setShowScoreInput(false);
      setPlayer1Score('');
      setPlayer2Score('');

      // Submit score (this will trigger refresh with scroll preservation)
      await onScoreSubmit(match.id, scores);
    } catch (error) {
      console.error('Failed to submit score:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMatchIcon = () => {
    if (isChampionshipMatch) return <Crown className='h-4 w-4' />;
    if (roundType === 'final') return <Trophy className='h-4 w-4' />;
    if (roundType === 'semifinals') return <Users className='h-4 w-4' />;
    if (roundType === 'losers') return <Target className='h-4 w-4' />;
    return <Trophy className='h-4 w-4' />;
  };

  const getStatusBadge = () => {
    if (isCompleted) {
      return (
        <Badge variant='outline' className='border-green-300 text-green-700'>
          Completed
        </Badge>
      );
    }
    if (hasPlayers) {
      return (
        <Badge variant='outline' className={styles.badge}>
          Ready
        </Badge>
      );
    }
    return (
      <Badge variant='outline' className='border-gray-300 text-gray-700'>
        Waiting
      </Badge>
    );
  };

  return (
    <Card
      className={cn(
        styles.border,
        styles.background,
        'relative transition-all duration-200',
        isChampionshipMatch && 'shadow-lg border-2',
        eliminationRisk && 'shadow-md'
      )}
    >
      <CardContent className='p-4'>
        {/* Match Header */}
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-2'>
            {getMatchIcon()}
            <span className={cn('text-sm font-medium', styles.accent)}>
              Match {match.match_number}
            </span>
            {isChampionshipMatch && (
              <Badge
                variant='outline'
                className='border-gold-300 text-gold-700'
              >
                Championship
              </Badge>
            )}
          </div>
          <div className='flex items-center gap-2'>
            {eliminationRisk && (
              <AlertTriangle className='h-4 w-4 text-red-500' />
            )}
            {getStatusBadge()}
          </div>
        </div>

        {/* Enhanced Completed Match Display */}
        {isCompleted ? (
          <div className='space-y-3'>
            {/* Enhanced Player 1 Display */}
            <div
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border-2',
                isPlayer1Winner
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300'
                  : 'bg-gray-50 dark:bg-gray-800/20 border-gray-200'
              )}
            >
              <div className='flex items-center space-x-3'>
                {isPlayer1Winner && (
                  <Trophy className='w-5 h-5 text-yellow-500' />
                )}
                <Avatar className='h-10 w-10'>
                  <AvatarImage src={player1?.avatar_url} />
                  <AvatarFallback>
                    {player1?.display_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div
                    className={cn(
                      'font-semibold',
                      isPlayer1Winner
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-gray-600 dark:text-gray-400'
                    )}
                  >
                    {player1?.display_name || 'Player 1'}
                  </div>
                  {isPlayer1Winner && (
                    <div className='text-xs text-green-600 dark:text-green-400 font-medium'>
                      WINNER
                    </div>
                  )}
                  {player1?.verified_rank && (
                    <div className='text-xs text-muted-foreground'>
                      {player1.verified_rank}
                    </div>
                  )}
                </div>
              </div>
              <div
                className={cn(
                  'text-3xl font-bold',
                  isPlayer1Winner
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-400'
                )}
              >
                {match.player1_score ?? 0}
              </div>
            </div>

            {/* VS Divider */}
            <div className='text-center text-gray-400 text-sm font-medium my-2'>
              VS
            </div>

            {/* Enhanced Player 2 Display */}
            <div
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border-2',
                isPlayer2Winner
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300'
                  : 'bg-gray-50 dark:bg-gray-800/20 border-gray-200'
              )}
            >
              <div className='flex items-center space-x-3'>
                {isPlayer2Winner && (
                  <Trophy className='w-5 h-5 text-yellow-500' />
                )}
                <Avatar className='h-10 w-10'>
                  <AvatarImage src={player2?.avatar_url} />
                  <AvatarFallback>
                    {player2?.display_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div
                    className={cn(
                      'font-semibold',
                      isPlayer2Winner
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-gray-600 dark:text-gray-400'
                    )}
                  >
                    {player2?.display_name || 'Player 2'}
                  </div>
                  {isPlayer2Winner && (
                    <div className='text-xs text-green-600 dark:text-green-400 font-medium'>
                      WINNER
                    </div>
                  )}
                  {player2?.verified_rank && (
                    <div className='text-xs text-muted-foreground'>
                      {player2.verified_rank}
                    </div>
                  )}
                </div>
              </div>
              <div
                className={cn(
                  'text-3xl font-bold',
                  isPlayer2Winner
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-400'
                )}
              >
                {match.player2_score ?? 0}
              </div>
            </div>

            {/* Match Result Summary */}
            <div className='mt-3 p-2 bg-gray-50 dark:bg-gray-800/20 rounded text-center'>
              <span className='text-sm text-gray-600 dark:text-gray-400'>
                Final: {match.player1_score ?? 0} - {match.player2_score ?? 0}
              </span>
            </div>
          </div>
        ) : (
          /* Regular Display for Active/Pending Matches */
          <div className='space-y-3'>
            {/* Player 1 */}
            <div
              className={cn(
                'flex items-center justify-between p-2 rounded-lg',
                winner_id === player1?.user_id && highlightWinner
                  ? 'bg-green-100 dark:bg-green-900/20 border border-green-200'
                  : 'bg-white dark:bg-gray-800/50'
              )}
            >
              <div className='flex items-center gap-2'>
                <Avatar className='h-8 w-8'>
                  <AvatarImage src={player1?.avatar_url} />
                  <AvatarFallback>
                    {player1?.display_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className='text-sm font-medium'>
                    {player1?.display_name || 'TBD'}
                  </p>
                  {player1?.verified_rank && (
                    <p className='text-xs text-muted-foreground'>
                      {player1.verified_rank}
                    </p>
                  )}
                </div>
              </div>
              {winner_id === player1?.user_id && (
                <Trophy className='h-4 w-4 text-gold-500' />
              )}
            </div>

            {/* VS Divider */}
            <div className='text-center'>
              <span className='text-xs text-muted-foreground bg-muted px-2 py-1 rounded'>
                VS
              </span>
            </div>

            {/* Player 2 */}
            <div
              className={cn(
                'flex items-center justify-between p-2 rounded-lg',
                winner_id === player2?.user_id && highlightWinner
                  ? 'bg-green-100 dark:bg-green-900/20 border border-green-200'
                  : 'bg-white dark:bg-gray-800/50'
              )}
            >
              <div className='flex items-center gap-2'>
                <Avatar className='h-8 w-8'>
                  <AvatarImage src={player2?.avatar_url} />
                  <AvatarFallback>
                    {player2?.display_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className='text-sm font-medium'>
                    {player2?.display_name || 'TBD'}
                  </p>
                  {player2?.verified_rank && (
                    <p className='text-xs text-muted-foreground'>
                      {player2.verified_rank}
                    </p>
                  )}
                </div>
              </div>
              {winner_id === player2?.user_id && (
                <Trophy className='h-4 w-4 text-gold-500' />
              )}
            </div>
          </div>
        )}

        {/* Score Input */}
        {canManageScore && showScoreInput && (
          <div className='mt-4 space-y-3 p-3 bg-muted rounded-lg'>
            <div className='grid grid-cols-2 gap-2'>
              <div>
                <label className='text-xs text-muted-foreground'>
                  {player1?.display_name} Score
                </label>
                <Input
                  type='number'
                  value={player1Score}
                  onChange={e => setPlayer1Score(e.target.value)}
                  placeholder='0'
                  className='h-8'
                />
              </div>
              <div>
                <label className='text-xs text-muted-foreground'>
                  {player2?.display_name} Score
                </label>
                <Input
                  type='number'
                  value={player2Score}
                  onChange={e => setPlayer2Score(e.target.value)}
                  placeholder='0'
                  className='h-8'
                />
              </div>
            </div>
            <div className='flex gap-2'>
              <Button
                size='sm'
                onClick={handleScoreSubmit}
                disabled={
                  isSubmitting || player1Score === '' || player2Score === ''
                }
                className='flex-1'
              >
                {isSubmitting ? 'Submitting...' : 'Submit Score'}
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={() => setShowScoreInput(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Action Button */}
        {canManageScore && !showScoreInput && (
          <Button
            size='sm'
            variant='outline'
            onClick={() => setShowScoreInput(true)}
            className='w-full mt-4'
          >
            Enter Score
          </Button>
        )}

        {/* Match Info */}
        <div className='mt-3 pt-2 border-t border-muted'>
          <div className='flex justify-between items-center text-xs text-muted-foreground'>
            <span>Round {match.round_number}</span>
            {showLoserDestination && (
              <span>Loser → {showLoserDestination}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
