import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Crown } from 'lucide-react';
import { TournamentMatch } from '@/hooks/useTournamentMatches';
import { DoubleEliminationMatchCard } from '../tournament/DoubleEliminationMatchCard';

interface WinnersBracketSectionProps {
  matches: TournamentMatch[];
  isClubOwner: boolean;
  tournamentId: string;
  currentUserId?: string;
}

export const WinnersBracketSection: React.FC<WinnersBracketSectionProps> = ({
  matches,
  isClubOwner,
  tournamentId,
  currentUserId,
}) => {
  // SABO_REBUILD: Filter winners bracket matches - SABO compliance only
  // SABO_REBUILD: NO LONGER SUPPORTING old V9 systems - enforce SABO standards
  const winnersMatches = matches.filter(
    match =>
      match.bracket_type === 'winners' && [1, 2, 3].includes(match.round_number)
  );

  // Only show matches that have players assigned (exclude empty matches)
  const validWinnersMatches = winnersMatches.filter(
    match => match.player1_id || match.player2_id || match.status === 'waiting'
  );

  // SABO_REBUILD: Enforce SABO-only rounds for Winners Bracket (1, 2, 3)
  // NO LONGER SUPPORTING: rounds 101, 102, 103 in winners bracket - SABO compliance
  const round1Matches = validWinnersMatches
    .filter(match => match.round_number === 1)
    .sort((a, b) => a.match_number - b.match_number);

  const round2Matches = validWinnersMatches
    .filter(match => match.round_number === 2)
    .sort((a, b) => a.match_number - b.match_number);

  const round3Matches = validWinnersMatches
    .filter(match => match.round_number === 3)
    .sort((a, b) => a.match_number - b.match_number);

  const completedMatches = validWinnersMatches.filter(
    match => match.status === 'completed'
  ).length;
  const totalMatches = validWinnersMatches.length;

  return (
    <Card className='border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Crown className='h-5 w-5 text-primary' />
            Winner's Bracket
            <Badge variant='outline' className='ml-2'>
              {completedMatches}/{totalMatches} completed
            </Badge>
          </CardTitle>
          <Trophy className='h-6 w-6 text-primary' />
        </div>
        <p className='text-sm text-muted-foreground'>
          Winners advance directly • Losers drop to Loser's Bracket
        </p>
      </CardHeader>
      <CardContent>
        <div className='grid gap-6'>
          {/* Round 1 */}
          <div>
            <div className='flex items-center gap-2 mb-3'>
              <Badge variant='secondary'>Round 1</Badge>
              <span className='text-sm text-muted-foreground'>
                {round1Matches.length} matches • {round1Matches.length * 2} →{' '}
                {round1Matches.length}
              </span>
            </div>
            <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-4'>
              {round1Matches.map(match => (
                <DoubleEliminationMatchCard
                  key={match.id}
                  match={match}
                  isClubOwner={isClubOwner}
                  tournamentId={tournamentId}
                  currentUserId={currentUserId}
                  showLoserDestination="Loser's Branch A"
                />
              ))}
            </div>
          </div>

          {/* Round 2 */}
          {round2Matches.length > 0 && (
            <div>
              <div className='flex items-center gap-2 mb-3'>
                <Badge variant='secondary'>Round 2</Badge>
                <span className='text-sm text-muted-foreground'>
                  {round2Matches.length} matches • {round2Matches.length * 2} →{' '}
                  {round2Matches.length}
                </span>
              </div>
              <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
                {round2Matches.map(match => (
                  <DoubleEliminationMatchCard
                    key={match.id}
                    match={match}
                    isClubOwner={isClubOwner}
                    tournamentId={tournamentId}
                    currentUserId={currentUserId}
                    showLoserDestination="Loser's Branch B"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Round 3 */}
          {round3Matches.length > 0 && (
            <div>
              <div className='flex items-center gap-2 mb-3'>
                <Badge variant='secondary'>Round 3</Badge>
                <span className='text-sm text-muted-foreground'>
                  {round3Matches.length} matches • {round3Matches.length * 2} →{' '}
                  {round3Matches.length}
                </span>
              </div>
              <div className='grid gap-3 md:grid-cols-2'>
                {round3Matches.map(match => (
                  <DoubleEliminationMatchCard
                    key={match.id}
                    match={match}
                    isClubOwner={isClubOwner}
                    tournamentId={tournamentId}
                    currentUserId={currentUserId}
                    showLoserDestination='Eliminated'
                    highlightWinner={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Winner's Bracket Summary */}
          <div className='mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20'>
            <p className='text-xs text-muted-foreground'>
              <strong>Winner's Bracket:</strong> Direct path to semifinals.
              Losers from Round 1 → Branch A, Round 2 → Branch B, Round 3 →
              Eliminated.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
