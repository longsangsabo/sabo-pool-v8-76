import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, ArrowDown } from 'lucide-react';
import { TournamentMatch } from '@/hooks/useTournamentMatches';
import { DoubleEliminationMatchCard } from '../tournament/DoubleEliminationMatchCard';

interface LoserBranchBSectionProps {
  matches: TournamentMatch[];
  isClubOwner: boolean;
  tournamentId: string;
  currentUserId?: string;
}

export const LoserBranchBSection: React.FC<LoserBranchBSectionProps> = ({
  matches,
  isClubOwner,
  tournamentId,
  currentUserId,
}) => {
  // SABO_REBUILD: Filter Branch B matches - SABO compliance only
  // SABO_REBUILD: EXCLUSIVELY receives losers from Winner's Bracket Round 2 ONLY
  const branchBMatches = matches.filter(
    match =>
      match.bracket_type === 'losers' && [201, 202].includes(match.round_number)
  );

  console.log(
    `🔍 [LoserBranchB] Filtering matches for tournament ${tournamentId}:`,
    {
      totalMatches: matches.length,
      branchBMatches: branchBMatches.length,
      branchBDetails: branchBMatches.map(m => ({
        id: m.id,
        round: m.round_number,
        match: m.match_number,
        players: [m.player1_id, m.player2_id].filter(p => p).length,
        status: m.status,
        hasPlayers: !!(m.player1_id || m.player2_id),
      })),
    }
  );

  // Only show matches that have players or are waiting for advancement
  const validBranchBMatches = branchBMatches.filter(
    match => match.player1_id || match.player2_id || match.status === 'waiting'
  );

  // SABO_REBUILD: Enforce SABO-only rounds for Branch B (201, 202)
  // NO LONGER SUPPORTING: rounds 21, 22 - deprecated in SABO compliance
  const round1Matches = validBranchBMatches
    .filter(match => match.round_number === 201)
    .sort((a, b) => a.match_number - b.match_number);

  const round2Matches = validBranchBMatches
    .filter(match => match.round_number === 202)
    .sort((a, b) => a.match_number - b.match_number);

  const completedMatches = validBranchBMatches.filter(
    match => match.status === 'completed'
  ).length;
  const totalMatches = validBranchBMatches.length;

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
          ✅ ONLY Round 2 losers • 4 → 2 → 1 finalist
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
                ✅ 4 losers from Winners R2 ONLY → {round1Matches.length}{' '}
                matches → 2 advance
              </span>
            </div>
            <div className='grid gap-3'>
              {round1Matches.map(match => (
                <DoubleEliminationMatchCard
                  key={match.id}
                  match={match}
                  isClubOwner={isClubOwner}
                  tournamentId={tournamentId}
                  currentUserId={currentUserId}
                  showLoserDestination='Eliminated'
                  variant='purple'
                />
              ))}
            </div>
          </div>

          {/* Branch B Round 2: 2→1 Final */}
          {round2Matches.length > 0 && (
            <div>
              <div className='flex items-center gap-2 mb-3'>
                <Badge
                  variant='outline'
                  className='border-purple-300 text-purple-700'
                >
                  B2: Branch Final
                </Badge>
                <span className='text-sm text-muted-foreground'>
                  ✅ 2 Round 201 winners → 1 match → 1 Branch B Finalist
                </span>
              </div>
              <div className='grid gap-3'>
                {round2Matches.map(match => (
                  <DoubleEliminationMatchCard
                    key={match.id}
                    match={match}
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
              <strong>✅ Branch B Path:</strong> EXCLUSIVELY receives losers
              from Winner's Bracket Round 2 ONLY. No Round 1 losers allowed.
              Winner advances to semifinals. All others eliminated.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
