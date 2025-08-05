import React, { FC } from 'react';
import { MatchCard } from './MatchCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

import { TournamentMatch } from '@/hooks/useTournamentMatches';

interface DoubleEliminationFinalProps {
  match: TournamentMatch | null;
  onScoreSubmit: (
    matchId: string,
    scores: { player1: number; player2: number }
  ) => void;
  allowInput: boolean;
}

export const DoubleEliminationFinal: FC<DoubleEliminationFinalProps> = ({
  match,
  onScoreSubmit,
  allowInput,
}) => {
  return (
    <Card className='border-gold bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20'>
      <CardHeader>
        <div className='flex items-center justify-center space-x-2'>
          <Trophy className='h-6 w-6 text-yellow-600' />
          <CardTitle className='text-xl text-center text-yellow-800 dark:text-yellow-200'>
            Grand Final (2→1)
          </CardTitle>
          <Trophy className='h-6 w-6 text-yellow-600' />
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {match ? (
          <div className='space-y-4'>
            <div className='text-center'>
              <div className='flex items-center justify-center space-x-2 mb-2'>
                <Trophy className='h-5 w-5 text-yellow-600' />
                <h3 className='text-lg font-semibold text-yellow-800 dark:text-yellow-200'>
                  Championship Match
                </h3>
                <Trophy className='h-5 w-5 text-yellow-600' />
              </div>
              <div className='bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-2'>
                <p className='text-xs text-muted-foreground'>
                  Semifinal Winner 1 vs Semifinal Winner 2
                </p>
              </div>
            </div>

            <MatchCard
              match={match as any}
              onScoreSubmit={onScoreSubmit}
              allowInput={allowInput}
              roundType='final'
              roundName='FINAL'
              isHighlighted={true}
              isFinal={true}
            />

            <div className='text-center p-3 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-lg border border-yellow-200'>
              <p className='text-xs text-muted-foreground'>
                <strong>Grand Final:</strong> The ultimate championship match.
                Winner becomes the tournament champion!
              </p>
            </div>
          </div>
        ) : (
          <div className='text-center py-8'>
            <Trophy className='h-12 w-12 text-yellow-400 mx-auto mb-4 opacity-50' />
            <p className='text-muted-foreground'>
              Final match will be available when semifinals are completed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
