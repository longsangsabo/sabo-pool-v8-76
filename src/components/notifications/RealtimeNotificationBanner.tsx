import React, { useState, useEffect } from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Bell, X, CheckCircle, AlertCircle, Info, Trophy } from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface RealtimeNotificationBannerProps {
  onNotificationClick?: (notification: Notification) => void;
}

export const RealtimeNotificationBanner: React.FC<
  RealtimeNotificationBannerProps
> = ({ onNotificationClick }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Simulate real-time notifications
    const interval = setInterval(() => {
      const mockNotifications: Notification[] = [
        {
          id: Date.now().toString(),
          type: 'success',
          title: 'Thành tích mới!',
          message: 'Bạn đã đạt được thành tích "Chiến thắng liên tiếp"',
          timestamp: new Date(),
          action: {
            label: 'Xem',
          },
        },
        {
          id: (Date.now() + 1).toString(),
          type: 'info',
          title: 'Giải đấu sắp diễn ra',
          message: 'Giải đấu mùa xuân sẽ bắt đầu trong 2 giờ',
          timestamp: new Date(),
          action: {
            label: 'Tham gia',
          },
        },
      ];

      setNotifications(prev => [
        ...prev.slice(-2),
        ...mockNotifications.slice(0, 1),
      ]);
      setIsVisible(true);
    }, 10000); // Show notification every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className='h-4 w-4 text-green-600' />;
      case 'error':
        return <AlertCircle className='h-4 w-4 text-red-600' />;
      case 'warning':
        return <AlertCircle className='h-4 w-4 text-yellow-600' />;
      case 'info':
        return <Info className='h-4 w-4 text-blue-600' />;
      default:
        return <Bell className='h-4 w-4 text-gray-600' />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const handleDismiss = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (notifications.length <= 1) {
      setIsVisible(false);
    }
  };

  const handleAction = (notification: Notification) => {
    notification.action?.onClick();
    handleDismiss(notification.id);
    onNotificationClick?.(notification);
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className='fixed top-4 left-4 right-4 z-50 max-w-md mx-auto'>
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`mb-2 p-4 rounded-lg border shadow-lg animate-in slide-in-from-top-2 duration-300 ${getNotificationColor(notification.type)}`}
        >
          <div className='flex items-start gap-3'>
            <div className='flex-shrink-0 mt-0.5'>
              {getNotificationIcon(notification.type)}
            </div>

            <div className='flex-1 min-w-0'>
              <div className='flex items-center justify-between mb-1'>
                <h4 className='font-medium text-sm'>{notification.title}</h4>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handleDismiss(notification.id)}
                  className='h-6 w-6 p-0 opacity-70 hover:opacity-100'
                >
                  <X className='h-3 w-3' />
                </Button>
              </div>

              <p className='text-sm opacity-90 mb-2'>{notification.message}</p>

              <div className='flex items-center justify-between'>
                <span className='text-xs opacity-75'>
                  {notification.timestamp.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>

                {notification.action && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleAction(notification)}
                    className='h-6 px-2 text-xs'
                  >
                    {notification.action.label}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
