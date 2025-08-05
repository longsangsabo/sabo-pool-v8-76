import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEnhancedNotifications } from '@/hooks/useEnhancedNotifications';

const NotificationCenter = () => {
  const { notifications, isLoading, markAsRead, markAllAsRead, unreadCount } =
    useEnhancedNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 border-red-200';
      case 'high':
        return 'bg-orange-100 border-orange-200';
      default:
        return 'bg-gray-100 border-gray-200';
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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='icon' className='relative'>
          <Bell className='h-5 w-5' />
          {unreadCount > 0 && (
            <Badge
              variant='destructive'
              className='absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs'
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80 p-0' align='end'>
        <Card className='border-0 shadow-lg'>
          <CardHeader className='border-b'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-lg'>Thông báo</CardTitle>
              <div className='flex items-center gap-2'>
                {unreadCount > 0 && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => markAllAsRead.mutate()}
                    className='text-xs'
                  >
                    <CheckCheck className='h-3 w-3 mr-1' />
                    Đọc tất cả
                  </Button>
                )}
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => setIsOpen(false)}
                  className='h-6 w-6'
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            <ScrollArea className='h-96'>
              {notifications.length === 0 ? (
                <div className='p-6 text-center text-gray-500'>
                  <Bell className='h-12 w-12 mx-auto mb-2 text-gray-300' />
                  <p>Chưa có thông báo nào</p>
                </div>
              ) : (
                <div className='divide-y'>
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.is_read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className='flex items-start gap-3'>
                        <div
                          className={`w-2 h-2 rounded-full mt-2 ${
                            !notification.is_read
                              ? 'bg-blue-500'
                              : 'bg-gray-300'
                          }`}
                        />
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start justify-between gap-2'>
                            <h4 className='font-medium text-sm leading-tight'>
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <Button
                                variant='ghost'
                                size='icon'
                                onClick={() =>
                                  markAsRead.mutate(notification.id)
                                }
                                className='h-6 w-6 shrink-0'
                              >
                                <Check className='h-3 w-3' />
                              </Button>
                            )}
                          </div>
                          <p className='text-sm text-gray-600 mt-1 line-clamp-2'>
                            {notification.message}
                          </p>
                          <div className='flex items-center justify-between mt-2'>
                            <span className='text-xs text-gray-500'>
                              {formatTimeAgo(notification.created_at || '')}
                            </span>
                            {notification.priority &&
                              notification.priority !== 'low' && (
                                <Badge
                                  variant='outline'
                                  className={`text-xs ${getPriorityColor(notification.priority)}`}
                                >
                                  {notification.priority === 'high'
                                    ? 'Cao'
                                    : 'Thường'}
                                </Badge>
                              )}
                          </div>
                          {notification.action_url && (
                            <Button
                              variant='link'
                              size='sm'
                              className='p-0 h-auto text-xs mt-2'
                              onClick={() => {
                                window.location.href = notification.action_url!;
                                setIsOpen(false);
                              }}
                            >
                              Xem chi tiết →
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {notifications.length > 0 && (
                <div className='p-3 border-t text-center'>
                  <Button
                    variant='link'
                    size='sm'
                    onClick={() => {
                      navigate('/notifications');
                      setIsOpen(false);
                    }}
                  >
                    Xem tất cả thông báo →
                  </Button>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
