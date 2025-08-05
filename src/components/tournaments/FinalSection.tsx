import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Crown, Medal } from 'lucide-react';
import { TournamentMatch } from '@/hooks/useTournamentMatches';
import { DoubleEliminationMatchCard } from '../tournament/DoubleEliminationMatchCard';

interface FinalSectionProps {
  matches: TournamentMatch[];
  isClubOwner: boolean;
  tournamentId: string;
  currentUserId?: string;
}

export const FinalSection: React.FC<FinalSectionProps> = ({
  matches,
  isClubOwner,
  tournamentId,
  currentUserId,
}) => {
  // Filter final matches - support both old and V9 systems
  const finalMatches = matches.filter(
    match =>
      // V9 system: round 300
      (match.round_number === 300 ||
        // Old system: match_stage indicates final
        match.match_stage === 'grand_final' ||
        match.match_stage === 'finals' ||
        match.match_stage === 'final') &&
      match.bracket_type !== 'losers' &&
      !match.is_third_place_match
  );
  const finalMatch = finalMatches.find(match => match.match_number === 1);

  if (!finalMatch) {
    return (
      <Card className='border-gold bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-5 w-5 text-yellow-600' />
            Championship Final
            <Badge variant='outline' className='ml-2 border-yellow-300'>
              Awaiting finalists
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground text-center py-4'>
            Final match will be available when semifinals are completed
          </p>
        </CardContent>
      </Card>
    );
  }

  const isCompleted = finalMatch.status === 'completed';
  const winner = finalMatch.winner_id;
  const runnerUp =
    winner === finalMatch.player1_id
      ? finalMatch.player2_id
      : finalMatch.player1_id;

  return (
    <Card className='border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-100 dark:from-yellow-950/30 dark:to-amber-900/30'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-6 w-6 text-yellow-600' />
            Championship Final
            <Badge
              variant='outline'
              className={`ml-2 ${isCompleted ? 'border-green-300 text-green-700' : 'border-yellow-300 text-yellow-700'}`}
            >
              {isCompleted ? 'Completed' : 'In Progress'}
            </Badge>
          </CardTitle>
          <div className='flex items-center gap-1'>
            <Crown className='h-5 w-5 text-yellow-600' />
            <Medal className='h-5 w-5 text-yellow-600' />
          </div>
        </div>
        <p className='text-sm text-muted-foreground'>
          2 semifinal winners compete for the championship
        </p>
      </CardHeader>
      <CardContent>
        <div className='grid gap-6'>
          {/* Final Match */}
          <div>
            <div className='flex items-center gap-2 mb-3'>
              <Badge
                variant='outline'
                className='border-yellow-400 text-yellow-700 bg-yellow-50'
              >
                <Trophy className='h-3 w-3 mr-1' />
                Championship Match
              </Badge>
              <span className='text-sm text-muted-foreground'>
                2 semifinal winners compete for the title
              </span>
            </div>
            <div className='max-w-md mx-auto'>
              <DoubleEliminationMatchCard
                match={finalMatch}
                isClubOwner={isClubOwner}
                tournamentId={tournamentId}
                currentUserId={currentUserId}
                showLoserDestination='Runner-up'
                highlightWinner={true}
                variant='gold'
                title='Championship Final'
              />
            </div>
          </div>

          {/* Results Display */}
          {isCompleted && winner && (
            <div className='mt-4 p-6 bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40 rounded-lg border-2 border-yellow-300'>
              <div className='text-center'>
                <h3 className='text-lg font-bold text-yellow-800 dark:text-yellow-200 mb-4 flex items-center justify-center gap-2'>
                  <Crown className='h-5 w-5' />
                  Tournament Results
                  <Crown className='h-5 w-5' />
                </h3>

                <div className='grid md:grid-cols-2 gap-4'>
                  {/* Champion */}
                  <div className='p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-yellow-400 shadow-lg'>
                    <div className='flex items-center justify-center gap-2 mb-2'>
                      <Trophy className='h-6 w-6 text-yellow-600' />
                      <span className='font-bold text-yellow-800 dark:text-yellow-200'>
                        CHAMPION
                      </span>
                    </div>
                    <div className='text-center'>
                      <p className='font-semibold'>
                        {winner === finalMatch.player1_id
                          ? finalMatch.player1?.full_name ||
                            finalMatch.player1?.display_name ||
                            'Player 1'
                          : finalMatch.player2?.full_name ||
                            finalMatch.player2?.display_name ||
                            'Player 2'}
                      </p>
                      <div className='text-sm text-muted-foreground mt-1'>
                        Score:{' '}
                        {winner === finalMatch.player1_id
                          ? finalMatch.score_player1
                          : finalMatch.score_player2}
                      </div>
                    </div>
                  </div>

                  {/* Runner-up */}
                  <div className='p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 shadow-lg'>
                    <div className='flex items-center justify-center gap-2 mb-2'>
                      <Medal className='h-6 w-6 text-gray-500' />
                      <span className='font-bold text-gray-700 dark:text-gray-300'>
                        RUNNER-UP
                      </span>
                    </div>
                    <div className='text-center'>
                      <p className='font-semibold'>
                        {runnerUp === finalMatch.player1_id
                          ? finalMatch.player1?.full_name ||
                            finalMatch.player1?.display_name ||
                            'Player 1'
                          : finalMatch.player2?.full_name ||
                            finalMatch.player2?.display_name ||
                            'Player 2'}
                      </p>
                      <div className='text-sm text-muted-foreground mt-1'>
                        Score:{' '}
                        {runnerUp === finalMatch.player1_id
                          ? finalMatch.score_player1
                          : finalMatch.score_player2}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Final Explanation */}
          <div className='mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-200'>
            <p className='text-xs text-muted-foreground text-center'>
              <strong>Championship Final (R300):</strong> Single elimination
              final between 2 semifinal winners. Winner becomes champion, loser
              becomes runner-up. No reset needed.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
