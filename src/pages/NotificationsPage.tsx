import React, { useState } from 'react';
import { useEnhancedNotifications } from '@/hooks/useEnhancedNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Zap,
  Trophy,
  Users,
  Calendar,
  Star,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const NotificationsPage = () => {
  const { notifications, isLoading, markAsRead, markAllAsRead, unreadCount } =
    useEnhancedNotifications();
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'challenge_received':
      case 'challenge_accepted':
      case 'challenge_rejected':
        return <Zap className='h-4 w-4 text-blue-600' />;
      case 'tournament_invite':
        return <Trophy className='h-4 w-4 text-yellow-600' />;
      case 'match_reminder':
      case 'match_result_request':
        return <Calendar className='h-4 w-4 text-green-600' />;
      case 'rank_verification_approved':
      case 'rank_verification_rejected':
        return <Star className='h-4 w-4 text-purple-600' />;
      case 'trust_score_warning':
      case 'penalty_received':
        return <AlertCircle className='h-4 w-4 text-red-600' />;
      default:
        return <Bell className='h-4 w-4 text-gray-600' />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'challenge_received':
      case 'challenge_accepted':
      case 'challenge_rejected':
        return 'bg-blue-50 border-blue-200';
      case 'tournament_invite':
        return 'bg-yellow-50 border-yellow-200';
      case 'match_reminder':
      case 'match_result_request':
        return 'bg-green-50 border-green-200';
      case 'rank_verification_approved':
      case 'rank_verification_rejected':
        return 'bg-purple-50 border-purple-200';
      case 'trust_score_warning':
      case 'penalty_received':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return (
          <Badge variant='destructive' className='text-xs animate-pulse'>
            Khẩn cấp
          </Badge>
        );
      case 'high':
        return (
          <Badge
            variant='secondary'
            className='text-xs bg-orange-100 text-orange-800'
          >
            Quan trọng
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }

    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.is_read;
    return notification.type.includes(activeTab);
  });

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>Thông báo</h1>
          <p className='text-gray-600'>
            Quản lý và theo dõi tất cả thông báo của bạn
          </p>
        </div>

        <Card>
          <CardHeader className='border-b'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
              <CardTitle className='flex items-center gap-2'>
                <Bell className='h-5 w-5' />
                Thông báo
                {unreadCount > 0 && (
                  <Badge className='bg-red-500 text-white'>{unreadCount}</Badge>
                )}
              </CardTitle>

              <div className='flex items-center gap-2'>
                {unreadCount > 0 && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => markAllAsRead.mutate()}
                    disabled={markAllAsRead.isPending}
                  >
                    <CheckCheck className='h-4 w-4 mr-2' />
                    Đọc tất cả
                  </Button>
                )}
                <Button variant='outline' size='sm'>
                  <Filter className='h-4 w-4 mr-2' />
                  Lọc
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className='p-0'>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className='border-b'>
                <TabsList className='grid w-full grid-cols-4 rounded-none h-12'>
                  <TabsTrigger value='all' className='rounded-none'>
                    Tất cả
                  </TabsTrigger>
                  <TabsTrigger value='unread' className='rounded-none'>
                    Chưa đọc ({unreadCount})
                  </TabsTrigger>
                  <TabsTrigger value='challenge' className='rounded-none'>
                    Thách đấu
                  </TabsTrigger>
                  <TabsTrigger value='tournament' className='rounded-none'>
                    Giải đấu
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab} className='mt-0'>
                <ScrollArea className='h-[600px]'>
                  {filteredNotifications.length > 0 ? (
                    <div className='divide-y'>
                      {filteredNotifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`p-4 transition-colors cursor-pointer hover:bg-gray-50 ${
                            !notification.is_read
                              ? 'bg-blue-50 border-l-4 border-l-blue-500'
                              : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className='flex items-start gap-3'>
                            <div className='flex-shrink-0 mt-1'>
                              {getNotificationIcon(notification.type)}
                            </div>

                            <div className='flex-1 min-w-0'>
                              <div className='flex items-start justify-between gap-2 mb-1'>
                                <div className='flex items-center gap-2'>
                                  <h4 className='font-medium text-sm text-gray-900'>
                                    {notification.title}
                                  </h4>
                                  {!notification.is_read && (
                                    <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                                  )}
                                </div>
                                {getPriorityBadge(notification.priority)}
                              </div>

                              <p className='text-sm text-gray-600 mb-2 line-clamp-2'>
                                {notification.message}
                              </p>

                              <div className='flex items-center justify-between'>
                                <span className='text-xs text-gray-500'>
                                  {formatDistanceToNow(
                                    new Date(notification.created_at),
                                    {
                                      addSuffix: true,
                                      locale: vi,
                                    }
                                  )}
                                </span>

                                <div className='flex items-center gap-1'>
                                  {!notification.is_read && (
                                    <Button
                                      variant='ghost'
                                      size='sm'
                                      onClick={e => {
                                        e.stopPropagation();
                                        markAsRead.mutate(notification.id);
                                      }}
                                      className='h-8 w-8 p-0'
                                    >
                                      <Check className='h-3 w-3' />
                                    </Button>
                                  )}
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={e => {
                                      e.stopPropagation();
                                      // TODO: Add delete functionality
                                    }}
                                    className='h-8 w-8 p-0 text-red-500 hover:text-red-700'
                                  >
                                    <Trash2 className='h-3 w-3' />
                                  </Button>
                                </div>
                              </div>

                              {notification.action_url && (
                                <Button
                                  variant='link'
                                  size='sm'
                                  className='p-0 h-auto text-xs mt-2 text-blue-600'
                                >
                                  Xem chi tiết →
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='text-center py-12'>
                      <Bell className='h-12 w-12 mx-auto mb-4 text-gray-300' />
                      <h3 className='text-lg font-medium text-gray-900 mb-2'>
                        Không có thông báo
                      </h3>
                      <p className='text-gray-500'>
                        {activeTab === 'unread'
                          ? 'Bạn đã đọc hết tất cả thông báo'
                          : 'Chưa có thông báo nào trong danh mục này'}
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationsPage;
