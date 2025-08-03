import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Notification } from '@/types/common';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [deletedNotifications, setDeletedNotifications] = useState<
    Notification[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // Fetch active notifications (not deleted)
      const { data: activeData, error: activeError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (activeError) throw activeError;

      // Fetch deleted notifications
      const { data: deletedData, error: deletedError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
        .limit(20);

      if (deletedError) throw deletedError;

      // Transform active notifications
      const transformedNotifications: Notification[] = (activeData || []).map(
        notification => ({
          id: notification.id,
          user_id: notification.user_id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          created_at: notification.created_at,
          read_at: notification.is_read ? notification.updated_at : undefined,
          priority:
            (notification.priority as 'low' | 'medium' | 'high') || 'medium',
          action_url: notification.action_url,
          metadata: {},
        })
      );

      // Transform deleted notifications
      const transformedDeletedNotifications: Notification[] = (
        deletedData || []
      ).map(notification => ({
        id: notification.id,
        user_id: notification.user_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        created_at: notification.created_at,
        read_at: notification.is_read ? notification.updated_at : undefined,
        priority:
          (notification.priority as 'low' | 'medium' | 'high') || 'medium',
        action_url: notification.action_url,
        metadata: {},
        deleted_at: notification.deleted_at,
      }));

      setNotifications(transformedNotifications);
      setDeletedNotifications(transformedDeletedNotifications);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read_at: new Date().toISOString() }
            : notification
        )
      );
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .in('id', unreadIds)
        .eq('user_id', user.id);

      if (error) throw error;

      const now = new Date().toISOString();
      setNotifications(prev =>
        prev.map(notification =>
          notification.read_at
            ? notification
            : { ...notification, read_at: now }
        )
      );
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user) return;

    try {
      // Soft delete by setting deleted_at timestamp
      const { error } = await supabase
        .from('notifications')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Move notification from active to deleted list
      const deletedNotification = notifications.find(
        n => n.id === notificationId
      );
      if (deletedNotification) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setDeletedNotifications(prev => [
          ...prev,
          { ...deletedNotification, deleted_at: new Date().toISOString() },
        ]);
      }
    } catch (err: any) {
      console.error('Error deleting notification:', err);
    }
  };

  const restoreNotification = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ deleted_at: null })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Move notification from deleted to active list
      const restoredNotification = deletedNotifications.find(
        n => n.id === notificationId
      );
      if (restoredNotification) {
        setDeletedNotifications(prev =>
          prev.filter(n => n.id !== notificationId)
        );
        const { deleted_at, ...cleanNotification } =
          restoredNotification as any;
        setNotifications(prev => [cleanNotification, ...prev]);
      }
    } catch (err: any) {
      console.error('Error restoring notification:', err);
    }
  };

  const permanentlyDeleteNotification = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      setDeletedNotifications(prev =>
        prev.filter(n => n.id !== notificationId)
      );
    } catch (err: any) {
      console.error('Error permanently deleting notification:', err);
    }
  };

  const getReadCount = () => {
    return notifications.filter(notification => notification.read_at).length;
  };

  const getDeletedCount = () => {
    return deletedNotifications.length;
  };

  const getUnreadCount = () => {
    return notifications.filter(notification => !notification.read_at).length;
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return {
    notifications,
    deletedNotifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    restoreNotification,
    permanentlyDeleteNotification,
    getUnreadCount,
    getReadCount,
    getDeletedCount,
  };
};
