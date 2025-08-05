import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Users } from 'lucide-react';
import type { SABOMatch } from '../SABOLogicCore';
import { SABOMatchCard } from './SABOMatchCard';

interface SABOSemifinalsProps {
  matches: SABOMatch[];
  onScoreSubmit: (
    matchId: string,
    scores: { player1: number; player2: number }
  ) => Promise<void>;
  isClubOwner: boolean;
  tournamentId: string;
  currentUserId?: string;
}

export const SABOSemifinals: React.FC<SABOSemifinalsProps> = ({
  matches,
  onScoreSubmit,
  isClubOwner,
  tournamentId,
  currentUserId,
}) => {
  // SABO Semifinals: Round 250 - 2 matches
  const semifinalMatches = matches
    .filter(m => m.round_number === 250)
    .sort((a, b) => a.match_number - b.match_number);

  const completedMatches = semifinalMatches.filter(
    match => match.status === 'completed'
  ).length;
  const totalMatches = semifinalMatches.length;

  if (semifinalMatches.length === 0) {
    return (
      <Card className='border-purple-300 bg-gradient-to-r from-purple-50/50 to-pink-100/50'>
        <CardContent className='p-6'>
          <p className='text-muted-foreground text-center'>
            Semifinals will be available when Winners and Losers Brackets are
            complete.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border-purple-300 bg-gradient-to-r from-purple-50 to-pink-100 dark:from-purple-950/30 dark:to-pink-900/30'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Crown className='h-5 w-5 text-purple-600' />
            Semifinals (4→2)
            <Badge variant='outline' className='ml-2 border-purple-300'>
              {completedMatches}/{totalMatches} completed
            </Badge>
          </CardTitle>
          <Users className='h-6 w-6 text-purple-600' />
        </div>
        <p className='text-sm text-muted-foreground'>
          2 WB finalists + 2 LB champions → 2 matches → 2 Grand Finalists
        </p>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {/* Match Setup Explanation */}
          <div className='grid md:grid-cols-2 gap-3 text-xs bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg'>
            <div>
              <span className='font-medium text-purple-700'>Semifinal 1:</span>
              <p>Winners Bracket Finalist #1 vs Losers Branch A Champion</p>
            </div>
            <div>
              <span className='font-medium text-purple-700'>Semifinal 2:</span>
              <p>Winners Bracket Finalist #2 vs Losers Branch B Champion</p>
            </div>
          </div>

          {/* Semifinal Matches */}
          <div className='grid gap-4 md:grid-cols-2'>
            {semifinalMatches.map((match, index) => (
              <div key={match.id} className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <Badge
                    variant='outline'
                    className='border-purple-300 text-purple-700'
                  >
                    Semifinal {index + 1}
                  </Badge>
                  <span className='text-xs text-muted-foreground'>
                    WB vs L{index === 0 ? 'A' : 'B'}
                  </span>
                </div>
                <SABOMatchCard
                  match={match}
                  onScoreSubmit={onScoreSubmit}
                  isClubOwner={isClubOwner}
                  tournamentId={tournamentId}
                  currentUserId={currentUserId}
                  showLoserDestination='3rd/4th Place'
                  highlightWinner={true}
                  variant='purple'
                />
              </div>
            ))}
          </div>

          {/* Semifinals Summary */}
          <div className='mt-4 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-200'>
            <p className='text-xs text-muted-foreground'>
              <strong>Semifinal Setup:</strong> The 4 remaining players compete
              in 2 matches. Winners advance to the Grand Final, losers are
              eliminated.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
