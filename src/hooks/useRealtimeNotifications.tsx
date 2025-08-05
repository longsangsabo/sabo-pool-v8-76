import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { ChallengeJoinedPopup } from '@/components/notifications/ChallengeJoinedPopup';

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [popupData, setPopupData] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);

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
          const notification = payload.new;

          // Special handling for challenge_accepted notifications
          if (notification.type === 'challenge_accepted') {
            // Parse metadata for popup display
            const metadata = notification.metadata || {};

            setPopupData({
              id: notification.id,
              challenge_id: metadata.challenge_id,
              participant_name: metadata.participant_name || 'Đối thủ ẩn danh',
              participant_avatar: metadata.participant_avatar,
              participant_rank: metadata.participant_rank,
              bet_points: metadata.bet_points || 0,
              race_to: metadata.race_to || 5,
              message: metadata.message,
              location: metadata.location,
            });

            setShowPopup(true);
          } else {
            // Show regular toast notification
            toast.info(notification.title, {
              description: notification.message,
              duration: 5000,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'challenges',
          filter: `opponent_id=eq.${user.id}`,
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

  const handleClosePopup = () => {
    setShowPopup(false);
    setPopupData(null);
  };

  const handleAcceptChallenge = () => {
    // Refresh challenges or perform any additional actions
    toast.success('Trận đấu đã được xác nhận và sẵn sàng!');
  };

  return {
    isConnected,
    showPopup,
    popupData,
    handleClosePopup,
    handleAcceptChallenge,
    PopupComponent: () =>
      popupData ? (
        <ChallengeJoinedPopup
          open={showPopup}
          onClose={handleClosePopup}
          challengeData={popupData}
          onAccept={handleAcceptChallenge}
        />
      ) : null,
  };
};
