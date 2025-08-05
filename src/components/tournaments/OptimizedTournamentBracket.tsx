import React, { useState, useEffect, useMemo } from 'react';
import { useTournamentMatches } from '@/hooks/useTournamentMatches';
import { useTournaments } from '@/hooks/useTournaments';
import { BracketRoundSection } from './BracketRoundSection';
import { ScoreInputModal } from './ScoreInputModal';
import { BracketFixButton } from './BracketFixButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Crown, AlertTriangle, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import TournamentCompletionButton from '@/components/tournament/TournamentCompletionButton';
import { autoAdvanceCompletedMatches } from '@/services/tournament/bracketAdvancement';
import { useWinnerAdvancementListener } from '@/hooks/useWinnerAdvancementListener';

interface OptimizedTournamentBracketProps {
  tournamentId: string;
  isClubOwner?: boolean;
  adminMode?: boolean;
}

export const OptimizedTournamentBracket: React.FC<
  OptimizedTournamentBracketProps
> = ({ tournamentId, isClubOwner = false, adminMode = false }) => {
  const { user } = useAuth();
  const { tournaments } = useTournaments();
  const { matches, loading, error, lastUpdateTime, refetch } =
    useTournamentMatches(tournamentId);

  const tournament = tournaments.find(t => t.id === tournamentId);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [needsProgression, setNeedsProgression] = useState(false);

  // Listen for automatic winner advancement
  useWinnerAdvancementListener(tournamentId);

  // Memoized round grouping for better performance
  const rounds = useMemo(() => {
    if (!matches.length) return [];

    const grouped = matches.reduce(
      (acc, match) => {
        const round = match.round_number;
        if (!acc[round]) acc[round] = [];
        acc[round].push(match);
        return acc;
      },
      {} as Record<number, any[]>
    );

    return Object.keys(grouped)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(round => ({
        round: parseInt(round),
        matches: grouped[parseInt(round)].sort(
          (a, b) => a.match_number - b.match_number
        ),
      }));
  }, [matches]);

  const totalRounds =
    rounds.length > 0 ? Math.max(...rounds.map(r => r.round)) : 0;

  // Memoized progression check
  const progressionCheck = useMemo(() => {
    if (!rounds.length) return { hasIssues: false, details: [] };

    const issues: string[] = [];

    for (let i = 0; i < rounds.length - 1; i++) {
      const currentRound = rounds[i];
      const nextRound = rounds[i + 1];

      if (!nextRound) continue;

      const completedInCurrent = currentRound.matches.filter(
        m => m.status === 'completed' && m.winner_id
      );

      const emptyInNext = nextRound.matches.filter(
        m => !m.player1_id || !m.player2_id
      );

      if (completedInCurrent.length > 0 && emptyInNext.length > 0) {
        issues.push(
          `Round ${currentRound.round} -> ${nextRound.round}: ${completedInCurrent.length} completed, ${emptyInNext.length} empty slots`
        );
      }
    }

    return { hasIssues: issues.length > 0, details: issues };
  }, [rounds]);

  // Update progression state when check changes
  useEffect(() => {
    setNeedsProgression(progressionCheck.hasIssues);
    if (progressionCheck.hasIssues) {
      console.log('🔧 Progression issues detected:', progressionCheck.details);
    }
  }, [progressionCheck]);

  // Auto-fix on component mount if needed (with cooldown)
  useEffect(() => {
    if (needsProgression && (isClubOwner || adminMode)) {
      const lastFix = localStorage.getItem(`bracket-fix-${tournamentId}`);
      const now = Date.now();

      // Only auto-fix if not fixed in the last 30 seconds
      if (!lastFix || now - parseInt(lastFix) > 30000) {
        console.log('🔄 Auto-fixing bracket progression...');
        autoAdvanceCompletedMatches(tournamentId);
        localStorage.setItem(`bracket-fix-${tournamentId}`, now.toString());
      }
    }
  }, [needsProgression, tournamentId, isClubOwner, adminMode]);

  const handleScoreUpdate = async () => {
    setSelectedMatch(null);
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

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
        <span className='ml-2'>Đang tải bảng đấu...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className='border-destructive/50'>
        <CardContent className='p-6'>
          <div className='flex items-center gap-2 text-destructive'>
            <AlertTriangle className='w-5 h-5' />
            <span>Lỗi tải bảng đấu: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Performance Status */}
      <Card className='border-accent-blue/30'>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Activity className='w-5 h-5 text-accent-blue' />
              <CardTitle className='text-lg'>Trạng thái Bracket</CardTitle>
            </div>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <span>
                Cập nhật lúc: {lastUpdateTime?.toLocaleTimeString() || 'N/A'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-2'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
            <div>
              <span className='text-muted-foreground'>Tổng số trận:</span>
              <div className='font-semibold'>{matches.length}</div>
            </div>
            <div>
              <span className='text-muted-foreground'>Đã hoàn thành:</span>
              <div className='font-semibold text-green-600'>
                {matches.filter(m => m.status === 'completed').length}
              </div>
            </div>
            <div>
              <span className='text-muted-foreground'>Vòng đấu:</span>
              <div className='font-semibold'>{totalRounds}</div>
            </div>
            <div>
              <span className='text-muted-foreground'>Progression:</span>
              <div
                className={`font-semibold ${needsProgression ? 'text-orange-600' : 'text-green-600'}`}
              >
                {needsProgression ? 'Cần sửa' : 'Ổn định'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
