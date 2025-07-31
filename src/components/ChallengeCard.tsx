import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Clock,
  Sword,
  CheckCircle,
  XCircle,
  Target,
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Challenge } from '@/types/challenge';
import { useChallenges } from '@/hooks/useChallenges';
import ThreeStepScoreWorkflow from '@/pages/challenges/components/score/ThreeStepScoreWorkflow';

interface ChallengeCardProps {
  challenge: Challenge;
  showActions?: boolean;
  onAction?: (action: string, challengeId: string) => void;
  isMyChallenge?: boolean;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  showActions = true,
  onAction,
  isMyChallenge = false,
}) => {
  const [loading, setLoading] = useState(false);
  const { respondToChallenge } = useChallenges();

  // Determine opponent/challenger based on context
  const opponent = isMyChallenge 
    ? (challenge.opponent_profile || challenge.opponent || challenge.challenged_profile)
    : (challenge.challenger_profile || challenge.challenger);

  // Use fallback opponent object for compatibility
  const opponentData = opponent || {
    id: challenge.opponent_id || challenge.challenger_id || '',
    user_id: challenge.opponent_id || challenge.challenger_id || '',
    full_name: 'Unknown Player',
    verified_rank: 'K',
    elo: 1000
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      await respondToChallenge.mutateAsync({
        challengeId: challenge.id,
        status: 'accepted',
      });
      onAction?.('accepted', challenge.id);
    } catch (error) {
      console.error('Error accepting challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      await respondToChallenge.mutateAsync({
        challengeId: challenge.id,
        status: 'declined',
      });
      onAction?.('declined', challenge.id);
    } catch (error) {
      console.error('Error declining challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ phản hồi';
      case 'accepted':
        return 'Đã chấp nhận';
      case 'declined':
        return 'Đã từ chối';
      case 'completed':
        return 'Đã hoàn thành';
      default:
        return 'Không xác định';
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Chưa xác định';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <Card className='bg-white shadow-sm hover:shadow-md transition-shadow'>
      <CardContent className='p-4'>
        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-3'>
            <Sword className='w-5 h-5 text-red-500' />
            <Badge className={getStatusColor(challenge.status)}>
              {getStatusText(challenge.status)}
            </Badge>
          </div>
          <div className='text-right'>
            <div className='text-sm font-semibold text-orange-600'>
              {challenge.bet_points} điểm
            </div>
            <div className='text-xs text-gray-500'>Tiền cược</div>
          </div>
        </div>

        {/* Opponent Info */}
        <div className='flex items-center space-x-3 mb-4'>
          <Avatar className='w-10 h-10'>
            <AvatarImage src={opponentData.avatar_url} />
            <AvatarFallback>
              {opponentData.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className='flex-1'>
            <h4 className='font-semibold'>{opponentData.full_name}</h4>
            <div className='flex items-center space-x-2 text-sm text-gray-600'>
              <span>Rank: {opponent?.verified_rank || opponent?.current_rank || 'K'}</span>
              <span>•</span>
              <span>ELO: {opponent?.elo || 1000}</span>
            </div>
          </div>
          <div className='text-right'>
            <div className='text-sm font-medium'>
              {isMyChallenge ? 'Bạn thách đấu' : 'Thách đấu bạn'}
            </div>
          </div>
        </div>

        {/* Challenge Details */}
        <div className='bg-gray-50 rounded-lg p-3 mb-4'>
          <div className='grid grid-cols-2 gap-3 text-sm'>
            <div className='flex items-center space-x-2'>
              <Calendar className='w-4 h-4 text-gray-400' />
              <span>{formatDateTime(challenge.created_at)}</span>
            </div>
            {challenge.club && (
              <div className='flex items-center space-x-2'>
                <MapPin className='w-4 h-4 text-gray-400' />
                <span className='truncate'>{challenge.club.name}</span>
              </div>
            )}
          </div>

          {challenge.message && (
            <div className='mt-3 p-2 bg-white rounded border-l-4 border-blue-500'>
              <p className='text-sm text-gray-700'>"{challenge.message}"</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {showActions && challenge.status === 'pending' && !isMyChallenge && (
          <div className='flex space-x-3'>
            <Button
              onClick={handleDecline}
              variant='outline'
              size='sm'
              disabled={loading}
              className='flex-1 text-red-600 border-red-200 hover:bg-red-50'
            >
              <XCircle className='w-4 h-4 mr-2' />
              Từ chối
            </Button>
            <Button
              onClick={handleAccept}
              size='sm'
              disabled={loading}
              className='flex-1 bg-green-500 hover:bg-green-600'
            >
              <CheckCircle className='w-4 h-4 mr-2' />
              Chấp nhận
            </Button>
          </div>
        )}

        {/* Status Messages */}
        {challenge.status === 'accepted' && (
          <>
            {/* Score workflow status display */}
            {(challenge.score_confirmation_status === 'score_entered' || 
              challenge.score_confirmation_status === 'score_confirmed') && (
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3'>
                <div className='flex items-center space-x-2 text-blue-700'>
                  <Target className='w-4 h-4' />
                  <span className='text-sm font-medium'>
                    {challenge.score_confirmation_status === 'score_entered' 
                      ? 'Đang chờ đối thủ xác nhận tỷ số'
                      : 'Đang chờ CLB xác nhận kết quả cuối cùng'
                    }
                  </span>
                </div>
                {challenge.score_entry_timestamp && (
                  <div className='mt-2 text-sm text-blue-600'>
                    Tỷ số đã nhập: {challenge.challenger_final_score || challenge.challenger_score || 0} - {challenge.opponent_final_score || challenge.opponent_score || 0}
                  </div>
                )}
              </div>
            )}

            {/* Default accepted message for challenges without score workflow */}
            {!challenge.score_confirmation_status || challenge.score_confirmation_status === 'pending' ? (
              <div className='bg-green-50 border border-green-200 rounded-lg p-3 mb-3'>
                <div className='flex items-center space-x-2 text-green-700'>
                  <CheckCircle className='w-4 h-4' />
                  <span className='text-sm font-medium'>
                    Thách đấu đã được chấp nhận! Hãy chuẩn bị cho trận đấu.
                  </span>
                </div>
                {challenge.accepted_at && (
                  <div className='mt-2 text-sm text-green-600'>
                    Thời gian xác nhận: {formatDateTime(challenge.accepted_at)}
                  </div>
                )}
              </div>
            ) : null}

            {/* Score workflow component */}
            <div className='mt-3'>
              <ThreeStepScoreWorkflow 
                challenge={challenge}
                isClubOwner={false} // This would need to be passed from parent or determined
                onScoreUpdated={() => {
                  // Refresh the challenge data
                  onAction?.('score_updated', challenge.id);
                }}
              />
            </div>
          </>
        )}

        {challenge.status === 'declined' && (
          <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
            <div className='flex items-center space-x-2 text-red-700'>
              <XCircle className='w-4 h-4' />
              <span className='text-sm font-medium'>
                Thách đấu đã bị từ chối.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
