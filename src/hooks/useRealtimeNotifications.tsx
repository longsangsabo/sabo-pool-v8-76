import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          // ...removed console.log('New notification received:', payload)

          const notification = payload.new;

          // Show toast notification
          toast.info(notification.title, {
            description: notification.message,
            duration: 5000,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'challenges',
          filter: `challenged_id=eq.${user.id}`,
        },
        payload => {
          // ...removed console.log('New challenge received:', payload)

          toast.success('Bạn có thách đấu mới! ⚡', {
            description: 'Nhấn để xem chi tiết',
            duration: 5000,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'challenges',
          filter: `challenger_id=eq.${user.id}`,
        },
        payload => {
          // ...removed console.log('Challenge status updated:', payload)

          const challenge = payload.new;
          if (challenge.status === 'accepted') {
            toast.success('Thách đấu được chấp nhận! 🎉');
          } else if (challenge.status === 'declined') {
            toast.error('Thách đấu bị từ chối');
          }
        }
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          // ...removed console.log('Realtime notifications connected')
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          console.error('Realtime notifications error');
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [user]);

  return { isConnected };
};
