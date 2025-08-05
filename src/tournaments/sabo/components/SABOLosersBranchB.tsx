import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, ArrowDown } from 'lucide-react';
import type { SABOMatch } from '../SABOLogicCore';
import { SABOMatchCard } from './SABOMatchCard';

interface SABOLosersBranchBProps {
  matches: SABOMatch[];
  onScoreSubmit: (
    matchId: string,
    scores: { player1: number; player2: number }
  ) => Promise<void>;
  isClubOwner: boolean;
  tournamentId: string;
  currentUserId?: string;
}

export const SABOLosersBranchB: React.FC<SABOLosersBranchBProps> = ({
  matches,
  onScoreSubmit,
  isClubOwner,
  tournamentId,
  currentUserId,
}) => {
  // SABO Branch B rounds: 201, 202
  const round201 = matches
    .filter(m => m.round_number === 201)
    .sort((a, b) => a.match_number - b.match_number); // 2 matches
  const round202 = matches
    .filter(m => m.round_number === 202)
    .sort((a, b) => a.match_number - b.match_number); // 1 match

  const completedMatches = matches.filter(
    match => match.status === 'completed'
  ).length;
  const totalMatches = matches.length;

  return (
    <Card className='border-purple-300 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <ArrowDown className='h-5 w-5 text-purple-600' />
            Loser's Branch B
            <Badge variant='outline' className='ml-2 border-purple-300'>
              {completedMatches}/{totalMatches} completed
            </Badge>
          </CardTitle>
          <Target className='h-6 w-6 text-purple-600' />
        </div>
        <p className='text-sm text-muted-foreground'>
          Losers from WB R2 • 4 → 2 → 1 finalist
        </p>
      </CardHeader>
      <CardContent>
        <div className='grid gap-6'>
          {/* Branch B Round 1: 4→2 */}
          <div>
            <div className='flex items-center gap-2 mb-3'>
              <Badge
                variant='outline'
                className='border-purple-300 text-purple-700'
              >
                B1: Branch Semifinals
              </Badge>
              <span className='text-sm text-muted-foreground'>
                4 losers from WB R2 → {round201.length} matches → 2 advance
              </span>
            </div>
            <div className='grid gap-3'>
              {round201.map(match => (
                <SABOMatchCard
                  key={match.id}
                  match={match}
                  onScoreSubmit={onScoreSubmit}
                  isClubOwner={isClubOwner}
                  tournamentId={tournamentId}
                  currentUserId={currentUserId}
                  showLoserDestination='Eliminated'
                  eliminationRisk={true}
                  variant='purple'
                />
              ))}
            </div>
          </div>

          {/* Branch B Round 2: 2→1 Final */}
          {round202.length > 0 && (
            <div>
              <div className='flex items-center gap-2 mb-3'>
                <Badge
                  variant='outline'
                  className='border-purple-300 text-purple-700'
                >
                  B2: Branch Final
                </Badge>
                <span className='text-sm text-muted-foreground'>
                  2 → {round202.length} match → 1 Branch B Finalist
                </span>
              </div>
              <div className='grid gap-3'>
                {round202.map(match => (
                  <SABOMatchCard
                    key={match.id}
                    match={match}
                    onScoreSubmit={onScoreSubmit}
                    isClubOwner={isClubOwner}
                    tournamentId={tournamentId}
                    currentUserId={currentUserId}
                    showLoserDestination='Eliminated'
                    highlightWinner={true}
                    variant='purple'
                  />
                ))}
              </div>
            </div>
          )}

          {/* Branch B Summary */}
          <div className='mt-4 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-200'>
            <p className='text-xs text-muted-foreground'>
              <strong>Branch B Path:</strong> Receives losers from Winner's
              Bracket Round 2. Winner advances to semifinals. All other
              participants eliminated.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
