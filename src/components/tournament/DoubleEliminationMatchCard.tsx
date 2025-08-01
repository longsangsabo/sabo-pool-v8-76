import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Trophy, Edit, Zap, Shield } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import { toast } from 'sonner';
import { MatchStatusDebugInfo } from './MatchStatusDebugInfo';

interface Match {
  id: string;
  round_number: number;
  match_number: number;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  status: string;
  assigned_table_number?: number | null;
  assigned_table_id?: string | null;
  bracket_type?: string;
  branch_type?: string;
  player1?: {
    full_name: string;
    display_name?: string;
    verified_rank?: string;
    ranking_verified_rank?: string;
  };
  player2?: {
    full_name: string;
    display_name?: string;
    verified_rank?: string;
    ranking_verified_rank?: string;
  };
  score_player1?: number;
  score_player2?: number;
  assigned_table?: {
    table_number: number;
    table_name?: string | null;
    status?: string;
  } | null;
  scheduled_time?: string | null;
  score_edited_by?: string | null;
  score_edit_count?: number;
  last_score_edit?: string | null;
}

interface DoubleEliminationMatchCardProps {
  match: Match;
  className?: string;
  isClubOwner?: boolean;
  currentUserId?: string;
  tournamentId?: string;
  showLoserDestination?: string;
  highlightWinner?: boolean;
  variant?: string;
  title?: string;
}

export const DoubleEliminationMatchCard: React.FC<
  DoubleEliminationMatchCardProps
> = ({ match, className = '', isClubOwner = false, currentUserId }) => {
  const [player1Score, setPlayer1Score] = useState<string>(
    match.score_player1?.toString() || ''
  );
  const [player2Score, setPlayer2Score] = useState<string>(
    match.score_player2?.toString() || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enhanced validation for match readiness - allow both scheduled and in_progress
  const isMatchReady =
    (match.status === 'scheduled' || match.status === 'in_progress') &&
    match.player1_id &&
    match.player2_id &&
    match.player1_id !== match.player2_id &&
    !match.winner_id;

  const canInputScore = isClubOwner && isMatchReady;

  const getDisplayScore = (score: number | null | undefined) => {
    return score !== null && score !== undefined ? score.toString() : '0';
  };

  const getPlayerName = (player?: {
    full_name: string;
    display_name?: string;
  }) => {
    if (!player) return 'TBD';
    return player.display_name || player.full_name;
  };

  const getBracketTypeInfo = () => {
    switch (match.bracket_type) {
      case 'winner':
        return {
          icon: <Trophy className='w-3 h-3' />,
          label: 'Winner',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
        };
      case 'loser':
        return {
          icon: <Shield className='w-3 h-3' />,
          label: 'Loser',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
        };
      case 'final':
        return {
          icon: <Crown className='w-3 h-3' />,
          label: 'Final',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
        };
      default:
        return {
          icon: <Zap className='w-3 h-3' />,
          label: '',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/30',
          borderColor: 'border-muted',
        };
    }
  };

  const bracketInfo = getBracketTypeInfo();

  return (
    <Card
      className={`relative border border-border/60 rounded-lg transition-all duration-300 hover:shadow-md hover:border-primary/40 ${className}`}
    >
      <CardContent className='p-4'>
        {/* Compact Header with Bracket Type */}
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-2'>
            <Badge variant='outline' className='px-2 py-1 text-xs font-medium'>
              Trận {match.match_number}
            </Badge>
            {match.bracket_type && (
              <Badge
                variant='outline'
                className={`px-2 py-1 text-xs font-medium ${bracketInfo.color} ${bracketInfo.bgColor} ${bracketInfo.borderColor}`}
              >
                {bracketInfo.icon}
                <span className='ml-1'>{bracketInfo.label}</span>
                {match.branch_type && (
                  <span className='ml-1 text-xs opacity-75'>
                    ({match.branch_type.replace('branch_', '').toUpperCase()})
                  </span>
                )}
              </Badge>
            )}
          </div>

          {(match.assigned_table?.table_number ||
            match.assigned_table_number) && (
            <div className='bg-emerald-500 text-white px-2 py-0.5 rounded-full text-xs font-medium'>
              Bàn{' '}
              {match.assigned_table?.table_number ||
                match.assigned_table_number}
            </div>
          )}
        </div>

        {/* Compact Players Section */}
        <div className='space-y-2'>
          {/* Player 1 */}
          <div
            className={`p-2 rounded-lg border-l-2 ${
              match.player1
                ? 'bg-blue-50/50 border-blue-400'
                : 'bg-muted/30 border-muted-foreground'
            } ${match.winner_id === match.player1_id ? 'ring-1 ring-emerald-400 bg-emerald-50/50' : ''}`}
          >
            <div className='flex items-center gap-2'>
              {match.player1 ? (
                <div className='flex items-center gap-2 flex-1'>
                  <UserAvatar
                    userId={match.player1_id}
                    size='sm'
                    showRank={false}
                    showName={false}
                    className='w-8 h-8'
                  />
                  <div className='flex-1 min-w-0'>
                    <div className='font-medium text-sm truncate flex items-center gap-1'>
                      {match.player1.display_name || match.player1.full_name}
                      <span className='text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-medium'>
                        {match.player1.verified_rank ||
                          match.player1.ranking_verified_rank ||
                          'K'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='flex items-center gap-2'>
                  <div className='w-8 h-8 rounded-full bg-muted border border-dashed border-muted-foreground/30 flex items-center justify-center'>
                    <span className='text-muted-foreground text-xs'>?</span>
                  </div>
                  <span className='text-xs text-muted-foreground'>
                    Chờ kết quả
                  </span>
                </div>
              )}
              {match.winner_id === match.player1_id && (
                <Crown className='w-4 h-4 text-yellow-500' />
              )}
            </div>

            {/* Compact Score Input for Player 1 */}
            {canInputScore && (
              <div className='mt-2 flex items-center gap-2'>
                <span className='text-xs font-medium text-blue-700'>
                  Tỷ số:
                </span>
                <input
                  type='number'
                  min='0'
                  max='50'
                  className='w-16 px-2 py-1 border border-blue-300 rounded text-center text-sm font-medium bg-white focus:outline-none focus:ring-1 focus:ring-blue-500'
                  placeholder='0'
                  value={player1Score}
                  onChange={e => setPlayer1Score(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* VS Divider */}
          <div className='flex items-center justify-center'>
            <div className='bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-medium'>
              VS
            </div>
          </div>

          {/* Player 2 */}
          <div
            className={`p-2 rounded-lg border-l-2 ${
              match.player2
                ? 'bg-purple-50/50 border-purple-400'
                : 'bg-muted/30 border-muted-foreground'
            } ${match.winner_id === match.player2_id ? 'ring-1 ring-emerald-400 bg-emerald-50/50' : ''}`}
          >
            <div className='flex items-center gap-2'>
              {match.player2 ? (
                <div className='flex items-center gap-2 flex-1'>
                  <UserAvatar
                    userId={match.player2_id}
                    size='sm'
                    showRank={false}
                    showName={false}
                    className='w-8 h-8'
                  />
                  <div className='flex-1 min-w-0'>
                    <div className='font-medium text-sm truncate flex items-center gap-1'>
                      {match.player2.display_name || match.player2.full_name}
                      <span className='text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-medium'>
                        {match.player2.verified_rank ||
                          match.player2.ranking_verified_rank ||
                          'K'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='flex items-center gap-2'>
                  <div className='w-8 h-8 rounded-full bg-muted border border-dashed border-muted-foreground/30 flex items-center justify-center'>
                    <span className='text-muted-foreground text-xs'>?</span>
                  </div>
                  <span className='text-xs text-muted-foreground'>
                    Chờ kết quả
                  </span>
                </div>
              )}
              {match.winner_id === match.player2_id && (
                <Crown className='w-4 h-4 text-yellow-500' />
              )}
            </div>

            {/* Compact Score Input for Player 2 */}
            {canInputScore && (
              <div className='mt-2 flex items-center gap-2'>
                <span className='text-xs font-medium text-purple-700'>
                  Tỷ số:
                </span>
                <input
                  type='number'
                  min='0'
                  max='50'
                  className='w-16 px-2 py-1 border border-purple-300 rounded text-center text-sm font-medium bg-white focus:outline-none focus:ring-1 focus:ring-purple-500'
                  placeholder='0'
                  value={player2Score}
                  onChange={e => setPlayer2Score(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Compact Result Box */}
        <div
          className={`mt-3 p-2 rounded border ${
            match.status === 'completed'
              ? 'bg-emerald-50 border-emerald-200'
              : match.status === 'ongoing' || match.status === 'in_progress'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-muted/30 border-muted-foreground/30'
          }`}
        >
          <div className='text-center'>
            <div
              className={`text-sm font-bold ${
                match.status === 'completed'
                  ? 'text-emerald-800'
                  : match.status === 'ongoing' || match.status === 'in_progress'
                    ? 'text-blue-800'
                    : 'text-muted-foreground'
              }`}
            >
              {getDisplayScore(match.score_player1)} -{' '}
              {getDisplayScore(match.score_player2)}
            </div>
            <div
              className={`text-xs ${
                match.status === 'completed'
                  ? 'text-emerald-600'
                  : match.status === 'ongoing' || match.status === 'in_progress'
                    ? 'text-blue-600'
                    : 'text-muted-foreground'
              }`}
            >
              {match.status === 'completed'
                ? 'Đã xác nhận'
                : match.status === 'ongoing' || match.status === 'in_progress'
                  ? 'Đang thi đấu'
                  : 'Chưa bắt đầu'}
            </div>
          </div>
        </div>

        {/* Compact Status Badge */}
        <div className='text-center mt-3'>
          <Badge
            variant={
              match.status === 'completed'
                ? 'default'
                : match.status === 'ongoing'
                  ? 'secondary'
                  : 'outline'
            }
            className='text-xs px-2 py-1'
          >
            {match.status === 'completed'
              ? '🏆 Hoàn thành'
              : match.status === 'ongoing'
                ? '⚡ Đang thi đấu'
                : match.status === 'scheduled'
                  ? '📅 Đã lên lịch'
                  : match.status}
          </Badge>
        </div>

        {/* Compact Submit Button */}
        {canInputScore && (
          <div className='mt-3 space-y-2'>
            {match.score_edit_count && match.score_edit_count > 0 && (
              <div className='text-xs text-muted-foreground flex items-center gap-1 justify-center'>
                <Edit className='h-3 w-3' />
                Đã sửa ({match.score_edit_count})
              </div>
            )}

            <Button
              onClick={async () => {
                // Enhanced validation
                if (!isMatchReady) {
                  toast.error('Trận đấu chưa sẵn sàng để nhập tỷ số');
                  return;
                }

                const score1 = parseInt(player1Score) || 0;
                const score2 = parseInt(player2Score) || 0;

                if (score1 < 0 || score2 < 0) {
                  toast.error('Tỷ số không thể âm');
                  return;
                }

                if (score1 === score2) {
                  toast.error('Tỷ số không thể hòa trong giải loại trực tiếp');
                  return;
                }

                if (!score1 && !score2) {
                  toast.error('Vui lòng nhập tỷ số cho cả hai người chơi');
                  return;
                }

                if (isSubmitting) {
                  toast.error('Đang xử lý, vui lòng đợi...');
                  return;
                }

                setIsSubmitting(true);

                try {
                  console.log(
                    '🎯 [DoubleEliminationMatchCard] Submitting DE score:',
                    {
                      matchId: match.id,
                      bracketType: match.bracket_type,
                      branchType: match.branch_type,
                      score1,
                      score2,
                      currentUserId,
                    }
                  );

                  const { supabase } = await import(
                    '@/integrations/supabase/client'
                  );

                  // Get current user for submitted_by parameter
                  const {
                    data: { user },
                  } = await supabase.auth.getUser();
                  if (!user) {
                    throw new Error(
                      'User must be authenticated to submit scores'
                    );
                  }

                  const { data, error } = await supabase.rpc(
                    'submit_sabo_match_score',
                    {
                      p_match_id: match.id,
                      p_player1_score: score1,
                      p_player2_score: score2,
                      p_submitted_by: user.id,
                    }
                  );

                  if (error) {
                    console.error(
                      '❌ [DoubleEliminationMatchCard] RPC Error:',
                      error
                    );
                    throw error;
                  }

                  console.log(
                    '✅ [DoubleEliminationMatchCard] RPC Response:',
                    data
                  );

                  if (
                    data &&
                    typeof data === 'object' &&
                    'error' in data &&
                    data.error
                  ) {
                    console.error(
                      '❌ [DoubleEliminationMatchCard] RPC returned error:',
                      data.error
                    );
                    throw new Error(data.error as string);
                  }

                  // Check if tournament is complete
                  if (
                    data &&
                    typeof data === 'object' &&
                    'advancement' in data &&
                    data.advancement
                  ) {
                    const advancement = data.advancement as any;
                    console.log(
                      '🎯 [DoubleEliminationMatchCard] Advancement result:',
                      advancement
                    );
                    if (advancement.tournament_complete) {
                      toast.success(
                        '🏆 Giải đấu đã hoàn thành! Chúc mừng nhà vô địch!'
                      );
                    } else {
                      toast.success(
                        '🎯 Đã cập nhật tỷ số và tiến hành bracket!'
                      );
                    }
                  } else {
                    toast.success('🎯 Đã cập nhật tỷ số thành công!');
                  }

                  // Force a small delay to allow DB changes to propagate
                  setTimeout(() => {
                    console.log(
                      '🔄 [DoubleEliminationMatchCard] Database should have updated, realtime should refresh'
                    );
                  }, 500);
                } catch (error) {
                  console.error('Error updating score:', error);
                  toast.error('Có lỗi khi cập nhật tỷ số. Vui lòng thử lại.');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              className='w-full h-8 bg-green-600 hover:bg-green-700 text-white text-xs'
            >
              <Trophy className='w-3 h-3 mr-1' />
              {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật tỷ số'}
            </Button>
          </div>
        )}

        {/* Debug Info for Club Owners */}
        <MatchStatusDebugInfo match={match} isClubOwner={isClubOwner} />
      </CardContent>
    </Card>
  );
};
