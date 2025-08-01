import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Crown, Star } from 'lucide-react';
import type { SABOMatch } from '../SABOLogicCore';
import { SABOMatchCard } from './SABOMatchCard';

interface SABOFinalProps {
  match: SABOMatch | undefined;
  onScoreSubmit: (
    matchId: string,
    scores: { player1: number; player2: number }
  ) => Promise<void>;
  isClubOwner: boolean;
  tournamentId: string;
  currentUserId?: string;
}

export const SABOFinal: React.FC<SABOFinalProps> = ({
  match,
  onScoreSubmit,
  isClubOwner,
  tournamentId,
  currentUserId,
}) => {
  if (!match) {
    return (
      <Card className='border-gold-300 bg-gradient-to-r from-yellow-50/50 to-orange-100/50'>
        <CardContent className='p-6'>
          <p className='text-muted-foreground text-center'>
            Grand Final will be available when Semifinals are complete.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isCompleted = match.status === 'completed';
  const hasWinner = match.winner_id !== null;

  return (
    <Card className='border-gold-300 bg-gradient-to-r from-yellow-50 to-orange-100 dark:from-yellow-950/30 dark:to-orange-900/30'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-6 w-6 text-gold-600' />
            Grand Final (2→1)
            {isCompleted && (
              <Badge
                variant='outline'
                className='ml-2 border-green-300 text-green-700'
              >
                Tournament Complete
              </Badge>
            )}
          </CardTitle>
          <div className='flex items-center gap-2'>
            <Crown className='h-6 w-6 text-gold-600' />
            <Star className='h-6 w-6 text-gold-600' />
          </div>
        </div>
        <p className='text-sm text-muted-foreground'>
          The ultimate championship match • Winner takes all
        </p>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {/* Championship Match */}
          <div className='p-4 bg-gradient-to-r from-gold-50 to-yellow-100 dark:from-gold-950/20 dark:to-yellow-900/20 rounded-lg border border-gold-200'>
            <div className='flex items-center gap-2 mb-3'>
              <Badge
                variant='outline'
                className='border-gold-300 text-gold-700'
              >
                Championship Match
              </Badge>
              <span className='text-sm text-muted-foreground'>
                Round 300 • Winner becomes Tournament Champion
              </span>
            </div>

            <SABOMatchCard
              match={match}
              onScoreSubmit={onScoreSubmit}
              isClubOwner={isClubOwner}
              tournamentId={tournamentId}
              currentUserId={currentUserId}
              showLoserDestination='Runner-up'
              highlightWinner={true}
              isChampionshipMatch={true}
              variant='gold'
            />
          </div>

          {/* Tournament Result */}
          {isCompleted && hasWinner && (
            <div className='p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200'>
              <div className='flex items-center gap-2 mb-2'>
                <Trophy className='h-5 w-5 text-green-600' />
                <span className='font-bold text-green-700'>
                  Tournament Champion
                </span>
              </div>
              <p className='text-sm text-muted-foreground'>
                Congratulations to the winner! The tournament has been
                completed.
              </p>
            </div>
          )}

          {/* Championship Info */}
          <div className='mt-4 p-3 bg-gold-100 dark:bg-gold-900/30 rounded-lg border border-gold-200'>
            <p className='text-xs text-muted-foreground'>
              <strong>Grand Final:</strong> The two semifinal winners compete
              for the championship. This is the culmination of the entire SABO
              tournament structure.
            </p>
          </div>

          {/* Tournament Summary */}
          {isCompleted && (
            <div className='mt-4 p-3 bg-muted rounded-lg'>
              <h4 className='font-medium mb-2 flex items-center gap-2'>
                <Star className='h-4 w-4' />
                Tournament Summary
              </h4>
              <div className='text-xs text-muted-foreground space-y-1'>
                <p>
                  • Started with 16 players across Winners and Losers brackets
                </p>
                <p>• Completed 27 total matches in SABO structure</p>
                <p>• Every player had opportunities for advancement</p>
                <p>
                  • Champion emerged through competitive bracket progression
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
