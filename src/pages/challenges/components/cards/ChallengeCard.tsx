import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  MapPin, 
  MessageSquare,
  DollarSign,
  Trophy,
  Users,
  Play,
  Flag
} from 'lucide-react';
import TrustScoreBadge from '@/components/TrustScoreBadge';

interface ChallengeCardProps {
  challenge: any;
  currentUserId?: string;
  onAccept?: (challengeId: string) => void;
  onDecline?: (challengeId: string) => void;
  onCancel?: (challengeId: string) => void;
  onJoin?: (challengeId: string) => void;
  type: 'incoming' | 'outgoing' | 'active' | 'completed' | 'open';
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  currentUserId,
  onAccept,
  onDecline,
  onCancel,
  onJoin,
  type
}) => {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'Chờ phản hồi', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
      case 'accepted':
        return { text: 'Đã chấp nhận', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'declined':
        return { text: 'Đã từ chối', color: 'bg-red-100 text-red-800', icon: XCircle };
      case 'completed':
        return { text: 'Hoàn thành', color: 'bg-blue-100 text-blue-800', icon: Trophy };
      case 'ongoing':
        return { text: 'Đang thi đấu', color: 'bg-purple-100 text-purple-800', icon: Play };
      default:
        return { text: status, color: 'bg-gray-100 text-gray-800', icon: Users };
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Đã hết hạn';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes} phút`;
    }
    if (hours < 24) {
      return `${hours} giờ`;
    }
    const days = Math.floor(hours / 24);
    return `${days} ngày`;
  };

  const getScoreText = () => {
    if (challenge.status === 'completed') {
      if (challenge.challenger_final_score !== null && 
          challenge.challenger_final_score !== undefined && 
          challenge.opponent_final_score !== null && 
          challenge.opponent_final_score !== undefined) {
        return `${challenge.challenger_final_score}-${challenge.opponent_final_score}`;
      }
      return "Kết thúc sớm";
    }
    if (challenge.status === 'accepted' || challenge.status === 'ongoing') {
      return "Đang đấu";
    }
    return "--";
  };

  const getWinner = () => {
    if (challenge.status === 'completed' && 
        challenge.challenger_final_score !== null && 
        challenge.challenger_final_score !== undefined && 
        challenge.opponent_final_score !== null && 
        challenge.opponent_final_score !== undefined) {
      if (challenge.challenger_final_score > challenge.opponent_final_score) {
        return 'challenger';
      } else if (challenge.opponent_final_score > challenge.challenger_final_score) {
        return 'opponent';
      }
    }
    return null;
  };

  const getDisplayTime = () => {
    // Ưu tiên thời gian diễn ra trận đấu (scheduled_time) thay vì created_at
    const timeToShow = challenge.scheduled_time || challenge.created_at;
    return new Date(timeToShow).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const statusInfo = getStatusInfo(challenge.status);
  const StatusIcon = statusInfo.icon;
  const isChallenger = currentUserId === challenge.challenger_id;
  const canRespond = type === 'incoming' && challenge.status === 'pending';
  const canCancel = type === 'outgoing' && challenge.status === 'pending';
  const winner = getWinner();

  // Determine which profile to show based on type and user role
  const getOpponentProfile = () => {
    if (type === 'open') {
      return challenge.challenger;
    }
    if (isChallenger) {
      return challenge.opponent || challenge.opponent_profile;
    }
    return challenge.challenger || challenge.challenger_profile;
  };

  const opponentProfile = getOpponentProfile();
  
  // Debug logging to see actual data structure
  console.log('ChallengeCard Debug:', {
    challengeId: challenge.id?.slice(-6),
    opponentProfile,
    challenger: challenge.challenger,
    challenger_profile: challenge.challenger_profile,
    opponent: challenge.opponent,
    opponent_profile: challenge.opponent_profile,
    type,
    isChallenger
  });

  const getBorderColor = () => {
    switch (type) {
      case 'incoming':
        return 'border-l-blue-500';
      case 'outgoing':
        return 'border-l-orange-500';
      case 'active':
        return 'border-l-green-500';
      case 'completed':
        return 'border-l-purple-500';
      case 'open':
        return 'border-l-emerald-500';
      default:
        return 'border-l-gray-500';
    }
  };

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 border-l-4 ${getBorderColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className="w-4 h-4" />
            <CardTitle className="text-base">
              Thách đấu #{challenge.id.slice(-6)}
            </CardTitle>
            {type === 'open' && (
              <Badge className="bg-emerald-100 text-emerald-800">
                <Users className="w-3 h-3 mr-1" />
                Mở
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canRespond && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            )}
            <Badge className={statusInfo.color}>
              {statusInfo.text}
            </Badge>
            {challenge.expires_at && challenge.status === 'pending' && (
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {getTimeRemaining(challenge.expires_at)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Line 1: Players & Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Current User or Challenger */}
            <div className={`flex items-center gap-2.5 ${
              (type === 'completed' && winner === 'challenger' && !isChallenger) || 
              (type === 'completed' && winner === 'opponent' && isChallenger) ? 
              'ring-2 ring-yellow-500 rounded-lg p-1' : ''
            }`}>
              <Avatar className="h-9 w-9 border-2 border-primary/20">
                <AvatarImage src={type === 'incoming' ? challenge.current_user_profile?.avatar_url : opponentProfile?.avatar_url} />
                <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                  {type === 'incoming' ? 
                    (challenge.current_user_profile?.full_name ? challenge.current_user_profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U') :
                    (opponentProfile?.full_name ? opponentProfile.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'C')
                  }
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className={`font-semibold text-base ${
                  (type === 'completed' && winner === 'challenger' && !isChallenger) || 
                  (type === 'completed' && winner === 'opponent' && isChallenger) ? 
                  'text-yellow-600' : ''
                }`}>
                  {type === 'incoming' ? 
                    (challenge.current_user_profile?.full_name || 'Bạn') : 
                    (opponentProfile?.full_name || 'Chờ đối thủ')
                  }
                  {((type === 'completed' && winner === 'challenger' && !isChallenger) || 
                    (type === 'completed' && winner === 'opponent' && isChallenger)) && 
                    <Trophy className="w-4 h-4 text-yellow-500 inline ml-1" />
                  }
                </span>
                <Badge variant="outline" className="text-xs w-fit">
                  {type === 'incoming' ? 
                    (challenge.current_user_profile?.verified_rank || challenge.current_user_profile?.current_rank || 'K') :
                    (opponentProfile?.verified_rank || opponentProfile?.current_rank || 'K')
                  }
                </Badge>
              </div>
            </div>

            {/* VS Indicator */}
            <div className="text-xl font-bold text-muted-foreground">VS</div>

            {/* Opponent */}
            <div className={`flex items-center gap-2.5 ${
              (type === 'completed' && winner === 'challenger' && isChallenger) || 
              (type === 'completed' && winner === 'opponent' && !isChallenger) ? 
              'ring-2 ring-yellow-500 rounded-lg p-1' : ''
            }`}>
              <Avatar className="h-9 w-9 border-2 border-secondary/20">
                <AvatarImage src={type === 'incoming' ? opponentProfile?.avatar_url : challenge.current_user_profile?.avatar_url} />
                <AvatarFallback className="text-sm font-medium bg-secondary/10 text-secondary-foreground">
                  {type === 'incoming' ? 
                    (opponentProfile?.full_name ? opponentProfile.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'C') :
                    (challenge.current_user_profile?.full_name ? challenge.current_user_profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'B')
                  }
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className={`font-semibold text-base ${
                  (type === 'completed' && winner === 'challenger' && isChallenger) || 
                  (type === 'completed' && winner === 'opponent' && !isChallenger) ? 
                  'text-yellow-600' : ''
                }`}>
                  {type === 'incoming' ? 
                    (opponentProfile?.full_name || 'Người thách đấu') : 
                    (type === 'open' ? 'Tìm đối thủ' : (challenge.current_user_profile?.full_name || 'Bạn'))
                  }
                  {((type === 'completed' && winner === 'challenger' && isChallenger) || 
                    (type === 'completed' && winner === 'opponent' && !isChallenger)) && 
                    <Trophy className="w-4 h-4 text-yellow-500 inline ml-1" />
                  }
                </span>
                <Badge variant="outline" className="text-xs w-fit">
                  {type === 'incoming' ? 
                    (opponentProfile?.verified_rank || opponentProfile?.current_rank || 'K') :
                    (challenge.current_user_profile?.verified_rank || challenge.current_user_profile?.current_rank || 'K')
                  }
                </Badge>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <Badge className={`${statusInfo.color} text-xs px-3 py-1 font-medium`}>
            {statusInfo.text}
          </Badge>
        </div>

        {/* Line 2: Match Details (Centered) */}
        <div className="flex items-center justify-center gap-3 text-sm font-medium bg-muted/30 rounded-lg py-2 px-4">
          <span className="flex items-center gap-1.5 text-orange-600">
            🏆 <span className="font-semibold">{challenge.bet_points || 0} SPA</span>
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="flex items-center gap-1.5 text-blue-600">
            🎯 <span>Race to <span className="font-semibold">{challenge.race_to || 5}</span></span>
            {(challenge.handicap_1_rank || challenge.handicap_05_rank) && (
              <span className="text-purple-600 font-medium ml-1">
                + Chấp {challenge.handicap_1_rank || challenge.handicap_05_rank}
              </span>
            )}
          </span>
           <span className="text-muted-foreground">•</span>
           <span className={`${challenge.status === 'completed' && winner ? 'text-yellow-600 font-bold' : 'text-green-600'}`}>
             Tỷ số: <span className="font-semibold">{getScoreText()}</span>
           </span>
           <span className="text-muted-foreground">•</span>
           <span className="flex items-center gap-1.5 text-gray-600">
             ⏰ <span className="font-medium">{getDisplayTime()}</span>
           </span>
        </div>

        {/* Message Section */}
        {challenge.message && (
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-start gap-2 text-sm">
              <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <span className="message-text">"{challenge.message}"</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {canRespond && onAccept && onDecline && (
            <>
              <Button 
                size="sm" 
                onClick={() => onAccept(challenge.id)}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Chấp nhận
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onDecline(challenge.id)}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Từ chối
              </Button>
            </>
          )}

          {canCancel && onCancel && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onCancel(challenge.id)}
              className="w-full"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Hủy thách đấu
            </Button>
          )}

          {type === 'open' && onJoin && (
            <Button 
              onClick={() => onJoin(challenge.id)}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Users className="w-4 h-4 mr-2" />
              Tham gia thách đấu
            </Button>
          )}

          {(type === 'active' || type === 'completed') && (
            <Button 
              variant="outline" 
              size="sm"
              className="w-full"
            >
              <Trophy className="w-4 h-4 mr-1" />
              Xem chi tiết
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChallengeCard;