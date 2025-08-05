import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ArrowDown } from 'lucide-react';
import { TournamentMatch } from '@/hooks/useTournamentMatches';
import { DoubleEliminationMatchCard } from '../tournament/DoubleEliminationMatchCard';

interface LoserBranchASectionProps {
  matches: TournamentMatch[];
  isClubOwner: boolean;
  tournamentId: string;
  currentUserId?: string;
}

export const LoserBranchASection: React.FC<LoserBranchASectionProps> = ({
  matches,
  isClubOwner,
  tournamentId,
  currentUserId,
}) => {
  // ===== SABO COMPLIANCE: LOSER'S BRANCH A FILTERING =====
  // SABO_REBUILD: Branch A contains matches with bracket_type 'losers' and rounds 101,102,103
  // These matches ONLY receive losers from Winner's Bracket Round 1
  const branchAMatches = matches.filter(
    match =>
      match.bracket_type === 'losers' &&
      [101, 102, 103].includes(match.round_number)
  );

  console.log(
    `🔍 [LoserBranchA] Filtering matches for tournament ${tournamentId}:`,
    {
      totalMatches: matches.length,
      branchAMatches: branchAMatches.length,
      branchADetails: branchAMatches.map(m => ({
        id: m.id,
        round: m.round_number,
        match: m.match_number,
        players: [m.player1_id, m.player2_id].filter(p => p).length,
        status: m.status,
        hasPlayers: !!(m.player1_id || m.player2_id),
      })),
    }
  );

  // Show matches that have players OR are waiting for advancement
  const validBranchAMatches = branchAMatches.filter(
    match => match.player1_id || match.player2_id || match.status === 'waiting'
  );

  // SABO_REBUILD: Enforce SABO-only rounds for Branch A (101, 102, 103)
  // NO LONGER SUPPORTING: rounds 11, 12, 13 - deprecated in SABO compliance
  const round1Matches = validBranchAMatches
    .filter(match => match.round_number === 101)
    .sort((a, b) => a.match_number - b.match_number);

  const round2Matches = validBranchAMatches
    .filter(match => match.round_number === 102)
    .sort((a, b) => a.match_number - b.match_number);

  const round3Matches = validBranchAMatches
    .filter(match => match.round_number === 103)
    .sort((a, b) => a.match_number - b.match_number);

  const completedMatches = validBranchAMatches.filter(
    match => match.status === 'completed'
  ).length;
  const totalMatches = validBranchAMatches.length;

  return (
    <Card className='border-orange-300 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <ArrowDown className='h-5 w-5 text-orange-600' />
            Loser's Branch A
            <Badge variant='outline' className='ml-2 border-orange-300'>
              {completedMatches}/{totalMatches} completed
            </Badge>
          </CardTitle>
          <Users className='h-6 w-6 text-orange-600' />
        </div>
        <p className='text-sm text-muted-foreground'>
          ✅ ONLY Round 1 losers • 8 → 4 → 2 → 1 finalist
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
                ✅ 8 losers from Winners R1 ONLY → {round1Matches.length}{' '}
                matches → 4 advance
              </span>
            </div>
            <div className='grid gap-3 md:grid-cols-2'>
              {round1Matches.map(match => (
                <DoubleEliminationMatchCard
                  key={match.id}
                  match={match}
                  isClubOwner={isClubOwner}
                  tournamentId={tournamentId}
                  currentUserId={currentUserId}
                  showLoserDestination='Eliminated'
                  variant='orange'
                />
              ))}
            </div>
          </div>

          {/* Branch A Round 2: 4→2 */}
          {round2Matches.length > 0 && (
            <div>
              <div className='flex items-center gap-2 mb-3'>
                <Badge
                  variant='outline'
                  className='border-orange-300 text-orange-700'
                >
                  A2: Branch Semifinals
                </Badge>
                <span className='text-sm text-muted-foreground'>
                  ✅ 4 Round 101 winners → {round2Matches.length} matches → 2
                  advance
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
                    variant='orange'
                  />
                ))}
              </div>
            </div>
          )}

          {/* Branch A Round 3: 2→1 Final */}
          {round3Matches.length > 0 && (
            <div>
              <div className='flex items-center gap-2 mb-3'>
                <Badge
                  variant='outline'
                  className='border-orange-300 text-orange-700'
                >
                  A3: Branch Final
                </Badge>
                <span className='text-sm text-muted-foreground'>
                  ✅ 2 Round 102 winners → 1 match → 1 Branch A Finalist
                </span>
              </div>
              <div className='grid gap-3'>
                {round3Matches.map(match => (
                  <DoubleEliminationMatchCard
                    key={match.id}
                    match={match}
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
              <strong>✅ Branch A Path:</strong> EXCLUSIVELY receives losers
              from Winner's Bracket Round 1 ONLY. No Round 2 losers allowed.
              Winner advances to semifinals. All others eliminated.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
