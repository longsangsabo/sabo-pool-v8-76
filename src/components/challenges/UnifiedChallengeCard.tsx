import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  Clock,
  Trophy,
  DollarSign,
  MapPin,
  Zap,
  Target,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { Challenge } from '@/types/challenge';
import ChallengeDetailsModal from '@/components/ChallengeDetailsModal';

type ChallengeStatus =
  | 'open'
  | 'ongoing'
  | 'upcoming'
  | 'completed'
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'cancelled'
  | 'expired';

interface UnifiedChallengeCardProps {
  challenge: Challenge;
  variant?: 'default' | 'compact' | 'match';
  currentUserId?: string; // For match mode
  onJoin?: (challengeId: string) => Promise<void>;
  onAction?: (
    challengeId: string,
    action: 'accept' | 'decline' | 'cancel' | 'view' | 'score'
  ) => void;
  onSubmitScore?: (
    challengeId: string,
    challengerScore: number,
    opponentScore: number
  ) => Promise<void>;
  isSubmittingScore?: boolean;
}

const UnifiedChallengeCard: React.FC<UnifiedChallengeCardProps> = ({
  challenge,
  variant = 'default',
  currentUserId,
  onJoin,
  onAction,
  onSubmitScore,
  isSubmittingScore = false,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const isCompact = variant === 'compact';
  const isMatch = variant === 'match';
  const effectiveUserId = currentUserId || user?.id;

  // Enhanced status logic for match mode with time-based logic
  const getMatchStatus = () => {
    if (challenge.status === 'completed') {
      const challengerScore = challenge.challenger_score || 0;
      const opponentScore = challenge.opponent_score || 0;
      const winnerId =
        challengerScore > opponentScore
          ? challenge.challenger_id
          : challenge.opponent_id;
      const isWinner = winnerId === effectiveUserId;

      return {
        badge: isWinner ? 'Thắng' : 'Thua',
        variant: isWinner ? 'default' : ('destructive' as const),
        score: `${challengerScore} - ${opponentScore}`,
      };
    }

    if (challenge.status === 'accepted') {
      const scheduledTime = challenge.scheduled_time
        ? new Date(challenge.scheduled_time)
        : null;
      const now = new Date();

      if (scheduledTime && scheduledTime < now) {
        return {
          badge: 'Đang diễn ra',
          variant: 'default' as const,
        };
      }

      return {
        badge: 'Sắp diễn ra',
        variant: 'secondary' as const,
      };
    }

    return {
      badge: 'Chờ xử lý',
      variant: 'outline' as const,
    };
  };

  const getStatusConfig = (status: ChallengeStatus) => {
    // For match mode, use enhanced status logic
    if (isMatch) {
      const matchStatus = getMatchStatus();
      const colorMap = {
        Thắng: 'bg-green-500',
        Thua: 'bg-red-500',
        'Đang diễn ra': 'bg-blue-500',
        'Sắp diễn ra': 'bg-amber-500',
        'Chờ xử lý': 'bg-purple-500',
      };

      return {
        color:
          colorMap[matchStatus.badge as keyof typeof colorMap] || 'bg-gray-500',
        label: matchStatus.badge,
        variant: matchStatus.variant,
        className: 'hover:shadow-md transition-shadow',
      };
    }

    switch (status) {
      case 'pending':
        return {
          color: 'bg-emerald-500',
          label: 'Mở',
          variant: 'default' as const,
          className:
            'from-emerald-50/50 to-green-50/50 border-emerald-200/50 hover:border-emerald-300/70',
        };
      case 'ongoing':
      case 'accepted':
        return {
          color: 'bg-blue-500',
          label: 'Đang diễn ra',
          variant: 'default' as const,
          className:
            'from-blue-50/50 to-indigo-50/50 border-blue-200/50 hover:border-blue-300/70',
        };
      case 'upcoming':
        return {
          color: 'bg-amber-500',
          label: 'Sắp diễn ra',
          variant: 'secondary' as const,
          className:
            'from-amber-50/50 to-orange-50/50 border-amber-200/50 hover:border-amber-300/70',
        };
      case 'completed':
        return {
          color: 'bg-gray-500',
          label: 'Hoàn thành',
          variant: 'secondary' as const,
          className:
            'from-gray-50/50 to-slate-50/50 border-gray-200/50 hover:border-gray-300/70',
        };
      case 'open':
        return {
          color: 'bg-purple-500',
          label: 'Chờ phản hồi',
          variant: 'outline' as const,
          className:
            'from-purple-50/50 to-violet-50/50 border-purple-200/50 hover:border-purple-300/70',
        };
      default:
        return {
          color: 'bg-gray-500',
          label: 'Không xác định',
          variant: 'outline' as const,
          className: 'from-gray-50/50 to-slate-50/50 border-gray-200/50',
        };
    }
  };

  const statusConfig = getStatusConfig(challenge.status);

  const handleJoin = async () => {
    if (!onJoin || !user) return;

    setIsLoading(true);
    try {
      await onJoin(challenge.id);
    } catch (error) {
      console.error('Error joining challenge:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeDisplay = () => {
    switch (challenge.status) {
      case 'pending':
        return challenge.expires_at
          ? `Hết hạn ${formatDistanceToNow(new Date(challenge.expires_at), { addSuffix: true, locale: vi })}`
          : `Tạo ${formatDistanceToNow(new Date(challenge.created_at), { addSuffix: true, locale: vi })}`;
      case 'accepted':
        return challenge.scheduled_time
          ? `${formatDistanceToNow(new Date(challenge.scheduled_time), { addSuffix: true, locale: vi })}`
          : `Tạo ${formatDistanceToNow(new Date(challenge.created_at), { addSuffix: true, locale: vi })}`;
      case 'completed':
        return challenge.actual_end_time
          ? `${formatDistanceToNow(new Date(challenge.actual_end_time), { addSuffix: true, locale: vi })}`
          : `Hoàn thành`;
      default:
        return formatDistanceToNow(new Date(challenge.created_at), {
          addSuffix: true,
          locale: vi,
        });
    }
  };

  const renderPlayerInfo = (
    profile: any,
    isChallenger: boolean = false,
    showVsLabel: boolean = false,
    isForMatch: boolean = false
  ) => {
    if (!profile && challenge.status === 'pending' && !challenge.opponent_id) {
      return showVsLabel ? (
        <div className='flex items-center justify-center'>
          <span className='text-2xl font-bold text-muted-foreground'>VS</span>
        </div>
      ) : null;
    }

    const playerName =
      profile?.display_name || profile?.full_name || 'Người chơi ẩn danh';
    const isCurrentUser =
      (isChallenger && effectiveUserId === challenge.challenger_id) ||
      (!isChallenger && effectiveUserId === challenge.opponent_id);

    return (
      <div className={`flex items-center gap-3 ${isForMatch ? '' : ''}`}>
        <Avatar
          className={`${isCompact ? 'w-8 h-8' : isMatch ? 'w-10 h-10' : 'w-12 h-12'} ring-2 ring-white/50`}
        >
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback>{playerName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div
          className={`flex-1 min-w-0 ${isForMatch && !isChallenger ? 'text-right' : ''}`}
        >
          <p
            className={`font-medium truncate ${isCompact ? 'text-sm' : isMatch ? 'text-sm' : ''}`}
          >
            {playerName}
            {isCurrentUser && <span className='text-primary ml-1'>(Bạn)</span>}
          </p>
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <span>{profile?.verified_rank || 'Chưa xác định'}</span>
            <span className='text-orange-600 font-semibold'>
              {profile?.spa_points || 0} SPA
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderScore = () => {
    if (
      challenge.status === 'completed' &&
      challenge.challenger_score !== undefined &&
      challenge.opponent_score !== undefined
    ) {
      const challengerScore = challenge.challenger_score || 0;
      const opponentScore = challenge.opponent_score || 0;
      const isWinner = challengerScore > opponentScore;
      return (
        <div className='flex items-center gap-2 text-lg font-bold'>
          <span className={isWinner ? 'text-green-600' : 'text-red-600'}>
            {challenge.challenger_score}
          </span>
          <span className='text-muted-foreground'>-</span>
          <span className={!isWinner ? 'text-green-600' : 'text-red-600'}>
            {challenge.opponent_score}
          </span>
        </div>
      );
    }
    return null;
  };

  const renderActionButtons = () => {
    const isMyChallenge = effectiveUserId === challenge.challenger_id;
    const isOpponent = effectiveUserId === challenge.opponent_id;
    const isParticipant = isMyChallenge || isOpponent;
    const canEnterScore =
      isParticipant &&
      (challenge.status === 'accepted' || challenge.status === 'ongoing') &&
      onSubmitScore;

    switch (challenge.status) {
      case 'pending':
        if (!isMyChallenge && onJoin) {
          return (
            <Button
              onClick={handleJoin}
              disabled={isLoading || !effectiveUserId}
              className='flex-1'
            >
              {isLoading ? (
                <>
                  <Zap className='w-4 h-4 mr-2 animate-spin' />
                  Đang tham gia...
                </>
              ) : (
                <>
                  <Zap className='w-4 h-4 mr-2' />
                  Tham gia
                </>
              )}
            </Button>
          );
        }
        
        if (isOpponent && onAction) {
          return (
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => onAction(challenge.id, 'decline')}
                className='flex-1'
              >
                Từ chối
              </Button>
              <Button
                size='sm'
                onClick={() => onAction(challenge.id, 'accept')}
                className='flex-1'
              >
                Chấp nhận
              </Button>
            </div>
          );
        }
        break;

      case 'accepted':
      case 'ongoing':
        if (canEnterScore) {
          return (
            <Button
              onClick={() => setIsScoreModalOpen(true)}
              disabled={isSubmittingScore}
              className='w-full'
              variant='default'
            >
              {isSubmittingScore ? 'Đang ghi nhận...' : '📊 Nhập Tỷ Số'}
            </Button>
          );
        }
        break;

      default:
        if (onAction) {
          return (
            <Button
              variant='outline'
              size='sm'
              onClick={() => onAction(challenge.id, 'view')}
            >
              Xem chi tiết
            </Button>
          );
        }
    }

    return null;
  };

  // Match mode rendering for ongoing/completed challenges
  const renderMatchCard = () => {
    const challengerName =
      challenge.challenger_profile?.display_name ||
      challenge.challenger_profile?.full_name ||
      'Người thách đấu';
    const opponentName =
      challenge.opponent_profile?.display_name ||
      challenge.opponent_profile?.full_name ||
      'Đối thủ';
    const matchStatus = getMatchStatus();
    const statusConfig = getStatusConfig(challenge.status);
    const canEnterScore =
      challenge.status === 'accepted' &&
      (effectiveUserId === challenge.challenger_id ||
        effectiveUserId === challenge.opponent_id);

    return (
      <>
        <Card className='hover:shadow-md transition-shadow'>
          <CardContent className='p-4'>
            {/* Header with status */}
            <div className='flex justify-between items-center mb-4'>
              <Badge
                variant={
                  matchStatus.variant as
                    | 'default'
                    | 'destructive'
                    | 'secondary'
                    | 'outline'
                }
                className='text-xs'
              >
                {matchStatus.badge}
              </Badge>

              {challenge.scheduled_time && (
                <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                  <Clock className='w-3 h-3' />
                  {formatDistanceToNow(new Date(challenge.scheduled_time), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </div>
              )}
            </div>

            {/* Players */}
            <div className='flex items-center justify-between mb-4'>
              {/* Challenger */}
              {renderPlayerInfo(
                challenge.challenger_profile,
                true,
                false,
                true
              )}

              {/* VS / Score */}
              <div className='text-center px-4'>
                {challenge.status === 'completed' && matchStatus.score ? (
                  <div className='text-lg font-bold'>{matchStatus.score}</div>
                ) : (
                  <div className='text-lg font-bold text-muted-foreground'>
                    VS
                  </div>
                )}
              </div>

              {/* Opponent */}
              {renderPlayerInfo(challenge.opponent_profile, false, false, true)}
            </div>

            {/* Match Info */}
            <div className='grid grid-cols-3 gap-4 mb-4 text-center'>
              <div className='flex flex-col items-center gap-1'>
                <Target className='w-4 h-4 text-muted-foreground' />
                <span className='text-xs text-muted-foreground'>Race to</span>
                <span className='font-semibold'>{challenge.race_to || 8}</span>
              </div>

              <div className='flex flex-col items-center gap-1'>
                <span className='text-sm font-bold text-muted-foreground'>
                  SPA
                </span>
                <span className='text-xs text-muted-foreground'>Cược</span>
                <span className='font-semibold'>
                  {challenge.bet_points || 100}
                </span>
              </div>

              <div className='flex flex-col items-center gap-1'>
                <Trophy className='w-4 h-4 text-muted-foreground' />
                <span className='text-xs text-muted-foreground'>
                  Câu lạc bộ
                </span>
                <span className='font-semibold capitalize'>
                  {challenge.club?.name || 'CLB SABO'}
                </span>
              </div>
            </div>

            {/* Action Button */}
            {canEnterScore && (
              <Button
                onClick={() => setIsScoreModalOpen(true)}
                disabled={isSubmittingScore}
                className='w-full'
                variant='default'
              >
                {isSubmittingScore ? 'Đang ghi nhận...' : '📊 Nhập Tỷ Số'}
              </Button>
            )}

            {/* Match Notes */}
            {challenge.message && (
              <div className='mt-3 p-2 bg-muted/30 rounded text-xs'>
                <strong>Ghi chú:</strong> {challenge.message}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Challenge Details Modal with Score Entry */}
        <ChallengeDetailsModal
          challenge={challenge as any}
          isOpen={isScoreModalOpen}
          onClose={() => setIsScoreModalOpen(false)}
          onUpdate={() => {
            /* handle update */
          }}
        />
      </>
    );
  };

  // Use match mode for accepted/ongoing/completed challenges
  if (
    isMatch ||
    challenge.status === 'accepted' ||
    challenge.status === 'ongoing' ||
    challenge.status === 'completed'
  ) {
    return renderMatchCard();
  }

  return (
    <Card
      className={`group relative h-full bg-gradient-to-br ${statusConfig.className} backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
    >
      {/* Status indicator */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${statusConfig.color} rounded-t-lg`}
      />

      {/* Status badge */}
      <div className='absolute top-3 right-3'>
        <div
          className={`w-3 h-3 ${statusConfig.color} rounded-full shadow-lg animate-pulse`}
        ></div>
      </div>

      <CardHeader className={`${isCompact ? 'pb-3' : 'pb-4'}`}>
        <div className='flex items-center justify-between'>
          <Badge
            variant={
              statusConfig.variant as
                | 'default'
                | 'destructive'
                | 'secondary'
                | 'outline'
            }
            className='text-xs'
          >
            {statusConfig.label}
          </Badge>
          <div className='text-xs text-muted-foreground'>
            <Clock className='w-3 h-3 inline mr-1' />
            {getTimeDisplay()}
          </div>
        </div>
      </CardHeader>

      <CardContent className={`space-y-4 ${isCompact ? 'pb-4' : 'pb-6'}`}>
        {/* Player Information */}
        <div className='space-y-3'>
          {/* Challenger */}
          {renderPlayerInfo(challenge.challenger_profile, true)}

          {/* VS or Opponent */}
          {challenge.opponent_id ? (
            renderPlayerInfo(challenge.opponent_profile, false, true)
          ) : (
            <div className='flex items-center justify-center py-2'>
              <span className='text-lg font-bold text-muted-foreground'>
                VS Open Challenge
              </span>
            </div>
          )}
        </div>

        {/* Score for completed matches */}
        {renderScore()}

        {/* Challenge Details */}
        <div className='grid grid-cols-2 gap-4 p-3 bg-white/50 rounded-lg border border-white/20'>
          <div className='flex items-center gap-2'>
            <DollarSign className='w-4 h-4 text-yellow-600' />
            <span className={`font-semibold ${isCompact ? 'text-sm' : ''}`}>
              {challenge.bet_points} điểm
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <Trophy className='w-4 h-4 text-blue-600' />
            <span className={`${isCompact ? 'text-sm' : ''}`}>
              Race to {challenge.race_to || 8}
            </span>
          </div>
        </div>

        {/* Club Information */}
        {challenge.club && !isCompact && (
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <MapPin className='w-4 h-4' />
            <span className='font-medium'>{challenge.club.name}</span>
          </div>
        )}

        {/* Message */}
        {challenge.message && !isCompact && (
          <div className='p-3 bg-muted/50 rounded-lg'>
            <p className='text-sm italic'>"{challenge.message}"</p>
          </div>
        )}

        {/* Action Buttons */}
        {renderActionButtons()}
      </CardContent>
    </Card>
  );
};

export default UnifiedChallengeCard;
