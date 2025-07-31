import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Play,
  CheckCircle,
  XCircle
} from 'lucide-react';
import type { SaboChallenge } from '@/types/sabo-challenge';

interface SaboChallengeCardProps {
  challenge: SaboChallenge;
  currentUserId: string;
  onScoreRack: (challengeId: string, winnerId: string) => void;
  onAccept: (challengeId: string) => void;
  onDecline: (challengeId: string) => void;
  onStart: (challengeId: string) => void;
}

export function SaboChallengeCard({ 
  challenge, 
  currentUserId, 
  onScoreRack, 
  onAccept, 
  onDecline, 
  onStart 
}: SaboChallengeCardProps) {
  const isChallenger = challenge.challenger_id === currentUserId;
  const isOpponent = challenge.opponent_id === currentUserId;
  const isMyChallenge = isChallenger || isOpponent;

  const getStatusText = (status: string) => {
    const statusMap = {
      'pending': 'Chờ phản hồi',
      'accepted': 'Đã chấp nhận',
      'in_progress': 'Đang đấu',
      'completed': 'Hoàn thành',
      'declined': 'Đã từ chối',
      'expired': 'Hết hạn'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusVariant = (status: string) => {
    const variants = {
      'pending': 'bg-orange-500 text-white',
      'accepted': 'bg-blue-500 text-white',
      'in_progress': 'bg-green-500 text-white',
      'completed': 'bg-purple-500 text-white',
      'declined': 'bg-red-500 text-white',
      'expired': 'bg-gray-500 text-white'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-500 text-white';
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getPlayerAvatar = (player: any) => {
    if (player?.avatar_url) {
      return player.avatar_url;
    }
    return '';
  };

  const getPlayerInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const getHandicapText = () => {
    if (challenge.handicap_challenger > 0) {
      return `+ Chấp ${challenge.handicap_challenger} ván`;
    }
    if (challenge.handicap_opponent > 0) {
      return `+ Chấp ${challenge.handicap_opponent} ván`;
    }
    return '';
  };

  const getScoreText = () => {
    if (challenge.status === 'in_progress' || challenge.status === 'completed') {
      return `${challenge.challenger_final_score}-${challenge.opponent_final_score}`;
    }
    return '--';
  };

  const getTimeText = () => {
    if (challenge.status === 'in_progress' && challenge.started_at) {
      return formatDateTime(challenge.started_at);
    }
    if (challenge.status === 'completed' && challenge.score_confirmation_timestamp) {
      return formatDateTime(challenge.score_confirmation_timestamp);
    }
    return formatDateTime(challenge.created_at);
  };

  return (
    <Card className="w-full animate-fade-in hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Line 1: Players & Status */}
        <div className="flex items-center gap-3">
          {/* Challenger */}
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={getPlayerAvatar(challenge.challenger)} />
              <AvatarFallback className="text-xs">
                {getPlayerInitials(challenge.challenger?.display_name || '')}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm">
              {challenge.challenger?.display_name || 'Unknown'}
            </span>
            <Badge variant="outline" className="text-xs">
              {challenge.challenger?.current_rank || 'K'}
            </Badge>
          </div>

          {/* Battle Icon */}
          <div className="text-lg">⚔️</div>

          {/* Opponent */}
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={getPlayerAvatar(challenge.opponent)} />
              <AvatarFallback className="text-xs">
                {getPlayerInitials(challenge.opponent?.display_name || '')}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm">
              {challenge.opponent?.display_name || 'Unknown'}
            </span>
            <Badge variant="outline" className="text-xs">
              {challenge.opponent?.current_rank || 'K'}
            </Badge>
          </div>

          {/* Status Badge */}
          <div className="ml-auto">
            <Badge className={`${getStatusVariant(challenge.status)} text-xs`}>
              {getStatusText(challenge.status)}
            </Badge>
          </div>
        </div>

        {/* Line 2: Match Details (Centered) */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            🏆 {challenge.stake_amount} SPA
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            🎯 Race to {challenge.race_to}{getHandicapText()}
          </span>
          <span>•</span>
          <span>Tỷ số: {getScoreText()}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            ⏰ {getTimeText()}
          </span>
        </div>

        {/* Action Buttons */}
        {challenge.status === 'pending' && isOpponent && (
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button 
              onClick={() => onAccept(challenge.id)}
              size="sm"
              className="hover-scale"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Chấp nhận
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => onDecline(challenge.id)}
              className="hover-scale"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Từ chối
            </Button>
          </div>
        )}

        {challenge.status === 'accepted' && isMyChallenge && (
          <div className="flex justify-end pt-2 border-t">
            <Button 
              onClick={() => onStart(challenge.id)}
              size="sm"
              className="hover-scale"
            >
              <Play className="h-4 w-4 mr-1" />
              Bắt đầu
            </Button>
          </div>
        )}

        {challenge.status === 'in_progress' && isMyChallenge && (
          <div className="space-y-2 pt-2 border-t">
            <div className="text-sm font-medium text-center">Ghi điểm rack tiếp theo:</div>
            <div className="flex gap-2">
              <Button 
                onClick={() => onScoreRack(challenge.id, challenge.challenger_id)}
                variant={isChallenger ? "default" : "outline"}
                size="sm"
                className="flex-1 hover-scale"
              >
                {challenge.challenger?.display_name?.split(' ')[0] || 'Challenger'}
              </Button>
              <Button 
                onClick={() => onScoreRack(challenge.id, challenge.opponent_id)}
                variant={isOpponent ? "default" : "outline"}
                size="sm"
                className="flex-1 hover-scale"
              >
                {challenge.opponent?.display_name?.split(' ')[0] || 'Opponent'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}