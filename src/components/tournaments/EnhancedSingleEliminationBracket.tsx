import React, { useState, useEffect } from 'react';
import { useTournamentMatches } from '@/hooks/useTournamentMatches';
import { useTournaments } from '@/hooks/useTournaments';
import { BracketRoundSection } from './BracketRoundSection';
import { ScoreInputModal } from './ScoreInputModal';
import { BracketFixButton } from './BracketFixButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Crown, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import TournamentCompletionButton from '@/components/tournament/TournamentCompletionButton';
import { autoAdvanceCompletedMatches } from '@/services/tournament/bracketAdvancement';
import { useWinnerAdvancementListener } from '@/hooks/useWinnerAdvancementListener';
import { TournamentAutomationDashboard } from './automation/TournamentAutomationDashboard';
import { TournamentStateManager } from './automation/TournamentStateManager';

interface EnhancedSingleEliminationBracketProps {
  tournamentId: string;
  isClubOwner?: boolean;
  adminMode?: boolean;
}

export const EnhancedSingleEliminationBracket: React.FC<
  EnhancedSingleEliminationBracketProps
> = ({ tournamentId, isClubOwner = false, adminMode = false }) => {
  const { user } = useAuth();
  const { tournaments } = useTournaments();
  const { matches, loading, error, refetch } =
    useTournamentMatches(tournamentId);

  const tournament = tournaments.find(t => t.id === tournamentId);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [needsProgression, setNeedsProgression] = useState(false);

  // Listen for automatic winner advancement
  useWinnerAdvancementListener(tournamentId);

  // Group matches by rounds function (moved up to fix hoisting issue)
  const groupMatchesByRound = (matchList: any[]) => {
    const grouped = matchList.reduce((acc, match) => {
      const round = match.round_number;
      if (!acc[round]) acc[round] = [];
      acc[round].push(match);
      return acc;
    }, {});

    return Object.keys(grouped)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(round => ({
        round: parseInt(round),
        matches: grouped[round].sort((a, b) => a.match_number - b.match_number),
      }));
  };

  // Check if bracket needs progression fix
  useEffect(() => {
    if (matches.length > 0) {
      let hasProgressionIssues = false;

      // Check all rounds for progression issues
      const roundsData = groupMatchesByRound(matches);

      for (let i = 0; i < roundsData.length - 1; i++) {
        const currentRound = roundsData[i];
        const nextRound = roundsData[i + 1];

        if (!nextRound) continue;

        const completedInCurrent = currentRound.matches.filter(
          m => m.status === 'completed' && m.winner_id
        );

        const emptyInNext = nextRound.matches.filter(
          m => !m.player1_id || !m.player2_id
        );

        if (completedInCurrent.length > 0 && emptyInNext.length > 0) {
          hasProgressionIssues = true;
          console.log(
            `🔧 Round ${currentRound.round} -> ${nextRound.round} needs progression:`,
            {
              completed: completedInCurrent.length,
              emptySlots: emptyInNext.length,
            }
          );
        }
      }

      setNeedsProgression(hasProgressionIssues);
    }
  }, [matches]);

  // Auto-fix on component mount if needed
  useEffect(() => {
    if (needsProgression && (isClubOwner || adminMode)) {
      console.log('🔄 Auto-fixing bracket progression...');
      autoAdvanceCompletedMatches(tournamentId);
    }
  }, [needsProgression, tournamentId, isClubOwner, adminMode]);

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
        <span className='ml-2'>Đang tải bảng đấu...</span>
      </div>
    );
  }
  const rounds = groupMatchesByRound(matches);
  const totalRounds =
    rounds.length > 0 ? Math.max(...rounds.map(r => r.round)) : 0;

  const handleScoreUpdate = async () => {
    setSelectedMatch(null);
    // No need to manually refetch - real-time updates will handle this
    console.log(
      '🎯 Score updated - real-time sync will update bracket automatically'
    );
  };

  const handleMatchClick = (match: any) => {
    if (isClubOwner || adminMode) {
      setSelectedMatch(match);
    }
  };

  const handleBracketFixed = () => {
    setNeedsProgression(false);
    refetch();
  };

  return (
    <div className='space-y-6'>
      {/* Tournament Automation Dashboard */}
      {(isClubOwner || adminMode) && (
        <TournamentAutomationDashboard
          tournamentId={tournamentId}
          isAdmin={isClubOwner || adminMode}
        />
      )}

      {/* Tournament State Manager */}
      {tournament && (isClubOwner || adminMode) && (
        <TournamentStateManager
          tournament={tournament}
          onStateChange={refetch}
          isAdmin={isClubOwner || adminMode}
        />
      )}

      {/* Bracket Header */}
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold flex items-center gap-2'>
          <Trophy className='w-6 h-6 text-accent-blue' />
          Single Elimination Bracket
        </h2>
        <div className='flex items-center gap-2'>
          <Badge
            variant='outline'
            className='text-accent-blue border-accent-blue/30'
          >
            {matches.filter(m => m.status === 'completed').length}/
            {matches.length} Completed
          </Badge>

          {needsProgression && (isClubOwner || adminMode) && (
            <div className='flex items-center gap-2'>
              <Badge variant='destructive' className='gap-1'>
                <AlertTriangle className='w-3 h-3' />
                Cần sửa bracket
              </Badge>
              <BracketFixButton
                tournamentId={tournamentId}
                onFixed={handleBracketFixed}
              />
            </div>
          )}
        </div>
      </div>

      {/* Tournament Rounds */}
      <div className='space-y-6'>
        {rounds.map(({ round, matches }) => {
          const isFirstRound = round === 1;
          const isFinalRound = round === totalRounds;

          return (
            <BracketRoundSection
              key={`round-${round}`}
              title={
                isFinalRound
                  ? 'Chung kết'
                  : round === totalRounds - 1
                    ? 'Bán kết'
                    : round === totalRounds - 2
                      ? 'Tứ kết'
                      : `Vòng ${round}`
              }
              matches={matches}
              isClubOwner={isClubOwner || adminMode}
              onScoreUpdate={handleScoreUpdate}
              onScoreInputOpen={handleMatchClick}
              onMatchClick={handleMatchClick}
              roundNumber={round}
              totalRounds={totalRounds}
              bracketType={isFinalRound ? 'final' : 'winner'}
              tournamentType='single_elimination'
              currentUserId={user?.id}
            />
          );
        })}
      </div>

      {/* Tournament Completion Button */}
      {tournament && (isClubOwner || adminMode) && (
        <div className='flex justify-center pt-6 border-t'>
          <TournamentCompletionButton
            tournamentId={tournamentId}
            tournamentName={tournament.name}
            tournamentStatus={tournament.status}
            onCompleted={refetch}
          />
        </div>
      )}

      {/* Score Input Modal */}
      {selectedMatch && (isClubOwner || adminMode) && (
        <ScoreInputModal
          match={selectedMatch}
          isOpen={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
          tournamentType='single_elimination'
          onSuccess={handleScoreUpdate}
        />
      )}
    </div>
  );
};
