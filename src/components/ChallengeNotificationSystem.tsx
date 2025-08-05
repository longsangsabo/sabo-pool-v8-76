import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bell, Clock, CheckCircle, XCircle } from 'lucide-react';

const ChallengeNotificationSystem = () => {
  const { user } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check for unread challenge notifications
    checkUnreadChallenges();

    // Set up realtime subscription for new challenges
    const challengeSubscription = supabase
      .channel('challenge-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'challenges',
          filter: `opponent_id=eq.${user.id}`,
        },
        payload => {
          handleNewChallenge(payload.new);
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
          handleChallengeResponse(payload.new);
        }
      )
      .subscribe();

    // Set up match reminder system
    const matchSubscription = supabase
      .channel('match-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
        },
        payload => {
          handleNewMatch(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(challengeSubscription);
      supabase.removeChannel(matchSubscription);
    };
  }, [user]);

  const checkUnreadChallenges = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('id')
        .eq('opponent_id', user.id)
        .eq('status', 'pending')
        .limit(1);

      if (error) throw error;
      setHasUnread(data && data.length > 0);
    } catch (error) {
      console.error('Error checking unread challenges:', error);
    }
  };

  const handleNewChallenge = async (challenge: any) => {
    try {
      // Fetch challenger profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', challenge.challenger_id)
        .single();

      const challengerName = profile?.full_name || 'Một người chơi';

      toast.info(`${challengerName} đã gửi thách đấu cho bạn!`, {
        description: `Mức cược: ${challenge.bet_points} điểm`,
        duration: 5000,
        action: {
          label: 'Xem',
          onClick: () => {
            // Navigate to challenges tab
            window.location.hash = '#challenges';
          },
        },
      });

      setHasUnread(true);
    } catch (error) {
      console.error('Error handling new challenge:', error);
    }
  };

  const handleChallengeResponse = async (challenge: any) => {
    if (challenge.status === 'accepted') {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', challenge.opponent_id)
          .single();

        const opponentName = profile?.full_name || 'Đối thủ';

        toast.success(`${opponentName} đã chấp nhận thách đấu!`, {
          description: 'Trận đấu đã được tạo. Hãy chuẩn bị!',
          duration: 5000,
          action: {
            label: 'Xem lịch thi đấu',
            onClick: () => {
              window.location.hash = '#challenges';
            },
          },
        });
      } catch (error) {
        console.error('Error handling challenge response:', error);
      }
    } else if (challenge.status === 'declined') {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', challenge.opponent_id)
          .single();

        const opponentName = profile?.full_name || 'Đối thủ';

        toast.error(`${opponentName} đã từ chối thách đấu`, {
          description: challenge.response_message || 'Không có lý do cụ thể',
          duration: 4000,
        });
      } catch (error) {
        console.error('Error handling challenge decline:', error);
      }
    }
  };

  const handleNewMatch = async (match: any) => {
    if (
      !user ||
      (match.player1_id !== user.id && match.player2_id !== user.id)
    ) {
      return;
    }

    const opponentId =
      match.player1_id === user.id ? match.player2_id : match.player1_id;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', opponentId)
        .single();

      const opponentName = profile?.full_name || 'Đối thủ';

      // Set up match reminder (1 hour before)
      if (match.played_at) {
        const matchTime = new Date(match.played_at);
        const reminderTime = new Date(matchTime.getTime() - 60 * 60 * 1000); // 1 hour before
        const now = new Date();

        if (reminderTime > now) {
          const timeoutDuration = reminderTime.getTime() - now.getTime();

          setTimeout(() => {
            toast.info(
              `Nhắc nhở: Trận đấu với ${opponentName} sẽ bắt đầu trong 1 giờ!`,
              {
                description: `Lúc ${matchTime.toLocaleString('vi-VN')}`,
                duration: 8000,
                action: {
                  label: 'Xem chi tiết',
                  onClick: () => {
                    window.location.hash = '#challenges';
                  },
                },
              }
            );
          }, timeoutDuration);
        }
      }
    } catch (error) {
      console.error('Error setting up match reminder:', error);
    }
  };

  // Auto-expire challenges
  useEffect(() => {
    const expireInterval = setInterval(
      async () => {
        try {
          await supabase.rpc('expire_old_challenges');
        } catch (error) {
          console.error('Error expiring challenges:', error);
        }
      },
      5 * 60 * 1000
    ); // Check every 5 minutes

    return () => clearInterval(expireInterval);
  }, []);

  return null; // This is a notification-only component
};

export default ChallengeNotificationSystem;
