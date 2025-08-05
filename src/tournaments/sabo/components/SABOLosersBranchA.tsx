import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, ArrowDown } from 'lucide-react';
import type { SABOMatch } from '../SABOLogicCore';
import { SABOMatchCard } from './SABOMatchCard';

interface SABOLosersBranchAProps {
  matches: SABOMatch[];
  onScoreSubmit: (
    matchId: string,
    scores: { player1: number; player2: number }
  ) => Promise<void>;
  isClubOwner: boolean;
  tournamentId: string;
  currentUserId?: string;
}

export const SABOLosersBranchA: React.FC<SABOLosersBranchAProps> = ({
  matches,
  onScoreSubmit,
  isClubOwner,
  tournamentId,
  currentUserId,
}) => {
  // SABO Branch A rounds: 101, 102, 103
  const round101 = matches
    .filter(m => m.round_number === 101)
    .sort((a, b) => a.match_number - b.match_number); // 4 matches
  const round102 = matches
    .filter(m => m.round_number === 102)
    .sort((a, b) => a.match_number - b.match_number); // 2 matches
  const round103 = matches
    .filter(m => m.round_number === 103)
    .sort((a, b) => a.match_number - b.match_number); // 1 match

  const completedMatches = matches.filter(
    match => match.status === 'completed'
  ).length;
  const totalMatches = matches.length;

  return (
    <Card className='border-orange-300 bg-gradient-to-r from-orange-50 to-red-100 dark:from-orange-950/30 dark:to-red-900/30'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <ArrowDown className='h-5 w-5 text-orange-600' />
            Loser's Branch A
            <Badge variant='outline' className='ml-2 border-orange-300'>
              {completedMatches}/{totalMatches} completed
            </Badge>
          </CardTitle>
          <Target className='h-6 w-6 text-orange-600' />
        </div>
        <p className='text-sm text-muted-foreground'>
          Losers from WB R1 • 8 → 4 → 2 → 1 finalist
        </p>
      </CardHeader>
      <CardContent>
        <div className='grid gap-6'>
          {/* Branch A Round 1: 8→4 */}
          <div>
            <div className='flex items-center gap-2 mb-3'>
              <Badge
                variant='outline'
                className='border-orange-300 text-orange-700'
              >
                A1: Branch Quarterfinals
              </Badge>
              <span className='text-sm text-muted-foreground'>
                8 losers from WB R1 → {round101.length} matches → 4 advance
              </span>
            </div>
            <div className='grid gap-3 md:grid-cols-2'>
              {round101.map(match => (
                <SABOMatchCard
                  key={match.id}
                  match={match}
                  onScoreSubmit={onScoreSubmit}
                  isClubOwner={isClubOwner}
                  tournamentId={tournamentId}
                  currentUserId={currentUserId}
                  showLoserDestination='Eliminated'
                  eliminationRisk={true}
                  variant='orange'
                />
              ))}
            </div>
          </div>

          {/* Branch A Round 2: 4→2 */}
          {round102.length > 0 && (
            <div>
              <div className='flex items-center gap-2 mb-3'>
                <Badge
                  variant='outline'
                  className='border-orange-300 text-orange-700'
                >
                  A2: Branch Semifinals
                </Badge>
                <span className='text-sm text-muted-foreground'>
                  4 → {round102.length} matches → 2 advance
                </span>
              </div>
              <div className='grid gap-3'>
                {round102.map(match => (
                  <SABOMatchCard
                    key={match.id}
                    match={match}
                    onScoreSubmit={onScoreSubmit}
                    isClubOwner={isClubOwner}
                    tournamentId={tournamentId}
                    currentUserId={currentUserId}
                    showLoserDestination='Eliminated'
                    eliminationRisk={true}
                    variant='orange'
                  />
                ))}
              </div>
            </div>
          )}

          {/* Branch A Round 3: 2→1 Final */}
          {round103.length > 0 && (
            <div>
              <div className='flex items-center gap-2 mb-3'>
                <Badge
                  variant='outline'
                  className='border-orange-300 text-orange-700'
                >
                  A3: Branch Final
                </Badge>
                <span className='text-sm text-muted-foreground'>
                  2 → {round103.length} match → 1 Branch A Finalist
                </span>
              </div>
              <div className='grid gap-3'>
                {round103.map(match => (
                  <SABOMatchCard
                    key={match.id}
                    match={match}
                    onScoreSubmit={onScoreSubmit}
                    isClubOwner={isClubOwner}
                    tournamentId={tournamentId}
                    currentUserId={currentUserId}
                    showLoserDestination='Eliminated'
                    highlightWinner={true}
                    variant='orange'
                  />
                ))}
              </div>
            </div>
          )}

          {/* Branch A Summary */}
          <div className='mt-4 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg border border-orange-200'>
            <p className='text-xs text-muted-foreground'>
              <strong>Branch A Path:</strong> Receives losers from Winner's
              Bracket Round 1. Winner advances to semifinals. All other
              participants eliminated.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
