import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Clock, Trophy, DollarSign, MapPin, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';

type ChallengeStatus = 'open' | 'ongoing' | 'upcoming' | 'completed' | 'pending' | 'accepted';

interface UnifiedChallengeCardProps {
  challenge: {
    id: string;
    challenger_id: string;
    opponent_id?: string;
    bet_points: number;
    race_to?: number;
    challenge_type?: string;
    status: ChallengeStatus;
    created_at: string;
    expires_at?: string;
    completed_at?: string;
    scheduled_time?: string;
    challenger_profile?: {
      full_name?: string;
      display_name?: string;
      avatar_url?: string;
      current_rank?: string;
      verified_rank?: string;
      spa_points?: number;
    };
    opponent_profile?: {
      full_name?: string;
      display_name?: string;
      avatar_url?: string;
      current_rank?: string;
      verified_rank?: string;
      spa_points?: number;
    };
    club_profiles?: {
      club_name: string;
      address: string;
    };
    message?: string;
    challenger_score?: number;
    opponent_score?: number;
    winner_id?: string;
  };
  variant?: 'default' | 'compact';
  onJoin?: (challengeId: string) => Promise<void>;
  onAction?: (challengeId: string, action: 'accept' | 'decline' | 'cancel' | 'view' | 'score') => void;
  onSubmitScore?: (challengeId: string, challengerScore: number, opponentScore: number) => Promise<void>;
}

const UnifiedChallengeCard: React.FC<UnifiedChallengeCardProps> = ({
  challenge,
  variant = 'default',
  onJoin,
  onAction,
  onSubmitScore
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const isCompact = variant === 'compact';

  const getStatusConfig = (status: ChallengeStatus) => {
    switch (status) {
      case 'open':
        return {
          color: 'bg-emerald-500',
          label: 'Mở',
          variant: 'default' as const,
          className: 'from-emerald-50/50 to-green-50/50 border-emerald-200/50 hover:border-emerald-300/70'
        };
      case 'ongoing':
      case 'accepted': // Map accepted to ongoing display
        return {
          color: 'bg-blue-500',
          label: 'Đang diễn ra',
          variant: 'default' as const,
          className: 'from-blue-50/50 to-indigo-50/50 border-blue-200/50 hover:border-blue-300/70'
        };
      case 'upcoming':
        return {
          color: 'bg-amber-500',
          label: 'Sắp diễn ra',
          variant: 'secondary' as const,
          className: 'from-amber-50/50 to-orange-50/50 border-amber-200/50 hover:border-amber-300/70'
        };
      case 'completed':
        return {
          color: 'bg-gray-500',
          label: 'Hoàn thành',
          variant: 'secondary' as const,
          className: 'from-gray-50/50 to-slate-50/50 border-gray-200/50 hover:border-gray-300/70'
        };
      case 'pending':
        return {
          color: 'bg-purple-500',
          label: 'Chờ phản hồi',
          variant: 'outline' as const,
          className: 'from-purple-50/50 to-violet-50/50 border-purple-200/50 hover:border-purple-300/70'
        };
      default:
        return {
          color: 'bg-gray-500',
          label: 'Không xác định',
          variant: 'outline' as const,
          className: 'from-gray-50/50 to-slate-50/50 border-gray-200/50'
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
      case 'open':
        return challenge.expires_at 
          ? `Hết hạn ${formatDistanceToNow(new Date(challenge.expires_at), { addSuffix: true, locale: vi })}`
          : `Tạo ${formatDistanceToNow(new Date(challenge.created_at), { addSuffix: true, locale: vi })}`;
      case 'upcoming':
        return challenge.scheduled_time
          ? `${formatDistanceToNow(new Date(challenge.scheduled_time), { addSuffix: true, locale: vi })}`
          : `Tạo ${formatDistanceToNow(new Date(challenge.created_at), { addSuffix: true, locale: vi })}`;
      case 'completed':
        return challenge.completed_at 
          ? `${formatDistanceToNow(new Date(challenge.completed_at), { addSuffix: true, locale: vi })}`
          : `Hoàn thành`;
      default:
        return formatDistanceToNow(new Date(challenge.created_at), { addSuffix: true, locale: vi });
    }
  };

  const renderPlayerInfo = (
    profile?: UnifiedChallengeCardProps['challenge']['challenger_profile'],
    isChallenger: boolean = false,
    showVsLabel: boolean = false
  ) => {
    if (!profile && challenge.status === 'open') {
      return showVsLabel ? (
        <div className="flex items-center justify-center">
          <span className="text-2xl font-bold text-muted-foreground">VS</span>
        </div>
      ) : null;
    }

    return (
      <div className="flex items-center gap-3">
        <Avatar className={`${isCompact ? 'w-8 h-8' : 'w-12 h-12'} ring-2 ring-white/50`}>
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback>
            {profile?.full_name?.charAt(0) || profile?.display_name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className={`font-medium truncate ${isCompact ? 'text-sm' : ''}`}>
            {profile?.display_name || profile?.full_name || 'Người chơi ẩn danh'}
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {profile?.verified_rank || profile?.current_rank || 'K'}
            </Badge>
            {!isCompact && profile?.spa_points && (
              <span className="text-xs text-muted-foreground">
                {profile.spa_points} SPA
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderScore = () => {
    if (challenge.status === 'completed' && challenge.challenger_score !== undefined && challenge.opponent_score !== undefined) {
      const isWinner = challenge.winner_id === challenge.challenger_id;
      return (
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className={isWinner ? 'text-green-600' : 'text-red-600'}>
            {challenge.challenger_score}
          </span>
          <span className="text-muted-foreground">-</span>
          <span className={!isWinner ? 'text-green-600' : 'text-red-600'}>
            {challenge.opponent_score}
          </span>
        </div>
      );
    }
    return null;
  };

  const renderActionButtons = () => {
    const isMyChallenge = user?.id === challenge.challenger_id;
    const isOpponent = user?.id === challenge.opponent_id;
    const canEnterScore = (isMyChallenge || isOpponent) && 
      (challenge.status === 'accepted' || challenge.status === 'ongoing') && 
      onSubmitScore;

    switch (challenge.status) {
      case 'open':
        if (!isMyChallenge && onJoin) {
          return (
            <Button
              onClick={handleJoin}
              disabled={isLoading || !user}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-spin" />
                  Đang tham gia...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Tham gia
                </>
              )}
            </Button>
          );
        }
        break;
      
      case 'pending':
        if (isOpponent && onAction) {
          return (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction(challenge.id, 'decline')}
                className="flex-1"
              >
                Từ chối
              </Button>
              <Button
                size="sm"
                onClick={() => onAction(challenge.id, 'accept')}
                className="flex-1"
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
              onClick={() => onAction?.(challenge.id, 'score')}
              className="flex-1"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Nhập tỷ số
            </Button>
          );
        }
        break;
      
      default:
        if (onAction) {
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction(challenge.id, 'view')}
            >
              Xem chi tiết
            </Button>
          );
        }
    }

    return null;
  };

  return (
    <Card className={`group relative h-full bg-gradient-to-br ${statusConfig.className} backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
      {/* Status indicator */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${statusConfig.color} rounded-t-lg`} />
      
      {/* Status badge */}
      <div className="absolute top-3 right-3">
        <div className={`w-3 h-3 ${statusConfig.color} rounded-full shadow-lg animate-pulse`}></div>
      </div>

      <CardHeader className={`${isCompact ? 'pb-3' : 'pb-4'}`}>
        <div className="flex items-center justify-between">
          <Badge variant={statusConfig.variant} className="text-xs">
            {statusConfig.label}
          </Badge>
          <div className="text-xs text-muted-foreground">
            <Clock className="w-3 h-3 inline mr-1" />
            {getTimeDisplay()}
          </div>
        </div>
      </CardHeader>

      <CardContent className={`space-y-4 ${isCompact ? 'pb-4' : 'pb-6'}`}>
        {/* Player Information */}
        <div className="space-y-3">
          {/* Challenger */}
          {renderPlayerInfo(challenge.challenger_profile, true)}
          
          {/* VS or Opponent */}
          {challenge.status !== 'open' ? (
            renderPlayerInfo(challenge.opponent_profile, false, true)
          ) : (
            <div className="flex items-center justify-center py-2">
              <span className="text-lg font-bold text-muted-foreground">VS Open Challenge</span>
            </div>
          )}
        </div>

        {/* Score for completed matches */}
        {renderScore()}

        {/* Challenge Details */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-white/50 rounded-lg border border-white/20">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-yellow-600" />
            <span className={`font-semibold ${isCompact ? 'text-sm' : ''}`}>
              {challenge.bet_points} điểm
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-blue-600" />
            <span className={`${isCompact ? 'text-sm' : ''}`}>
              Race to {challenge.race_to || 8}
            </span>
          </div>
        </div>

        {/* Club Information */}
        {challenge.club_profiles && !isCompact && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">{challenge.club_profiles.club_name}</span>
          </div>
        )}

        {/* Message */}
        {challenge.message && !isCompact && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm italic">"{challenge.message}"</p>
          </div>
        )}

        {/* Action Buttons */}
        {renderActionButtons()}
      </CardContent>
    </Card>
  );
};

export default UnifiedChallengeCard;