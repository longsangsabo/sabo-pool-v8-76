import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface NotificationSummary {
  total_unread: number;
  high_priority_unread: number;
  recent_notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    created_at: string;
    priority: string;
  }> | null;
}

export const useEnhancedNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [highPriorityCount, setHighPriorityCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markAsReadPending, setMarkAsReadPending] = useState(false);
  const [markAllAsReadPending, setMarkAllAsReadPending] = useState(false);

  // Fetch notification summary using the new database function
  const fetchNotificationSummary = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_notification_summary', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching notification summary:', error);
        return;
      }

      // Safely handle the response
      if (data && typeof data === 'object') {
        const summary = data as unknown as NotificationSummary;
        setUnreadCount(summary.total_unread || 0);
        setHighPriorityCount(summary.high_priority_unread || 0);
        setNotifications(summary.recent_notifications || []);
      }
    } catch (error) {
      console.error('Error in fetchNotificationSummary:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Mark notifications as read using the batch function
  const markNotificationsAsRead = useCallback(
    async (notificationIds: string[]) => {
      if (!notificationIds.length) return;

      try {
        const { error } = await supabase.rpc('mark_notifications_read', {
          p_user_id: user.id,
          p_notification_ids: notificationIds,
        });

        if (error) {
          console.error('Error marking notifications as read:', error);
          return;
        }

        // Update local state
        setNotifications(prev =>
          prev.map(notif =>
            notificationIds.includes(notif.id)
              ? { ...notif, is_read: true }
              : notif
          )
        );

        // Refresh summary to get accurate counts
        await fetchNotificationSummary();
      } catch (error) {
        console.error('Error in markNotificationsAsRead:', error);
      }
    },
    [fetchNotificationSummary]
  );

  // Mark single notification as read with mutation API
  const markAsRead = useMemo(
    () => ({
      mutate: async (notificationId: string) => {
        setMarkAsReadPending(true);
        try {
          await markNotificationsAsRead([notificationId]);
        } finally {
          setMarkAsReadPending(false);
        }
      },
      isPending: markAsReadPending,
    }),
    [markNotificationsAsRead, markAsReadPending]
  );

  // Mark all notifications as read with mutation API
  const markAllAsRead = useMemo(
    () => ({
      mutate: async () => {
        setMarkAllAsReadPending(true);
        try {
          const unreadIds = notifications
            .filter(notif => !notif.is_read)
            .map(notif => notif.id);

          if (unreadIds.length > 0) {
            await markNotificationsAsRead(unreadIds);
          }
        } finally {
          setMarkAllAsReadPending(false);
        }
      },
      isPending: markAllAsReadPending,
    }),
    [notifications, markNotificationsAsRead, markAllAsReadPending]
  );

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up enhanced notification subscription');

    // Initial fetch
    fetchNotificationSummary();

    // Set up real-time subscription
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          console.log('Real-time notification update:', payload);

          // Refresh the summary to get accurate counts and latest notifications
          fetchNotificationSummary();

          // Show toast for new high-priority notifications
          if (
            payload.eventType === 'INSERT' &&
            payload.new.priority === 'high'
          ) {
            // You can add a toast notification here if needed
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up enhanced notification subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchNotificationSummary]);

  return {
    notifications,
    unreadCount,
    highPriorityCount,
    loading,
    isLoading: loading, // Alias for compatibility
    isConnected: true, // Always connected in this implementation
    fetchNotificationSummary,
    markNotificationsAsRead,
    markAsRead,
    markAllAsRead,
    hasUrgent: highPriorityCount > 0,
  };
};
