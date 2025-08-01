import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Users, Trophy, Edit, Crown, Send } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import { toast } from 'sonner';

interface Match {
  id: string;
  round_number: number;
  match_number: number;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  status: string;
  assigned_table_number: number | null;
  assigned_table_id: string | null;
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

interface EnhancedMatchCardProps {
  match: Match;
  className?: string;
  showRound?: boolean;
  isClubOwner?: boolean;
  onEditScore?: (matchId: string) => void;
  currentUserId?: string;
}

export const EnhancedMatchCard: React.FC<EnhancedMatchCardProps> = ({
  match,
  className = '',
  showRound = false,
  isClubOwner = false,
  onEditScore,
  currentUserId,
}) => {
  // State for managing score inputs
  const [player1Score, setPlayer1Score] = useState<string>(
    match.score_player1?.toString() || ''
  );
  const [player2Score, setPlayer2Score] = useState<string>(
    match.score_player2?.toString() || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if current user is a participant
  const isParticipant =
    currentUserId &&
    (match.player1_id === currentUserId || match.player2_id === currentUserId);

  // Simplified logic - always show for club owners when both players present
  const canInputScore = isClubOwner && match.player1_id && match.player2_id;

  console.log('🔥 FORCE RENDER - EnhancedMatchCard:', {
    matchId: match.id,
    status: match.status,
    currentUserId,
    isParticipant,
    canInputScore,
    isClubOwner,
    hasPlayers: !!(match.player1_id && match.player2_id),
    shouldShowParticipantInput: canInputScore,
    timestamp: new Date().toISOString(),
  });

  const getDisplayScore = (score: number | null | undefined) => {
    return score !== null && score !== undefined ? score.toString() : '-';
  };
  const getMatchStatusBadge = () => {
    switch (match.status) {
      case 'completed':
        return (
          <Badge className='bg-green-500 hover:bg-green-600'>Hoàn thành</Badge>
        );
      case 'in_progress':
      case 'ongoing':
        return (
          <Badge className='bg-blue-500 hover:bg-blue-600'>Đang diễn ra</Badge>
        );
      case 'ready':
        return (
          <Badge className='bg-orange-500 hover:bg-orange-600'>Sẵn sàng</Badge>
        );
      case 'scheduled':
        return <Badge variant='outline'>Đã lên lịch</Badge>;
      default:
        return <Badge variant='secondary'>Chờ thí sinh</Badge>;
    }
  };

  const getPlayerName = (player?: {
    full_name: string;
    display_name?: string;
  }) => {
    if (!player) return 'TBD';
    return player.display_name || player.full_name;
  };

  const isPlayerWinner = (playerId: string | null) => {
    return match.winner_id === playerId;
  };

  const getPlayerCardStyle = (playerId: string | null) => {
    if (match.status === 'completed' && isPlayerWinner(playerId)) {
      return 'bg-green-50 border border-green-200 text-green-800 font-semibold';
    }
    return 'bg-muted/30 hover:bg-muted/50 transition-colors';
  };

  return (
    <Card
      className={`relative bg-gradient-to-br from-card via-card/90 to-muted/10 border border-border/60 rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer hover:border-primary/40 group ${className}`}
      style={{
        background:
          'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted)/0.3) 100%)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
      data-match-id={match.id}
    >
      <CardContent className='p-5'>
        {/* Header with Match Number and Table */}
        <div className='flex items-center justify-between mb-4'>
          <Badge
            variant='outline'
            className='px-3 py-1 text-sm font-bold bg-primary/10 border-primary/30 text-primary'
          >
            Trận {match.match_number}
          </Badge>

          {/* Table Badge */}
          {(match.assigned_table?.table_number ||
            match.assigned_table_number) && (
            <div className='bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-sm'>
              Bàn{' '}
              {match.assigned_table?.table_number ||
                match.assigned_table_number}
            </div>
          )}
        </div>

        {/* Players Section */}
        <div className='space-y-3'>
          {/* Player 1 */}
          <div
            className={`p-3 rounded-xl border-l-4 transition-all duration-200 ${
              match.player1
                ? 'bg-blue-50/50 border-blue-400 hover:bg-blue-50'
                : 'bg-muted/30 border-muted-foreground'
            } ${match.winner_id === match.player1_id ? 'ring-2 ring-emerald-400 bg-emerald-50/50 shadow-sm' : ''}`}
          >
            {/* Player Info Row */}
            <div className='flex items-center gap-4 mb-2'>
              <div className='flex items-center gap-3 flex-1'>
                {match.player1 ? (
                  <div className='flex items-center gap-3'>
                    <UserAvatar
                      userId={match.player1_id}
                      size='md'
                      showRank={false}
                      showName={false}
                      compact={false}
                      className='w-12 h-12 ring-2 ring-background shadow-md'
                    />
                    <div className='flex-1 min-w-0'>
                      <div className='font-semibold text-foreground text-sm truncate flex items-center gap-2'>
                        {match.player1.display_name || match.player1.full_name}
                        <span className='text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full font-bold'>
                          {match.player1.verified_rank ||
                            match.player1.ranking_verified_rank ||
                            'K'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className='flex items-center gap-3'>
                    <div className='w-12 h-12 rounded-full bg-muted border-2 border-dashed border-muted-foreground/30 flex items-center justify-center'>
                      <span className='text-muted-foreground text-xs'>?</span>
                    </div>
                    <span className='text-sm text-muted-foreground font-medium'>
                      ⏳ Chờ kết quả
                    </span>
                  </div>
                )}
              </div>
              {match.winner_id === match.player1_id && (
                <Crown className='w-5 h-5 text-yellow-500 drop-shadow-sm flex-shrink-0' />
              )}
            </div>

            {/* Score Input for Player 1 - FOR CLUB OWNERS */}
            {isClubOwner && match.player1_id && match.player2_id && (
              <div className='mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <span className='text-sm font-medium text-blue-700 min-w-[60px]'>
                    Tỷ số:
                  </span>
                  <input
                    id={`score-p1-${match.id}`}
                    type='number'
                    min='0'
                    max='50'
                    step='1'
                    className='w-20 px-3 py-2 border border-blue-300 rounded-md text-center font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg'
                    placeholder='0'
                    value={player1Score}
                    onChange={e => setPlayer1Score(e.target.value)}
                    autoComplete='off'
                    tabIndex={0}
                  />
                  <span className='text-xs text-blue-600 font-medium'>P1</span>
                </div>
              </div>
            )}
          </div>

          {/* VS Divider */}
          <div className='flex items-center justify-center py-2'>
            <div className='bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-1 rounded-full text-sm font-bold shadow-sm'>
              VS
            </div>
          </div>

          {/* Player 2 */}
          <div
            className={`p-3 rounded-xl border-l-4 transition-all duration-200 ${
              match.player2
                ? 'bg-purple-50/50 border-purple-400 hover:bg-purple-50'
                : 'bg-muted/30 border-muted-foreground'
            } ${match.winner_id === match.player2_id ? 'ring-2 ring-emerald-400 bg-emerald-50/50 shadow-sm' : ''}`}
          >
            {/* Player Info Row */}
            <div className='flex items-center gap-4 mb-2'>
              <div className='flex items-center gap-3 flex-1'>
                {match.player2 ? (
                  <div className='flex items-center gap-3'>
                    <UserAvatar
                      userId={match.player2_id}
                      size='md'
                      showRank={false}
                      showName={false}
                      compact={false}
                      className='w-12 h-12 ring-2 ring-background shadow-md'
                    />
                    <div className='flex-1 min-w-0'>
                      <div className='font-semibold text-foreground text-sm truncate flex items-center gap-2'>
                        {match.player2.display_name || match.player2.full_name}
                        <span className='text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full font-bold'>
                          {match.player2.verified_rank ||
                            match.player2.ranking_verified_rank ||
                            'K'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className='flex items-center gap-3'>
                    <div className='w-12 h-12 rounded-full bg-muted border-2 border-dashed border-muted-foreground/30 flex items-center justify-center'>
                      <span className='text-muted-foreground text-xs'>?</span>
                    </div>
                    <span className='text-sm text-muted-foreground font-medium'>
                      ⏳ Chờ kết quả
                    </span>
                  </div>
                )}
              </div>
              {match.winner_id === match.player2_id && (
                <Crown className='w-5 h-5 text-yellow-500 drop-shadow-sm flex-shrink-0' />
              )}
            </div>

            {/* Score Input for Player 2 - FOR CLUB OWNERS */}
            {isClubOwner && match.player1_id && match.player2_id && (
              <div className='mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <span className='text-sm font-medium text-purple-700 min-w-[60px]'>
                    Tỷ số:
                  </span>
                  <input
                    id={`score-p2-${match.id}`}
                    type='number'
                    min='0'
                    max='50'
                    step='1'
                    className='w-20 px-3 py-2 border border-purple-300 rounded-md text-center font-bold bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg'
                    placeholder='0'
                    value={player2Score}
                    onChange={e => setPlayer2Score(e.target.value)}
                    autoComplete='off'
                    tabIndex={0}
                  />
                  <span className='text-xs text-purple-600 font-medium'>
                    P2
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Result Box - Always show with consistent styling */}
        <div
          className={`mt-4 p-3 rounded-lg border ${
            match.status === 'completed'
              ? 'bg-emerald-50 border-emerald-200'
              : match.status === 'ongoing' || match.status === 'in_progress'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-muted/30 border-muted-foreground/30'
          }`}
        >
          <div className='text-center'>
            <div
              className={`text-lg font-bold mb-1 ${
                match.status === 'completed'
                  ? 'text-emerald-800'
                  : match.status === 'ongoing' || match.status === 'in_progress'
                    ? 'text-blue-800'
                    : 'text-muted-foreground'
              }`}
            >
              Kết quả: {getDisplayScore(match.score_player1)} -{' '}
              {getDisplayScore(match.score_player2)}
            </div>
            <div
              className={`text-sm font-medium ${
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

        {/* Status Badge */}
        <div className='text-center mt-4'>
          <Badge
            variant={
              match.status === 'completed'
                ? 'default'
                : match.status === 'ongoing'
                  ? 'secondary'
                  : 'outline'
            }
            className='text-sm px-4 py-1.5 font-medium shadow-sm'
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

        {/* Submit Button for Club Owners */}
        {isClubOwner && match.player1_id && match.player2_id && (
          <div className='mt-4 space-y-3'>
            {/* Edit Indicator */}
            {match.score_edit_count && match.score_edit_count > 0 && (
              <div className='text-xs text-muted-foreground flex items-center gap-1 justify-center'>
                <Edit className='h-3 w-3' />
                Đã sửa ({match.score_edit_count} lần)
              </div>
            )}

            {/* Submit Button */}
            <Button
              type='button'
              onClick={async e => {
                e.preventDefault();
                e.stopPropagation();

                const score1 = parseInt(player1Score) || 0;
                const score2 = parseInt(player2Score) || 0;

                if (!score1 && !score2) {
                  toast.error('Vui lòng nhập tỷ số cho cả hai người chơi');
                  return;
                }

                setIsSubmitting(true);

                try {
                  console.log(
                    '🎯 [EnhancedMatchCard] Submitting match score via RPC:',
                    {
                      matchId: match.id,
                      score1,
                      score2,
                      currentUserId,
                    }
                  );

                  // Use the RPC function for proper tournament progression
                  const { supabase } = await import(
                    '@/integrations/supabase/client'
                  );
                  const { data, error } = await supabase.rpc(
                    'submit_sabo_match_score',
                    {
                      p_match_id: match.id,
                      p_player1_score: score1,
                      p_player2_score: score2,
                      p_submitted_by: currentUserId,
                    }
                  );

                  if (error) {
                    console.error(
                      '❌ [EnhancedMatchCard] Error calling submit_match_score RPC:',
                      error
                    );
                    throw error;
                  }

                  console.log('✅ [EnhancedMatchCard] RPC response:', data);

                  if (
                    data &&
                    typeof data === 'object' &&
                    'error' in data &&
                    data.error
                  ) {
                    throw new Error(data.error as string);
                  }

                  if (
                    data &&
                    typeof data === 'object' &&
                    'tournament_complete' in data &&
                    data.tournament_complete
                  ) {
                    toast.success(
                      '🏆 Giải đấu đã hoàn thành! Chúc mừng nhà vô địch!'
                    );
                  } else {
                    toast.success('🎯 Đã cập nhật tỷ số thành công!');
                  }
                } catch (error) {
                  console.error('Error updating score:', error);
                  toast.error('Có lỗi khi cập nhật tỷ số. Vui lòng thử lại.');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              className='w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50'
            >
              <Trophy className='w-4 h-4 mr-2' />
              {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật tỷ số'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
