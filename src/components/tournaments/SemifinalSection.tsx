import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Crown, Users, Target } from 'lucide-react';
import { TournamentMatch } from '@/hooks/useTournamentMatches';
import { DoubleEliminationMatchCard } from '../tournament/DoubleEliminationMatchCard';

interface SemifinalSectionProps {
  matches: TournamentMatch[];
  isClubOwner: boolean;
  tournamentId: string;
  currentUserId?: string;
}

export const SemifinalSection: React.FC<SemifinalSectionProps> = ({
  matches,
  isClubOwner,
  tournamentId,
  currentUserId,
}) => {
  // Filter semifinal matches - support both old and V9 systems
  const semifinalMatches = matches
    .filter(
      match =>
        // V9 system: round 250
        (match.round_number === 250 ||
          // Old system: match_stage indicates semifinals
          match.match_stage === 'semifinal' ||
          match.match_stage === 'semifinals') &&
        match.bracket_type !== 'losers' &&
        !match.is_third_place_match
    )
    .sort((a, b) => a.match_number - b.match_number);

  const completedMatches = semifinalMatches.filter(
    match => match.status === 'completed'
  ).length;
  const totalMatches = semifinalMatches.length;

  return (
    <Card className='border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Zap className='h-5 w-5 text-blue-600' />
            Semifinal Round
            <Badge variant='outline' className='ml-2 border-blue-300'>
              {completedMatches}/{totalMatches} completed
            </Badge>
          </CardTitle>
          <div className='flex items-center gap-1'>
            <Crown className='h-4 w-4 text-blue-600' />
            <Users className='h-4 w-4 text-orange-600' />
            <Target className='h-4 w-4 text-purple-600' />
          </div>
        </div>
        <p className='text-sm text-muted-foreground'>
          4 finalists compete in 2 semifinal matches → 2 advance to final
        </p>
      </CardHeader>
      <CardContent>
        <div className='grid gap-6'>
          {/* Semifinal Matches */}
          <div>
            <div className='flex items-center gap-2 mb-3'>
              <Badge
                variant='outline'
                className='border-blue-300 text-blue-700'
              >
                R250: Semifinals
              </Badge>
              <span className='text-sm text-muted-foreground'>
                4 finalists → 2 matches → 2 advance to final
              </span>
            </div>
            {semifinalMatches.length === 0 ? (
              <div className='text-center p-4 text-muted-foreground'>
                Waiting for branch finalists to complete...
              </div>
            ) : (
              <div className='grid gap-3 md:grid-cols-2'>
                {semifinalMatches.map((match, index) => (
                  <DoubleEliminationMatchCard
                    key={match.id}
                    match={match}
                    isClubOwner={isClubOwner}
                    tournamentId={tournamentId}
                    currentUserId={currentUserId}
                    showLoserDestination='Eliminated'
                    highlightWinner={true}
                    variant='blue'
                    title={`Semifinal ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Semifinals Explanation */}
          <div className='mt-4 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200'>
            <h4 className='font-semibold text-blue-800 dark:text-blue-200 mb-2'>
              Semifinal Composition
            </h4>
            <div className='grid md:grid-cols-2 gap-3 text-xs text-blue-700 dark:text-blue-300'>
              <div className='flex items-center gap-2'>
                <Crown className='h-3 w-3' />
                <span>2 finalists from Winner's Bracket</span>
              </div>
              <div className='flex items-center gap-2'>
                <Users className='h-3 w-3' />
                <span>1 finalist from Loser's Branch A</span>
              </div>
              <div className='flex items-center gap-2'>
                <Target className='h-3 w-3' />
                <span>1 finalist from Loser's Branch B</span>
              </div>
              <div className='flex items-center gap-2'>
                <Zap className='h-3 w-3' />
                <span>Winners advance to final</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
