import React, { useState } from 'react';
import { Clock, User, MapPin, Trophy, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import UserAvatar from './UserAvatar';
import ChallengeResponseModal from './ChallengeResponseModal';
import { Challenge } from '@/types/common';

interface NotificationCardProps {
  notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    read_at?: string;
    created_at: string;
    challenge?: {
      id: string;
      bet_points: number;
      message?: string;
      status: string;
      challenger: {
        user_id: string;
        full_name: string;
        avatar_url?: string;
        verified_rank: string;
      };
    };
  };
  onMarkAsRead: (id: string) => void;
  onRespond?: (
    challengeId: string,
    status: 'accepted' | 'declined',
    proposalData?: Record<string, any>
  ) => void;
}

const EnhancedNotificationCard = ({
  notification,
  onMarkAsRead,
  onRespond,
}: NotificationCardProps) => {
  const [showResponseModal, setShowResponseModal] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 border-red-200 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-200 text-orange-800';
      case 'normal':
        return 'bg-blue-100 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'challenge_received':
        return <Trophy className='w-5 h-5 text-blue-600' />;
      case 'challenge_accepted':
        return <Trophy className='w-5 h-5 text-green-600' />;
      case 'match_scheduled':
        return <MapPin className='w-5 h-5 text-purple-600' />;
      default:
        return <Bell className='w-5 h-5 text-gray-600' />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
  };

  const handleRespond = (
    status: 'accepted' | 'declined',
    proposalData?: Record<string, any>
  ) => {
    if (onRespond && notification.challenge) {
      onRespond(notification.challenge.id, status, proposalData);
      setShowResponseModal(false);
    }
  };

  return (
    <>
      <Card
        className={`transition-all hover:shadow-md ${
          !notification.read_at ? 'bg-blue-50 border-blue-200' : 'bg-white'
        }`}
      >
        <CardContent className='p-4'>
          <div className='flex items-start space-x-3'>
            <div className='flex-shrink-0'>
              {notification.challenge ? (
                <UserAvatar
                  user={{
                    name: notification.challenge.challenger.full_name,
                    avatar:
                      notification.challenge.challenger.avatar_url ||
                      '/placeholder.svg',
                    rank: notification.challenge.challenger.verified_rank,
                  }}
                  size='md'
                />
              ) : (
                <div className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center'>
                  {getTypeIcon(notification.type)}
                </div>
              )}
            </div>

            <div className='flex-1 min-w-0'>
              <div className='flex items-start justify-between gap-2 mb-2'>
                <h4 className='font-semibold text-gray-900 text-sm leading-tight'>
                  {notification.title}
                </h4>
                <div className='flex items-center space-x-2 flex-shrink-0'>
                  {notification.priority !== 'normal' && (
                    <Badge
                      className={`text-xs ${getPriorityColor(notification.priority)}`}
                    >
                      {notification.priority === 'urgent'
                        ? 'Khẩn cấp'
                        : notification.priority === 'high'
                          ? 'Cao'
                          : 'Thường'}
                    </Badge>
                  )}
                  {!notification.read_at && (
                    <button
                      onClick={() => onMarkAsRead(notification.id)}
                      className='w-2 h-2 bg-blue-500 rounded-full'
                      title='Đánh dấu đã đọc'
                    />
                  )}
                </div>
              </div>

              <p className='text-sm text-gray-600 mb-2 line-clamp-2'>
                {notification.message}
              </p>

              {notification.challenge && (
                <div className='bg-gray-50 rounded-lg p-3 mb-3'>
                  <div className='flex justify-between items-center text-sm'>
                    <span className='text-gray-600'>Mức cược:</span>
                    <span className='font-bold text-blue-600'>
                      {notification.challenge.bet_points} điểm
                    </span>
                  </div>
                  {notification.challenge.message && (
                    <p className='message-text mt-1'>
                      "{notification.challenge.message}"
                    </p>
                  )}
                </div>
              )}

              <div className='flex items-center justify-between'>
                <div className='flex items-center text-xs text-gray-500'>
                  <Clock className='w-3 h-3 mr-1' />
                  {formatTimeAgo(notification.created_at)}
                </div>

                {notification.type === 'challenge_received' &&
                  notification.challenge?.status === 'pending' && (
                    <Button
                      onClick={() => setShowResponseModal(true)}
                      size='sm'
                      className='bg-blue-500 hover:bg-blue-600 text-white'
                    >
                      Phản hồi
                    </Button>
                  )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Challenge Response Modal */}
      {notification.challenge && (
        <ChallengeResponseModal
          challenge={
            {
              ...notification.challenge,
              challenger_id: notification.challenge.challenger.user_id,
              challenged_id: '', // Add default value
            } as Challenge
          }
          suggestedClubs={[]} // Add empty array as default
          isOpen={showResponseModal}
          onClose={() => setShowResponseModal(false)}
          onRespond={handleRespond}
        />
      )}
    </>
  );
};

export default EnhancedNotificationCard;
