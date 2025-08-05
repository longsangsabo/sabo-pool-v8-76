import React from 'react';
import { Bell, Trophy, Users, Calendar, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NotificationToastProps {
  title: string;
  message: string;
  type: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}

const NotificationToast = ({
  title,
  message,
  type,
  priority = 'normal',
  actionUrl,
  onAction,
  onDismiss,
}: NotificationToastProps) => {
  const getIcon = () => {
    switch (type) {
      case 'challenge_received':
        return <Zap className='w-5 h-5 text-blue-600' />;
      case 'challenge_accepted':
        return <Trophy className='w-5 h-5 text-green-600' />;
      case 'match_scheduled':
        return <Calendar className='w-5 h-5 text-purple-600' />;
      case 'tournament_invite':
        return <Users className='w-5 h-5 text-orange-600' />;
      default:
        return <Bell className='w-5 h-5 text-gray-600' />;
    }
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'normal':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div
      className={`rounded-lg border-l-4 p-4 shadow-lg bg-white ${getPriorityColor()}`}
    >
      <div className='flex items-start space-x-3'>
        <div className='flex-shrink-0 mt-0.5'>{getIcon()}</div>

        <div className='flex-1 min-w-0'>
          <div className='flex items-start justify-between'>
            <div>
              <h4 className='font-semibold text-gray-900 text-sm'>{title}</h4>
              {priority !== 'normal' && (
                <Badge
                  variant='secondary'
                  className={`text-xs mt-1 ${
                    priority === 'urgent'
                      ? 'bg-red-100 text-red-800'
                      : priority === 'high'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {priority === 'urgent'
                    ? 'Khẩn cấp'
                    : priority === 'high'
                      ? 'Quan trọng'
                      : 'Thông thường'}
                </Badge>
              )}
            </div>
          </div>

          <p className='text-sm text-gray-600 mt-1 line-clamp-2'>{message}</p>

          {(onAction || actionUrl) && (
            <div className='mt-3 flex space-x-2'>
              <Button size='sm' onClick={onAction} className='text-xs'>
                {type === 'challenge_received' ? 'Phản hồi' : 'Xem chi tiết'}
              </Button>
              {onDismiss && (
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={onDismiss}
                  className='text-xs'
                >
                  Bỏ qua
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
