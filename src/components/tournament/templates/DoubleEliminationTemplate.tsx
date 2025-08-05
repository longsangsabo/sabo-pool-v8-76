import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Users,
  Crown,
  Award,
  RefreshCw,
  CheckCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCompletedTournamentTemplates } from '@/hooks/useCompletedTournamentTemplates';
import { Skeleton } from '@/components/ui/skeleton';
import { TournamentBracket } from '../TournamentBracket';
import { SABODoubleEliminationViewer } from '@/tournaments/sabo/SABODoubleEliminationViewer';

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

interface DoubleEliminationTemplateProps {
  participants: Participant[];
  tournamentId: string;
  tournamentData?: Tournament;
  completedTournamentId?: string;
  isCompletedTemplate?: boolean;
}

export const DoubleEliminationTemplate: React.FC<
  DoubleEliminationTemplateProps
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

  // Load tournament data - either completed or in-progress with bracket data
  useEffect(() => {
    console.log('🔍 [DoubleEliminationTemplate] Debug info:', {
      tournamentId,
      isCompletedTemplate,
      tournamentStatus: tournamentData?.status,
      shouldLoad:
        tournamentId &&
        (isCompletedTemplate || tournamentData?.status === 'in_progress'),
    });

    if (
      tournamentId &&
      (isCompletedTemplate || tournamentData?.status === 'in_progress')
    ) {
      setIsLoading(true);
      console.log(
        '📊 [DoubleEliminationTemplate] Loading bracket data for tournament:',
        tournamentId
      );
      loadTournamentBracketData(tournamentId)
        .then(data => {
          console.log(
            '🏆 [DoubleEliminationTemplate] Loaded tournament data:',
            data
          );
          if (data) {
            setCompletedBracketData(data);
            if (isCompletedTemplate) {
              toast.success(
                `🏆 Dữ liệu giải đấu Double Elimination đã được tải thành công!`
              );
            }
          } else {
            console.warn(
              '⚠️ [DoubleEliminationTemplate] No bracket data returned'
            );
          }
          setIsLoading(false);
        })
        .catch(error => {
          console.error(
            '❌ [DoubleEliminationTemplate] Error loading data:',
            error
          );
          setIsLoading(false);
        });
    } else {
      console.log('⏭️ [DoubleEliminationTemplate] Skipping bracket data load');
    }
  }, [tournamentId, isCompletedTemplate, tournamentData?.status]);

  // Process matches and participants data for display
  const {
    winnerBracketMatches,
    loserBracketMatches,
    semifinalMatches,
    finalMatches,
    displayParticipants,
    bracketSize,
  } = useMemo(() => {
    if (
      completedBracketData &&
      (isCompletedTemplate || tournamentData?.status === 'in_progress')
    ) {
      // Use actual tournament data (completed or in-progress)
      const matches = completedBracketData.matches || [];

      // SABO_REBUILD: Group matches by SABO bracket types
      const winnerMatches = matches.filter(
        (m: any) => m.bracket_type === 'winners' || !m.bracket_type
      );
      const loserMatches = matches.filter(
        (m: any) => m.bracket_type === 'losers'
      );
      const semifinalMatches = matches.filter(
        (m: any) => m.bracket_type === 'semifinals'
      );
      const finalMatches = matches.filter(
        (m: any) => m.bracket_type === 'finals'
      );

      const participantCount =
        completedBracketData.participants?.length || participants.length;
      const size = Math.max(
        8,
        Math.min(32, Math.pow(2, Math.ceil(Math.log2(participantCount))))
      );

      return {
        winnerBracketMatches: winnerMatches,
        loserBracketMatches: loserMatches,
        semifinalMatches: semifinalMatches,
        finalMatches: finalMatches,
        displayParticipants: completedBracketData.participants || participants,
        bracketSize: size,
      };
    } else {
      // Use template participant data for demo
      const participantCount = participants.length;
      const size = Math.max(
        8,
        Math.min(32, Math.pow(2, Math.ceil(Math.log2(participantCount || 8))))
      );

      return {
        winnerBracketMatches: [],
        loserBracketMatches: [],
        semifinalMatches: [],
        finalMatches: [],
        displayParticipants: participants,
        bracketSize: size,
      };
    }
  }, [isCompletedTemplate, completedBracketData, participants]);

  // Group matches by round for TraditionalBracket component
  const groupMatchesByRound = (matches: any[]) => {
    const byRound: { [round: number]: any[] } = {};
    matches.forEach((match: any) => {
      if (!byRound[match.round_number]) {
        byRound[match.round_number] = [];
      }
      byRound[match.round_number].push(match);
    });
    return byRound;
  };

  // Mock functions for template mode
  const mockFunctions = {
    matchScores: {},
    isSubmittingScore: {},
    updateMatchScore: () => {},
    submitMatchScore: () => {},
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
              <Loader2 className='h-8 w-8 animate-spin text-purple-500' />
              <span className='ml-2 text-sm text-gray-600'>
                Đang tải dữ liệu giải đấu Double Elimination...
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
        className={`${isCompletedTemplate ? 'border-blue-200 bg-blue-50/50' : 'border-purple-200 bg-purple-50/50'}`}
      >
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-lg'>
            {isCompletedTemplate ? (
              <CheckCircle className='h-5 w-5 text-blue-600' />
            ) : (
              <Crown className='h-5 w-5 text-purple-600' />
            )}
            {isCompletedTemplate ? (
              <>
                🏆 Giải đấu đã hoàn thành - Double Elimination ({bracketSize}{' '}
                người)
              </>
            ) : (
              <>Double Elimination Template ({bracketSize} người)</>
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
                className={`h-4 w-4 ${isCompletedTemplate ? 'text-blue-600' : 'text-purple-600'}`}
              />
              <span>
                Participants: {displayParticipants.length}/{bracketSize}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <Trophy
                className={`h-4 w-4 ${isCompletedTemplate ? 'text-blue-600' : 'text-purple-600'}`}
              />
              <span>Type: Double Elimination</span>
            </div>
            <div className='flex items-center gap-2'>
              <Crown
                className={`h-4 w-4 ${isCompletedTemplate ? 'text-blue-600' : 'text-purple-600'}`}
              />
              <span>2 Lives Per Player</span>
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
                📊 Thống kê Double Elimination
              </h4>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                <div>
                  <span className='font-medium'>Winner Bracket:</span>
                  <br />
                  <span className='text-blue-700'>
                    {winnerBracketMatches.length} trận
                  </span>
                </div>
                <div>
                  <span className='font-medium'>Loser Bracket:</span>
                  <br />
                  <span className='text-blue-700'>
                    {loserBracketMatches.length} trận
                  </span>
                </div>
                <div>
                  <span className='font-medium'>Champion:</span>
                  <br />
                  <span className='text-blue-700'>
                    {completedBracketData.final_standings?.[0]?.player_name ||
                      'TBD'}
                  </span>
                </div>
                <div>
                  <span className='font-medium'>Runner-up:</span>
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
                gia thực tế. Double Elimination cần {bracketSize} vị trí để có
                cấu trúc chuẩn.
              </p>
            </div>
          )}

          {isCompletedTemplate ? (
            <div className='mt-3 p-3 bg-green-50 border border-green-200 rounded-lg'>
              <div className='flex items-center justify-between'>
                <p className='text-sm text-green-800'>
                  ✅ Hiển thị kết quả thực tế từ giải đấu Double Elimination đã
                  hoàn thành
                </p>
                <Badge variant='secondary' className='text-xs'>
                  Live Data
                </Badge>
              </div>
            </div>
          ) : (
            <div className='mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <p className='text-sm text-blue-800'>
                💡 Double Elimination cho phép mỗi người chơi thua 1 lần trước
                khi bị loại
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bracket Visualization */}
      {tournamentId ? (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Crown className='h-5 w-5 text-purple-600' />
              Double Elimination Bracket
              {!isCompletedTemplate && (
                <Badge variant='outline' className='ml-2 text-xs'>
                  Enhanced System
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SABODoubleEliminationViewer
              tournamentId={tournamentId}
              isClubOwner={!isCompletedTemplate}
              isTemplate={!isCompletedTemplate}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Crown className='h-5 w-5' />
              Double Elimination Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-center py-12'>
              <Crown className='h-16 w-16 mx-auto text-gray-400 mb-4' />
              <h3 className='text-lg font-semibold text-gray-600 mb-2'>
                Double Elimination Template Sẵn sàng
              </h3>
              <p className='text-sm text-gray-500 max-w-md mx-auto'>
                {isCompletedTemplate
                  ? 'Đang tải dữ liệu giải đấu Double Elimination đã hoàn thành...'
                  : 'Template phức tạp với Winner Bracket và Loser Bracket cho cơ hội thứ hai.'}
              </p>
              {!isCompletedTemplate && (
                <div className='mt-6 space-y-2'>
                  <div className='text-sm text-gray-600'>
                    🏆 Winner Bracket: Đường thắng chính
                  </div>
                  <div className='text-sm text-gray-600'>
                    🥈 Loser Bracket: Cơ hội phục hồi
                  </div>
                  <div className='text-sm text-gray-600'>
                    👑 Grand Final: Cuộc đối đầu cuối cùng
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

export default DoubleEliminationTemplate;
