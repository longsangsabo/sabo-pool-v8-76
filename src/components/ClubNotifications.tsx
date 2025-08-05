import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Bell,
  Trophy,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface ClubNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

const ClubNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ClubNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .in('type', [
          'rank_verification_request',
          'new_match',
          'member_promoted',
          'club_member_joined',
          'club_stats_update',
        ])
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const transformedNotifications: ClubNotification[] = (data || []).map(
        n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          created_at: n.created_at,
          is_read: n.is_read,
        })
      );

      setNotifications(transformedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Lỗi khi tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Lỗi khi đánh dấu đã đọc');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'rank_verification_request':
        return <Trophy className='w-4 h-4 text-blue-500' />;
      case 'rank_verification_approved':
        return <CheckCircle className='w-4 h-4 text-green-500' />;
      case 'rank_verification_rejected':
        return <AlertTriangle className='w-4 h-4 text-red-500' />;
      case 'club_member_joined':
        return <Users className='w-4 h-4 text-purple-500' />;
      default:
        return <Bell className='w-4 h-4 text-gray-500' />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (activeTab) {
      case 'unread':
        return !notification.is_read;
      case 'rank':
        return (
          notification.type === 'rank_verification_request' ||
          notification.type === 'member_promoted'
        );
      case 'member':
        return (
          notification.type === 'club_member_joined' ||
          notification.type === 'new_match'
        );
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2'></div>
            <p className='text-sm text-muted-foreground'>
              Đang tải thông báo...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Bell className='w-5 h-5' />
            Thông báo CLB
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={markAllAsRead}
            disabled={notifications.every(n => n.is_read)}
          >
            Đánh dấu tất cả đã đọc
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='all'>
              Tất cả ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value='unread'>
              Chưa đọc ({notifications.filter(n => !n.is_read).length})
            </TabsTrigger>
            <TabsTrigger value='rank'>Xác thực hạng</TabsTrigger>
            <TabsTrigger value='member'>Thành viên</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className='mt-6'>
            {filteredNotifications.length === 0 ? (
              <div className='text-center py-8 text-muted-foreground'>
                <Bell className='w-12 h-12 mx-auto mb-4 text-muted-foreground/50' />
                <p className='font-medium'>Không có thông báo</p>
                <p className='text-sm mt-1'>
                  {activeTab === 'unread'
                    ? 'Tất cả thông báo đã được đọc'
                    : 'Không có thông báo nào trong danh mục này'}
                </p>
              </div>
            ) : (
              <div className='space-y-4'>
                {filteredNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      !notification.is_read
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex items-start gap-3 flex-1'>
                        {getNotificationIcon(notification.type)}
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-1'>
                            <h3 className='font-semibold text-sm'>
                              {notification.title}
                            </h3>
                            {!notification.is_read && (
                              <Badge variant='secondary' className='text-xs'>
                                Mới
                              </Badge>
                            )}
                          </div>
                          <p className='text-sm text-muted-foreground mb-2'>
                            {notification.message}
                          </p>
                          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                            <Clock className='w-3 h-3' />
                            {new Date(notification.created_at).toLocaleString(
                              'vi-VN'
                            )}
                          </div>
                        </div>
                      </div>
                      {!notification.is_read && (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => markAsRead(notification.id)}
                        >
                          Đánh dấu đã đọc
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ClubNotifications;
