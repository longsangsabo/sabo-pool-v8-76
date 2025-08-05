import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Challenge, Club, Notification } from '@/types/common';

interface RealtimeSubscriptionOptions {
  onChallengeReceived?: (challenge: Challenge) => void;
  onChallengeUpdated?: (challenge: Challenge) => void;
  onBookingCreated?: (booking: any) => void;
  onBookingUpdated?: (booking: any) => void;
  onNotificationReceived?: (notification: Notification) => void;
}

export const useRealtimeSubscriptions = (
  options: RealtimeSubscriptionOptions = {}
) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Create a single channel for all subscriptions
    const channel = supabase.channel(`user-realtime-${user.id}`);

    // Subscribe to challenges where user is challenger
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'challenges',
        filter: `challenger_id=eq.${user.id}`,
      },
      payload => {
        handleChallengeUpdate(payload, 'challenger');
      }
    );

    // Subscribe to challenges where user is challenged
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'challenges',
        filter: `challenged_id=eq.${user.id}`,
      },
      payload => {
        handleChallengeUpdate(payload, 'challenged');
      }
    );

    // Subscribe to club bookings
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'club_bookings',
      },
      payload => {
        handleBookingUpdate(payload);
      }
    );

    // Subscribe to notifications
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      },
      payload => {
        handleNotificationReceived(payload);
      }
    );

    // Handle connection status
    const subscription = channel.subscribe(status => {
      // ...removed console.log('Real-time subscription status:', status)

      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        setConnectionError(null);
        toast.success('Kết nối real-time thành công! 🔗', {
          duration: 2000,
          position: 'top-center',
        });
      } else if (status === 'CHANNEL_ERROR') {
        setIsConnected(false);
        setConnectionError('Connection failed');
        toast.error('Lỗi kết nối real-time ⚠️');
      } else if (status === 'TIMED_OUT') {
        setIsConnected(false);
        setConnectionError('Connection timed out');
        toast.error('Kết nối real-time bị timeout ⏰');
      }
    });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      if (channelRef.current) {
        // ...removed console.log('Cleaning up real-time subscriptions')
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [user?.id]);

  const handleChallengeUpdate = (
    payload: any,
    userRole: 'challenger' | 'challenged'
  ) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['received-challenges'] });
    queryClient.invalidateQueries({ queryKey: ['sent-challenges'] });
    queryClient.invalidateQueries({ queryKey: ['enhanced-notifications'] });

    // Handle different challenge events
    switch (eventType) {
      case 'INSERT':
        if (userRole === 'challenged') {
          toast.success('🎯 Bạn có thách đấu mới!', {
            description: `Ai đó muốn thách đấu với bạn`,
            duration: 5000,
            action: {
              label: 'Xem ngay',
              onClick: () => {
                // Navigate to challenges page
                window.location.hash = '#challenges';
              },
            },
          });
          options.onChallengeReceived?.(newRecord as Challenge);
        }
        break;

      case 'UPDATE':
        if (userRole === 'challenger') {
          if (newRecord.status === 'accepted') {
            toast.success('🎉 Thách đấu được chấp nhận!', {
              description: 'Đối thủ đã chấp nhận và đề xuất lịch',
              duration: 5000,
            });
          } else if (newRecord.status === 'declined') {
            toast.error('❌ Thách đấu bị từ chối', {
              description: 'Đối thủ đã từ chối thách đấu của bạn',
              duration: 5000,
            });
          } else if (newRecord.status === 'confirmed') {
            toast.success('📅 Trận đấu đã được xác nhận!', {
              description: 'CLB đã được thông báo và đặt bàn',
              duration: 5000,
            });
          }
        }
        options.onChallengeUpdated?.(newRecord as Challenge);
        break;
    }
  };

  const handleBookingUpdate = (payload: any) => {
    const { eventType, new: newRecord } = payload;

    // Only handle bookings related to user's challenges
    queryClient.invalidateQueries({ queryKey: ['user-bookings'] });

    if (eventType === 'INSERT') {
      toast.info('🏓 Đặt bàn thành công!', {
        description: 'CLB đã được thông báo về trận đấu',
        duration: 4000,
      });
      options.onBookingCreated?.(newRecord);
    } else if (eventType === 'UPDATE') {
      if (newRecord.status === 'confirmed') {
        toast.success('✅ CLB đã xác nhận đặt bàn!', {
          description: 'Trận đấu đã được CLB xác nhận',
          duration: 5000,
        });
      }
      options.onBookingUpdated?.(newRecord);
    }
  };

  const handleNotificationReceived = (payload: any) => {
    const notification = payload.new as Notification;

    // Invalidate notifications queries
    queryClient.invalidateQueries({ queryKey: ['enhanced-notifications'] });

    // Show appropriate toast based on notification type
    const toastConfig = getToastConfig(notification);

    if (notification.priority === 'high') {
      toast.error(toastConfig.title, {
        description: toastConfig.description,
        duration: 10000,
        action: toastConfig.action,
      });
    } else if (notification.priority === 'medium') {
      toast.warning(toastConfig.title, {
        description: toastConfig.description,
        duration: 7000,
        action: toastConfig.action,
      });
    } else {
      toast.info(toastConfig.title, {
        description: toastConfig.description,
        duration: 5000,
        action: toastConfig.action,
      });
    }

    options.onNotificationReceived?.(notification);
  };

  const getToastConfig = (notification: Notification) => {
    const baseConfig = {
      title: notification.title,
      description: notification.message,
      action: notification.action_url
        ? {
            label: 'Xem chi tiết',
            onClick: () => (window.location.href = notification.action_url),
          }
        : undefined,
    };

    switch (notification.type) {
      case 'challenge_received':
        return {
          ...baseConfig,
          title: '⚡ ' + baseConfig.title,
        };
      case 'challenge_accepted':
        return {
          ...baseConfig,
          title: '🎉 ' + baseConfig.title,
        };
      case 'challenge_declined':
        return {
          ...baseConfig,
          title: '❌ ' + baseConfig.title,
        };
      case 'match_scheduled':
        return {
          ...baseConfig,
          title: '📅 ' + baseConfig.title,
        };
      case 'booking_confirmed':
        return {
          ...baseConfig,
          title: '✅ ' + baseConfig.title,
        };
      default:
        return baseConfig;
    }
  };

  return {
    isConnected,
    connectionError,
    reconnect: () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setConnectionError(null);
      // The useEffect will handle reconnection
    },
  };
};

// Add the missing tournament subscription hook
export const useTournamentSubscription = (
  onUpdate?: (payload: any) => void
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // ...removed console.log('Setting up tournament real-time subscription')

    const channel = supabase.channel(`tournaments-${Date.now()}`);

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tournaments',
      },
      payload => {
        // ...removed console.log('Tournament update received:', payload)
        onUpdate?.(payload);
      }
    );

    channel.subscribe(status => {
      // ...removed console.log('Tournament subscription status:', status)

      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        setError(null);
      } else if (status === 'CHANNEL_ERROR') {
        setIsConnected(false);
        setError('Connection failed');
      } else if (status === 'TIMED_OUT') {
        setIsConnected(false);
        setError('Connection timed out');
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        // ...removed console.log('Cleaning up tournament subscription')
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [onUpdate]);

  return {
    isConnected,
    error,
  };
};
