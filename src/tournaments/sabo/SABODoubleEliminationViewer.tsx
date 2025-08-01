import React, { useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Target, Zap, RefreshCw, Wrench } from 'lucide-react';
import { SABOLogicCore } from './SABOLogicCore';
import { useSABOTournamentMatches } from './hooks/useSABOTournamentMatches';
import { useSABOScoreSubmission } from './hooks/useSABOScoreSubmission';
import { useSABOTournamentProgress } from './hooks/useSABOTournamentProgress';
import { SABOWinnersBracket } from './components/SABOWinnersBracket';
import { SABOLosersBranchA } from './components/SABOLosersBranchA';
import { SABOLosersBranchB } from './components/SABOLosersBranchB';
import { SABOSemifinals } from './components/SABOSemifinals';
import { SABOFinal } from './components/SABOFinal';
import { SABOTournamentProgress } from './components/SABOTournamentProgress';
import { useAuth } from '@/hooks/useAuth';

interface SABODoubleEliminationViewerProps {
  tournamentId: string;
  isClubOwner?: boolean;
  adminMode?: boolean;
  isTemplate?: boolean;
}

export const SABODoubleEliminationViewer: React.FC<
  SABODoubleEliminationViewerProps
> = ({
  tournamentId,
  isClubOwner = false,
  adminMode = false,
  isTemplate = false,
}) => {
  // Get tournament data first
  const {
    data: matches,
    isLoading,
    refresh,
  } = useSABOTournamentMatches(tournamentId);

  // Scroll position preservation
  const scrollPositionRef = useRef<number>(0);

  // Custom refresh function that preserves scroll position
  const refreshWithScrollPreservation = useCallback(() => {
    // Save current scroll position
    scrollPositionRef.current = window.scrollY;
    console.log('🔄 Saving scroll position:', scrollPositionRef.current);

    refresh();

    // Multiple attempts to restore scroll position
    const restoreScrollPosition = () => {
      const targetPosition = scrollPositionRef.current;
      window.scrollTo({ top: targetPosition, behavior: 'instant' });
      console.log('📍 Restored scroll position to:', targetPosition);
    };

    // Immediate restore
    setTimeout(restoreScrollPosition, 50);
    // Backup restore after DOM updates
    setTimeout(restoreScrollPosition, 200);
    // Final restore after all real-time updates
    setTimeout(restoreScrollPosition, 500);
  }, [refresh]);

  const { submitScore } = useSABOScoreSubmission(
    tournamentId,
    refreshWithScrollPreservation
  );
  const progress = useSABOTournamentProgress(tournamentId);

  const { user } = useAuth();
  const currentUserId = user?.id;
  const isOwnerOrAdmin = isClubOwner || adminMode;

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
        <span className='ml-2'>Loading SABO tournament bracket...</span>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <Card>
        <CardContent className='p-6'>
          <p className='text-muted-foreground'>
            No matches found for this tournament.
          </p>
        </CardContent>
      </Card>
    );
  }

  // USE SABO CORE LOGIC - NO MANUAL FILTERING
  const organizedMatches = SABOLogicCore.organizeMatches(matches);
  const saboValidation = SABOLogicCore.validateSABOStructure(matches);
  const saboProgress = SABOLogicCore.getTournamentProgress(matches);

  const handleScoreSubmit = async (
    matchId: string,
    scores: { player1: number; player2: number }
  ) => {
    await submitScore(matchId, scores);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage === 100)
      return 'bg-green-500/20 text-green-700 border-green-200';
    if (percentage > 50) return 'bg-blue-500/20 text-blue-700 border-blue-200';
    return 'bg-gray-500/20 text-gray-700 border-gray-200';
  };

  return (
    <div className='sabo-tournament-container space-y-6'>
      {/* Tournament Progress Header */}
      <Card className='bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2'>
              <Trophy className='h-5 w-5 text-primary' />
              SABO Double Elimination (27 Matches)
              {!saboValidation.valid && (
                <Badge variant='destructive' className='ml-2'>
                  Structure Issues
                </Badge>
              )}
            </CardTitle>
            <div className='flex items-center gap-2'>
              {isOwnerOrAdmin && !isTemplate && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => refreshWithScrollPreservation()}
                  className='flex items-center gap-1'
                >
                  <Wrench className='h-4 w-4' />
                  Repair
                </Button>
              )}
              <Button
                variant='outline'
                size='sm'
                onClick={() => refreshWithScrollPreservation()}
                className='flex items-center gap-1'
              >
                <RefreshCw className='h-4 w-4' />
                Refresh
              </Button>
              <Badge
                variant='outline'
                className={getStatusColor(saboProgress.progressPercentage)}
              >
                {saboProgress.progressPercentage}% Complete
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='flex items-center gap-2'>
              <Users className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>16 participants</span>
            </div>
            <div className='flex items-center gap-2'>
              <Target className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>
                {saboProgress.completedMatches}/{saboProgress.totalMatches}{' '}
                matches
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <Zap className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>SABO Structure</span>
            </div>
            <div className='flex items-center gap-2'>
              <Trophy className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>{saboProgress.currentStage}</span>
            </div>
          </div>

          {/* Tournament Progress Component */}
          <SABOTournamentProgress matches={matches || []} />
        </CardContent>
      </Card>

      {/* SABO Validation Errors */}
      {!saboValidation.valid && (
        <Card className='border-destructive'>
          <CardHeader>
            <CardTitle className='text-destructive'>
              Structure Validation Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className='list-disc list-inside space-y-1'>
              {saboValidation.errors.map((error, index) => (
                <li key={index} className='text-sm text-destructive'>
                  {error}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Winners Bracket */}
      <section className='winners-bracket'>
        <div className='mb-4'>
          <h2 className='text-xl font-bold flex items-center gap-2'>
            <Trophy className='h-5 w-5 text-yellow-500' />
            Winners Bracket (16→8→4→2)
          </h2>
          <p className='text-sm text-muted-foreground'>
            Winners advance directly. Losers drop to Losers Bracket.
          </p>
        </div>
        <SABOWinnersBracket
          matches={organizedMatches.winners}
          onScoreSubmit={handleScoreSubmit}
          isClubOwner={isOwnerOrAdmin}
          tournamentId={tournamentId}
          currentUserId={currentUserId}
        />
      </section>

      {/* Losers Brackets */}
      <section className='losers-brackets'>
        <div className='mb-4'>
          <h2 className='text-xl font-bold flex items-center gap-2'>
            <Target className='h-5 w-5 text-orange-500' />
            Losers Brackets (Second Chance)
          </h2>
          <p className='text-sm text-muted-foreground'>
            Two separate branches for players eliminated from different Winner's
            rounds.
          </p>
        </div>
        <div className='losers-container grid md:grid-cols-2 gap-6'>
          <div className='branch-a'>
            <SABOLosersBranchA
              matches={organizedMatches.losers_branch_a}
              onScoreSubmit={handleScoreSubmit}
              isClubOwner={isOwnerOrAdmin}
              tournamentId={tournamentId}
              currentUserId={currentUserId}
            />
          </div>

          <div className='branch-b'>
            <SABOLosersBranchB
              matches={organizedMatches.losers_branch_b}
              onScoreSubmit={handleScoreSubmit}
              isClubOwner={isOwnerOrAdmin}
              tournamentId={tournamentId}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      </section>

      {/* Finals Stage */}
      <section className='finals-stage'>
        <div className='mb-4'>
          <h2 className='text-xl font-bold flex items-center gap-2'>
            <Trophy className='h-5 w-5 text-purple-500' />
            Finals Stage (4→2→1)
          </h2>
          <p className='text-sm text-muted-foreground'>
            The ultimate showdown between the best players.
          </p>
        </div>

        {/* Semifinals */}
        <div className='semifinals mb-6'>
          <SABOSemifinals
            matches={organizedMatches.semifinals}
            onScoreSubmit={handleScoreSubmit}
            isClubOwner={isOwnerOrAdmin}
            tournamentId={tournamentId}
            currentUserId={currentUserId}
          />
        </div>

        {/* Final */}
        <div className='final'>
          <SABOFinal
            match={organizedMatches.final[0]}
            onScoreSubmit={handleScoreSubmit}
            isClubOwner={isOwnerOrAdmin}
            tournamentId={tournamentId}
            currentUserId={currentUserId}
          />
        </div>
      </section>

      {/* SABO Logic Explanation */}
      <Card className='border-muted'>
        <CardHeader>
          <CardTitle className='text-lg'>SABO Tournament Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid md:grid-cols-3 gap-4 text-sm'>
            <div>
              <h4 className='font-semibold mb-2 text-yellow-600'>
                Winners Bracket (14 matches)
              </h4>
              <p className='text-muted-foreground'>
                Rounds 1-3: 8+4+2 matches. Winners advance, losers drop to
                appropriate Losers Branch.
              </p>
            </div>
            <div>
              <h4 className='font-semibold mb-2 text-orange-600'>
                Losers Brackets (10 matches)
              </h4>
              <p className='text-muted-foreground'>
                Branch A (R1 losers): 4+2+1 matches. Branch B (R2 losers): 2+1
                matches.
              </p>
            </div>
            <div>
              <h4 className='font-semibold mb-2 text-purple-600'>
                Finals (3 matches)
              </h4>
              <p className='text-muted-foreground'>
                Semifinals: 2 WB + 2 LB = 4 players. Final: 2 semifinal winners.
              </p>
            </div>
          </div>

          <div className='mt-4 p-3 bg-muted rounded-lg'>
            <p className='text-xs text-muted-foreground'>
              <strong>SABO Structure:</strong> 27 total matches across 5 stages
              ensuring every player gets adequate chances while maintaining
              competitive balance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
