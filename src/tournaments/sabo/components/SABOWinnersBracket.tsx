import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, ArrowRight } from 'lucide-react';
import type { SABOMatch } from '../SABOLogicCore';
import { SABOMatchCard } from './SABOMatchCard';

interface SABOWinnersBracketProps {
  matches: SABOMatch[];
  onScoreSubmit: (
    matchId: string,
    scores: { player1: number; player2: number }
  ) => Promise<void>;
  isClubOwner: boolean;
  tournamentId: string;
  currentUserId?: string;
}

export const SABOWinnersBracket: React.FC<SABOWinnersBracketProps> = ({
  matches,
  onScoreSubmit,
  isClubOwner,
  tournamentId,
  currentUserId,
}) => {
  // Group by rounds 1, 2, 3 (SABO Winners Bracket structure)
  const round1 = matches
    .filter(m => m.round_number === 1)
    .sort((a, b) => a.match_number - b.match_number); // 8 matches
  const round2 = matches
    .filter(m => m.round_number === 2)
    .sort((a, b) => a.match_number - b.match_number); // 4 matches
  const round3 = matches
    .filter(m => m.round_number === 3)
    .sort((a, b) => a.match_number - b.match_number); // 2 matches

  const completedMatches = matches.filter(
    match => match.status === 'completed'
  ).length;
  const totalMatches = matches.length;

  return (
    <Card className='border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-100 dark:from-yellow-950/30 dark:to-amber-900/30'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-5 w-5 text-yellow-600' />
            Winners Bracket
            <Badge variant='outline' className='ml-2 border-yellow-300'>
              {completedMatches}/{totalMatches} completed
            </Badge>
          </CardTitle>
          <ArrowRight className='h-6 w-6 text-yellow-600' />
        </div>
        <p className='text-sm text-muted-foreground'>
          Winners advance directly • Losers drop to Losers Bracket
        </p>
      </CardHeader>
      <CardContent>
        <div className='grid gap-6'>
          {/* Round 1: 16→8 players */}
          <div className='winners-round-1'>
            <div className='flex items-center gap-2 mb-3'>
              <Badge
                variant='outline'
                className='border-yellow-300 text-yellow-700'
              >
                Round 1: Opening Round
              </Badge>
              <span className='text-sm text-muted-foreground'>
                16 players → {round1.length} matches → 8 advance
              </span>
            </div>
            <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-4'>
              {round1.map(match => (
                <SABOMatchCard
                  key={match.id}
                  match={match}
                  onScoreSubmit={onScoreSubmit}
                  isClubOwner={isClubOwner}
                  tournamentId={tournamentId}
                  currentUserId={currentUserId}
                  roundType='winners'
                  showLoserDestination='Losers Branch A'
                  variant='yellow'
                />
              ))}
            </div>
          </div>

          {/* Round 2: 8→4 players */}
          {round2.length > 0 && (
            <div className='winners-round-2'>
              <div className='flex items-center gap-2 mb-3'>
                <Badge
                  variant='outline'
                  className='border-yellow-300 text-yellow-700'
                >
                  Round 2: Quarterfinals
                </Badge>
                <span className='text-sm text-muted-foreground'>
                  8 players → {round2.length} matches → 4 advance
                </span>
              </div>
              <div className='grid gap-3 md:grid-cols-2'>
                {round2.map(match => (
                  <SABOMatchCard
                    key={match.id}
                    match={match}
                    onScoreSubmit={onScoreSubmit}
                    isClubOwner={isClubOwner}
                    tournamentId={tournamentId}
                    currentUserId={currentUserId}
                    roundType='winners'
                    showLoserDestination='Losers Branch B'
                    variant='yellow'
                  />
                ))}
              </div>
            </div>
          )}

          {/* Round 3: 4→2 players */}
          {round3.length > 0 && (
            <div className='winners-round-3'>
              <div className='flex items-center gap-2 mb-3'>
                <Badge
                  variant='outline'
                  className='border-yellow-300 text-yellow-700'
                >
                  Round 3: Semifinals
                </Badge>
                <span className='text-sm text-muted-foreground'>
                  4 players → {round3.length} matches → 2 advance to Finals
                </span>
              </div>
              <div className='grid gap-3 md:grid-cols-2'>
                {round3.map(match => (
                  <SABOMatchCard
                    key={match.id}
                    match={match}
                    onScoreSubmit={onScoreSubmit}
                    isClubOwner={isClubOwner}
                    tournamentId={tournamentId}
                    currentUserId={currentUserId}
                    roundType='winners'
                    showLoserDestination='Eliminated'
                    highlightWinner={true}
                    variant='yellow'
                  />
                ))}
              </div>
            </div>
          )}

          {/* Winners Bracket Summary */}
          <div className='mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-200'>
            <p className='text-xs text-muted-foreground'>
              <strong>Winners Path:</strong> Win every match to reach the Grand
              Final. One loss sends you to the Losers Bracket for a second
              chance.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
