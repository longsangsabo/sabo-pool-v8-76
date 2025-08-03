import React, { FC } from 'react';
import { MatchCard } from './MatchCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TournamentMatch } from '@/hooks/useTournamentMatches';

interface DoubleEliminationSemifinalProps {
  matches: TournamentMatch[];
  onScoreSubmit: (
    matchId: string,
    scores: { player1: number; player2: number }
  ) => void;
  allowInput: boolean;
}

export const DoubleEliminationSemifinal: FC<
  DoubleEliminationSemifinalProps
> = ({ matches, onScoreSubmit, allowInput }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-xl text-center'>Semifinal (4→2)</CardTitle>
        <p className='text-center text-sm text-muted-foreground'>
          Winners bracket finalists vs Losers bracket champions
        </p>
      </CardHeader>
      <CardContent className='space-y-4'>
        {matches.length > 0 ? (
          <div className='grid gap-4 md:grid-cols-2'>
            {matches.map((match, index) => (
              <div key={match.id} className='space-y-2'>
                <div className='text-center'>
                  <h3 className='font-semibold text-sm'>
                    Semifinal {index + 1}
                  </h3>
                  <div className='bg-muted rounded-lg p-2 mt-1'>
                    <p className='text-xs text-muted-foreground'>
                      {index === 0
                        ? 'WB Winner vs LB Branch A Winner'
                        : 'WB Winner vs LB Branch B Winner'}
                    </p>
                  </div>
                </div>

                <MatchCard
                  match={match as any}
                  onScoreSubmit={onScoreSubmit}
                  allowInput={allowInput}
                  roundType='semifinal'
                  roundName={`SF ${index + 1}`}
                  isHighlighted={true}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className='text-center py-8'>
            <p className='text-muted-foreground'>
              Semifinal matches will be available when bracket progression
              reaches this stage
            </p>
          </div>
        )}

        <div className='text-center p-3 bg-muted rounded-lg'>
          <p className='text-xs text-muted-foreground'>
            <strong>Semifinal Setup:</strong> The 4 remaining players compete in
            2 matches. Winners advance to the Grand Final.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
