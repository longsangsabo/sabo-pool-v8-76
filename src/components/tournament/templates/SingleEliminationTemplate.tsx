import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Users,
  RefreshCw,
  CheckCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCompletedTournamentTemplates } from '@/hooks/useCompletedTournamentTemplates';
import { Skeleton } from '@/components/ui/skeleton';
import { TournamentBracket } from '../TournamentBracket';
import { supabase } from '@/integrations/supabase/client';

interface Participant {
  id: string;
  name: string;
  displayName: string;
  rank: string;
  avatarUrl?: string;
  elo: number;
}

interface Tournament {
  id: string;
  name: string;
  status: string;
  tournament_type: string;
}

interface SingleEliminationTemplateProps {
  participants: Participant[];
  tournamentId: string;
  tournamentData?: Tournament;
  completedTournamentId?: string;
  isCompletedTemplate?: boolean;
}

export const SingleEliminationTemplate: React.FC<
  SingleEliminationTemplateProps
> = ({
  participants,
  tournamentId,
  tournamentData,
  completedTournamentId,
  isCompletedTemplate = false,
}) => {
  // Completed tournament data integration
  const { loadTournamentBracketData, convertToTemplateFormat, isConnected } =
    useCompletedTournamentTemplates();

  const [completedBracketData, setCompletedBracketData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [liveBracketData, setLiveBracketData] = useState<any>(null);

  // Load live tournament matches for ongoing tournaments
  useEffect(() => {
    if (!isCompletedTemplate && tournamentId) {
      const loadLiveBracketData = async () => {
        setIsLoading(true);
        try {
          const { data: matches, error } = await supabase
            .from('tournament_matches')
            .select(
              `
              id,
              round_number,
              match_number,
              player1_id,
              player2_id,
              status,
              winner_id,
              score_player1,
              score_player2,
              player1:profiles!tournament_matches_player1_id_fkey(full_name, display_name, avatar_url),
              player2:profiles!tournament_matches_player2_id_fkey(full_name, display_name, avatar_url)
            `
            )
            .eq('tournament_id', tournamentId)
            .order('round_number')
            .order('match_number');

          if (error) throw error;

          if (matches && matches.length > 0) {
            console.log(
              '🏆 [SingleEliminationTemplate] Loaded live tournament matches:',
              matches
            );
            setLiveBracketData({ matches });
            toast.success(`🏆 Tải sơ đồ giải đấu thành công!`);
          }
        } catch (error) {
          console.error(
            '❌ [SingleEliminationTemplate] Error loading live bracket:',
            error
          );
        } finally {
          setIsLoading(false);
        }
      };

      loadLiveBracketData();
    }
  }, [tournamentId, isCompletedTemplate]);

  // Load completed tournament data when completedTournamentId changes
  useEffect(() => {
    if (isCompletedTemplate && completedTournamentId) {
      setIsLoading(true);
      loadTournamentBracketData(completedTournamentId)
        .then(data => {
          if (data) {
            console.log(
              '🏆 [SingleEliminationTemplate] Loaded completed tournament data:',
              data
            );
            setCompletedBracketData(data);
            toast.success(
              `🏆 Dữ liệu giải đấu đã hoàn thành được tải thành công!`
            );
          }
          setIsLoading(false);
        })
        .catch(error => {
          console.error(
            '❌ [SingleEliminationTemplate] Error loading data:',
            error
          );
          setIsLoading(false);
        });
    }
  }, [completedTournamentId, isCompletedTemplate]);

  // Generate demo matches for template mode
  const generateDemoMatches = (
    participantList: Participant[],
    bracketSize: number
  ) => {
    const matches: any[] = [];
    const matchesByRound: { [round: number]: any[] } = {};
    const totalRounds = Math.ceil(Math.log2(bracketSize));

    // Prepare participants - pad with "TBD" if needed
    const paddedParticipants = [...participantList];
    while (paddedParticipants.length < bracketSize) {
      paddedParticipants.push({
        id: `tbd-${paddedParticipants.length}`,
        name: 'TBD',
        displayName: 'TBD',
        rank: 'TBD',
        elo: 0,
      });
    }

    // Generate matches for each round
    let currentParticipants = [...paddedParticipants];
    let matchId = 1;

    for (let round = 1; round <= totalRounds; round++) {
      const roundMatches: any[] = [];
      const matchesInRound = currentParticipants.length / 2;

      for (let matchNum = 1; matchNum <= matchesInRound; matchNum++) {
        const player1 = currentParticipants[(matchNum - 1) * 2];
        const player2 = currentParticipants[(matchNum - 1) * 2 + 1];

        const match = {
          id: `demo-match-${matchId}`,
          round_number: round,
          match_number: matchNum,
          player1_id: player1.id,
          player2_id: player2.id,
          score_player1: 0,
          score_player2: 0,
          status: 'scheduled',
          winner_id: null,
          player1: {
            full_name: player1.name,
            display_name: player1.displayName,
            avatar_url: player1.avatarUrl,
          },
          player2: {
            full_name: player2.name,
            display_name: player2.displayName,
            avatar_url: player2.avatarUrl,
          },
        };

        matches.push(match);
        roundMatches.push(match);
        matchId++;
      }

      matchesByRound[round] = roundMatches;

      // Prepare for next round (winners advance)
      currentParticipants = roundMatches.map(match => match.player1); // In demo, player1 "advances"
    }

    return { matches, matchesByRound };
  };

  // Process matches and participants data for display
  const { processedMatches, matchesByRound, displayParticipants, bracketSize } =
    useMemo(() => {
      if (isCompletedTemplate && completedBracketData) {
        // Use actual completed tournament data
        const matches = completedBracketData.matches || [];

        // Group matches by round
        const byRound: { [round: number]: any[] } = {};
        matches.forEach((match: any) => {
          if (!byRound[match.round_number]) {
            byRound[match.round_number] = [];
          }
          byRound[match.round_number].push(match);
        });

        const participantCount =
          completedBracketData.participants?.length || participants.length;
        const size = Math.max(
          8,
          Math.min(32, Math.pow(2, Math.ceil(Math.log2(participantCount))))
        );

        return {
          processedMatches: matches,
          matchesByRound: byRound,
          displayParticipants:
            completedBracketData.participants || participants,
          bracketSize: size,
        };
      } else if (!isCompletedTemplate && liveBracketData?.matches) {
        // Use live tournament bracket data
        const matches = liveBracketData.matches || [];

        // Group matches by round
        const byRound: { [round: number]: any[] } = {};
        matches.forEach((match: any) => {
          if (!byRound[match.round_number]) {
            byRound[match.round_number] = [];
          }
          byRound[match.round_number].push(match);
        });

        const participantCount = participants.length;
        const size = Math.max(
          8,
          Math.min(32, Math.pow(2, Math.ceil(Math.log2(participantCount || 8))))
        );

        return {
          processedMatches: matches,
          matchesByRound: byRound,
          displayParticipants: participants,
          bracketSize: size,
        };
      } else {
        // Generate demo bracket for template mode
        const participantCount = participants.length || 8;
        const size = Math.max(
          8,
          Math.min(32, Math.pow(2, Math.ceil(Math.log2(participantCount))))
        );

        const { matches, matchesByRound: demoRounds } = generateDemoMatches(
          participants,
          size
        );

        return {
          processedMatches: matches,
          matchesByRound: demoRounds,
          displayParticipants: participants,
          bracketSize: size,
        };
      }
    }, [
      isCompletedTemplate,
      completedBracketData,
      liveBracketData,
      participants,
    ]);

  // Score management for live tournaments
  const [matchScores, setMatchScores] = useState<{
    [key: string]: { player1: number; player2: number };
  }>({});
  const [isSubmittingScore, setIsSubmittingScore] = useState<{
    [key: string]: boolean;
  }>({});

  const updateMatchScore = (
    matchId: string,
    player: 'player1' | 'player2',
    value: string
  ) => {
    const numValue = parseInt(value) || 0;
    setMatchScores(prev => ({
      ...prev,
      [matchId]: {
        player1: player === 'player1' ? numValue : prev[matchId]?.player1 || 0,
        player2: player === 'player2' ? numValue : prev[matchId]?.player2 || 0,
      },
    }));
  };

  const submitMatchScore = async (matchId: string) => {
    if (isCompletedTemplate) return;

    const scores = matchScores[matchId] || { player1: 0, player2: 0 };

    // Don't allow ties
    if (scores.player1 === scores.player2) {
      toast.error('Tỷ số không được hòa');
      return;
    }

    // Allow all positive scores
    if (scores.player1 < 0 || scores.player2 < 0) {
      toast.error('Tỷ số không được âm');
      return;
    }

    setIsSubmittingScore(prev => ({ ...prev, [matchId]: true }));

    try {
      // Debug logging
      console.log('🔍 Debug match score submission:', {
        matchId,
        scores,
        matchScores: matchScores[matchId],
        isCompletedTemplate,
        player1Type: typeof scores.player1,
        player2Type: typeof scores.player2,
      });

      // Validation
      if (
        !matchId ||
        typeof scores.player1 !== 'number' ||
        typeof scores.player2 !== 'number'
      ) {
        console.error('❌ Validation failed:', {
          matchId: !!matchId,
          player1: { value: scores.player1, type: typeof scores.player1 },
          player2: { value: scores.player2, type: typeof scores.player2 },
        });
        throw new Error('Invalid match data or scores');
      }

      // Find the match safely
      const match = liveBracketData?.matches.find((m: any) => m.id === matchId);
      if (!match) {
        throw new Error('Match not found in bracket data');
      }

      console.log('🎯 Using emergency completion function for match:', {
        matchId,
        scores,
        match: { player1_id: match.player1_id, player2_id: match.player2_id },
      });

      // Use emergency completion function instead of direct update
      const { data, error } = await supabase.rpc(
        'emergency_complete_tournament_match',
        {
          p_match_id: matchId,
          p_winner_id:
            scores.player1 > scores.player2
              ? match.player1_id
              : match.player2_id,
        }
      );

      if (error) {
        console.error('❌ Emergency completion error:', error);
        throw error;
      }

      const result = data as any;

      if (result?.success) {
        console.log('✅ Match completed successfully:', result);
        toast.success(result.message || 'Cập nhật tỷ số thành công!');

        if (result.tournament_completed) {
          toast.success('🏆 Giải đấu đã hoàn thành!', { duration: 5000 });
        }

        // Clear the score inputs after successful submission
        setMatchScores(prev => ({
          ...prev,
          [matchId]: { player1: 0, player2: 0 },
        }));

        // Reload live bracket data to show updated results
        if (!isCompletedTemplate && tournamentId) {
          const { data: matches } = await supabase
            .from('tournament_matches')
            .select(
              `
              id,
              round_number,
              match_number,
              player1_id,
              player2_id,
              status,
              winner_id,
              score_player1,
              score_player2,
              player1:profiles!tournament_matches_player1_id_fkey(full_name, display_name, avatar_url),
              player2:profiles!tournament_matches_player2_id_fkey(full_name, display_name, avatar_url)
            `
            )
            .eq('tournament_id', tournamentId)
            .order('round_number')
            .order('match_number');

          if (matches) {
            setLiveBracketData({ matches });
          }
        }
      } else {
        throw new Error(result?.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('❌ Error updating match score:', error);
      toast.error('Lỗi khi cập nhật tỷ số: ' + (error as any)?.message);
    } finally {
      setIsSubmittingScore(prev => ({ ...prev, [matchId]: false }));
    }
  };

  // Functions to pass to TraditionalBracket
  const bracketFunctions = {
    matchScores,
    isSubmittingScore,
    updateMatchScore,
    submitMatchScore,
  };

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-6 w-64' />
              <Skeleton className='h-4 w-24' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='h-8 w-8 animate-spin text-blue-500' />
              <span className='ml-2 text-sm text-gray-600'>
                Đang tải dữ liệu giải đấu...
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Template Info */}
      <Card
        className={`${isCompletedTemplate ? 'border-blue-200 bg-blue-50/50' : 'border-green-200 bg-green-50/50'}`}
      >
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-lg'>
            {isCompletedTemplate ? (
              <CheckCircle className='h-5 w-5 text-blue-600' />
            ) : (
              <Trophy className='h-5 w-5 text-green-600' />
            )}
            {isCompletedTemplate ? (
              <>
                🏆 Giải đấu đã hoàn thành - Single Elimination ({bracketSize}{' '}
                người)
              </>
            ) : (
              <>Single Elimination Template ({bracketSize} người)</>
            )}
            {isCompletedTemplate && isConnected && (
              <Badge variant='secondary' className='ml-2 text-xs'>
                <Clock className='h-3 w-3 mr-1' />
                Real-time
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 text-sm'>
            <div className='flex items-center gap-2'>
              <Users
                className={`h-4 w-4 ${isCompletedTemplate ? 'text-blue-600' : 'text-green-600'}`}
              />
              <span>
                Participants: {displayParticipants.length}/{bracketSize}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <Trophy
                className={`h-4 w-4 ${isCompletedTemplate ? 'text-blue-600' : 'text-green-600'}`}
              />
              <span>Rounds: {Math.ceil(Math.log2(bracketSize))}</span>
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant='outline' className='text-xs'>
                Total Matches: {bracketSize - 1}
              </Badge>
            </div>
            {isCompletedTemplate && completedBracketData?.results && (
              <div className='flex items-center gap-2'>
                <CheckCircle className='h-4 w-4 text-blue-600' />
                <span>Completed: 100%</span>
              </div>
            )}
          </div>

          {/* Completed Tournament Statistics */}
          {isCompletedTemplate && completedBracketData?.results && (
            <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <h4 className='font-semibold text-blue-800 mb-2'>
                📊 Thống kê giải đấu
              </h4>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                <div>
                  <span className='font-medium'>Tổng trận:</span>
                  <br />
                  <span className='text-blue-700'>
                    {processedMatches.length}
                  </span>
                </div>
                <div>
                  <span className='font-medium'>Hoàn thành:</span>
                  <br />
                  <span className='text-blue-700'>
                    {
                      processedMatches.filter(
                        (m: any) => m.status === 'completed'
                      ).length
                    }
                  </span>
                </div>
                <div>
                  <span className='font-medium'>Người thắng:</span>
                  <br />
                  <span className='text-blue-700'>
                    {completedBracketData.final_standings?.[0]?.player_name ||
                      'TBD'}
                  </span>
                </div>
                <div>
                  <span className='font-medium'>Á quân:</span>
                  <br />
                  <span className='text-blue-700'>
                    {completedBracketData.final_standings?.[1]?.player_name ||
                      'TBD'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!isCompletedTemplate && displayParticipants.length < bracketSize && (
            <div className='mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
              <p className='text-sm text-yellow-800'>
                ⚠️ Template hiển thị với {displayParticipants.length} người tham
                gia thực tế. Bracket được điều chỉnh cho {bracketSize} vị trí
                với dữ liệu thật thay vì "TBD".
              </p>
            </div>
          )}

          {isCompletedTemplate ? (
            <div className='mt-3 p-3 bg-green-50 border border-green-200 rounded-lg'>
              <div className='flex items-center justify-between'>
                <p className='text-sm text-green-800'>
                  ✅ Hiển thị kết quả thực tế từ giải đấu đã hoàn thành
                </p>
                <Badge variant='secondary' className='text-xs'>
                  Live Data
                </Badge>
              </div>
            </div>
          ) : (
            <div className='mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <p className='text-sm text-blue-800'>
                💡 Đây là template minh họa cho Single Elimination bracket
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bracket Visualization */}
      {processedMatches.length > 0 || tournamentId ? (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Trophy className='h-5 w-5' />
              {isCompletedTemplate
                ? 'Sơ đồ Single Elimination - Kết quả thực tế'
                : 'Sơ đồ Single Elimination - Đang diễn ra'}
              {!isCompletedTemplate && (
                <Badge variant='outline' className='ml-2 text-xs'>
                  Live Update
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TournamentBracket
              tournamentId={tournamentId}
              adminMode={!isCompletedTemplate}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Trophy className='h-5 w-5' />
              Single Elimination Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-center py-12'>
              <Trophy className='h-16 w-16 mx-auto text-gray-400 mb-4' />
              <h3 className='text-lg font-semibold text-gray-600 mb-2'>
                Bracket Template Sẵn sàng
              </h3>
              <p className='text-sm text-gray-500 max-w-md mx-auto'>
                {isCompletedTemplate
                  ? 'Đang tải dữ liệu giải đấu đã hoàn thành...'
                  : 'Đây là template mẫu cho Single Elimination bracket với dữ liệu thật từ người tham gia.'}
              </p>
              {!isCompletedTemplate && (
                <div className='mt-6 space-y-2'>
                  <div className='text-sm text-gray-600'>
                    📊 {displayParticipants.length} người tham gia sẽ được sắp
                    xếp trong bracket {bracketSize} vị trí
                  </div>
                  <div className='text-sm text-gray-600'>
                    🏆 {Math.ceil(Math.log2(bracketSize))} vòng đấu,{' '}
                    {bracketSize - 1} trận tổng cộng
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SingleEliminationTemplate;
