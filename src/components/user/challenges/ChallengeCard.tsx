import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '../profile';
import {
  Clock,
  Users,
  Trophy,
  Target,
  CheckCircle,
  AlertCircle,
  Swords,
} from 'lucide-react';

interface ChallengeCardProps {
  challenge: {
    id: string;
    challenger_id: string;
    opponent_id: string;
    status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
    stake_amount: number;
    challenge_type: string;
    message?: string;
    created_at: string;
    winner_id?: string;
    challenger_profile?: {
      full_name: string;
      display_name?: string;
      avatar_url?: string;
      verified_rank?: string;
    };
    opponent_profile?: {
      full_name: string;
      display_name?: string;
      avatar_url?: string;
      verified_rank?: string;
    };
  };
  currentUserId?: string;
  onAccept?: (challengeId: string) => void;
  onDecline?: (challengeId: string) => void;
  onCancel?: (challengeId: string) => void;
  className?: string;
}) => {
}

const ChallengeCard = ({
  challenge,
  currentUserId,
  onAccept,
  onDecline,
  onCancel,
  className
}: ChallengeCardProps) => {
  const isChallenger = challenge.challenger_id === currentUserId;
  const opponent = isChallenger ? challenge.opponent_profile : challenge.challenger_profile;
  
  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'Chờ phản hồi', color: 'bg-yellow-100 text-yellow-800' },
      accepted: { label: 'Đã chấp nhận', color: 'bg-green-100 text-green-800' },
      declined: { label: 'Đã từ chối', color: 'bg-red-100 text-red-800' },
      completed: { label: 'Đã hoàn thành', color: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-800' },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap];
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getChallengeTypeLabel = (type: string) => {
    const typeMap = {
      friendly: 'Giao hữu',
      ranked: 'Xếp hạng',
      tournament: 'Giải đấu',
      practice: 'Luyện tập',
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-4">
            <UserAvatar
              user={{
                id: isChallenger ? challenge.opponent_id : challenge.challenger_id,
                name: opponent?.display_name || opponent?.full_name || 'Unknown',
                avatar: opponent?.avatar_url,
                rank: opponent?.verified_rank,
              }}
              size="lg"
              showRank={true}
            />
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Swords className="h-4 w-4" />
                {isChallenger ? 'Thách đấu với' : 'Thách đấu từ'} {opponent?.display_name || opponent?.full_name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Trophy className="h-4 w-4" />
                <span>{getChallengeTypeLabel(challenge.challenge_type)}</span>
                <span>•</span>
                <Target className="h-4 w-4" />
                <span>{challenge.stake_amount.toLocaleString()} điểm</span>
              </div>
            </div>
          </div>
          {getStatusBadge(challenge.status)}
        </div>

        {challenge.message && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
            <p className="text-gray-700 italic">"{challenge.message}"</p>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>
              {new Date(challenge.created_at).toLocaleDateString('vi-VN')} {' '}
              {new Date(challenge.created_at).toLocaleTimeString('vi-VN', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
          {opponent?.verified_rank && (
            <Badge variant="outline" className="text-xs">
              Rank: {opponent.verified_rank}
            </Badge>
          )}
        </div>

        {/* Action buttons */}
        {challenge.status === 'pending' && (
          <div className="flex gap-2">
            {!isChallenger ? (
              // Received challenge - can accept/decline
              <>
                <Button
                  onClick={() => onAccept?.(challenge.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Chấp nhận
                </Button>
                <Button
                  onClick={() => onDecline?.(challenge.id)}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Từ chối
                </Button>
              </>
            ) : (
              // Sent challenge - can cancel
              <Button
                onClick={() => onCancel?.(challenge.id)}
                variant="outline"
                className="w-full"
                size="sm"
              >
                Hủy thách đấu
              </Button>
            )}
          </div>
        )}

        {challenge.status === 'accepted' && (
          <div className="bg-green-50 p-3 rounded border border-green-200">
            <p className="text-green-800 text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Thách đấu đã được chấp nhận. Hãy liên hệ để sắp xếp thời gian thi đấu.
            </p>
          </div>
        )}

        {challenge.status === 'completed' && challenge.winner_id && (
          <div className={`p-3 rounded border ${
            challenge.winner_id === currentUserId 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <p className={`text-sm flex items-center gap-2 ${
              challenge.winner_id === currentUserId ? 'text-green-800' : 'text-red-800'
            }`}>
              <Trophy className="h-4 w-4" />
              {challenge.winner_id === currentUserId ? '🎉 Bạn đã thắng!' : '😔 Bạn đã thua'}
            </p>
          </div>
        )}

        {challenge.status === 'declined' && (
          <div className="bg-red-50 p-3 rounded border border-red-200">
            <p className="text-red-800 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Thách đấu đã bị từ chối
            </p>
          </div>
        )}

        {challenge.status === 'cancelled' && (
          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            <p className="text-gray-800 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Thách đấu đã bị hủy
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChallengeCard;
