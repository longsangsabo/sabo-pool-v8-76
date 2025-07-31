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
} from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import { useChallenges } from '@/hooks/useChallenges';

interface EnhancedChallengeCardProps {
  challenge: {
    id: string;
    challenger_id: string;
    challenged_id: string;
    status: string;
    bet_points: number;
    proposed_datetime: string;
    confirmed_datetime?: string;
    message?: string;
    proposed_club_id?: string;
    confirmed_club_id?: string;
    challenger_profile?: {
      user_id: string;
      full_name: string;
      avatar_url?: string;
      current_rank: string;
      ranking_points?: number;
    };
    challenged_profile?: {
      user_id: string;
      full_name: string;
      avatar_url?: string;
      current_rank: string;
      ranking_points?: number;
    };
    club?: {
      id: string;
      name: string;
      address: string;
    };
  };
  isMyChallenge?: boolean;
  onAction?: (action: string, challengeId: string) => void;
}

export const EnhancedChallengeCard: React.FC<EnhancedChallengeCardProps> = ({
  challenge,
  isMyChallenge = false,
  onAction,
}) => {
  const [loading, setLoading] = useState(false);
  const { respondToChallenge } = useChallenges();

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
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const opponent = isMyChallenge
    ? challenge.challenged_profile
    : challenge.challenger_profile;

  // Transform opponent data to match UserAvatar expectations
  const transformedUser = opponent
      ? {
        name: opponent.full_name,
        avatar: opponent.avatar_url,
        rank: opponent.current_rank || 'K',
        ranking_points: opponent.ranking_points || 0,
        win_rate: 0, // Default value
      }
    : null;

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
        {transformedUser && (
          <div className='flex items-center space-x-3 mb-4'>
            <UserAvatar user={transformedUser} size='md' showRank={true} />
            <div className='flex-1'>
              <h4 className='font-semibold'>{transformedUser.name}</h4>
              <div className='flex items-center space-x-2 text-sm text-gray-600'>
                <span>Rank: {transformedUser.rank}</span>
                <span>•</span>
                <span>{transformedUser.ranking_points} điểm</span>
              </div>
            </div>
            <div className='text-right'>
              <div className='text-sm font-medium'>
                {isMyChallenge ? 'Bạn thách đấu' : 'Thách đấu bạn'}
              </div>
            </div>
          </div>
        )}

        {/* Challenge Details */}
        <div className='bg-gray-50 rounded-lg p-3 mb-4'>
          <div className='grid grid-cols-2 gap-3 text-sm'>
            <div className='flex items-center space-x-2'>
              <Calendar className='w-4 h-4 text-gray-400' />
              <span>{formatDateTime(challenge.proposed_datetime)}</span>
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
        {challenge.status === 'pending' && !isMyChallenge && (
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

        {challenge.status === 'accepted' && (
          <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
            <div className='flex items-center space-x-2 text-green-700'>
              <CheckCircle className='w-4 h-4' />
              <span className='text-sm font-medium'>
                Thách đấu đã được chấp nhận! Hãy chuẩn bị cho trận đấu.
              </span>
            </div>
            {challenge.confirmed_datetime && (
              <div className='mt-2 text-sm text-green-600'>
                Thời gian xác nhận:{' '}
                {formatDateTime(challenge.confirmed_datetime)}
              </div>
            )}
          </div>
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
