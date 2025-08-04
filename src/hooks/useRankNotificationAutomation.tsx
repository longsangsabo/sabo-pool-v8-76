import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSimpleProfile } from '@/contexts/SimpleProfileContext';
import { toast } from 'sonner';

/**
 * Hook to automate profile updates after rank approval notifications
 */
export const useRankNotificationAutomation = () => {
  const { user } = useAuth();
  const { refreshProfile } = useSimpleProfile();

  useEffect(() => {
    if (!user) return;

      '[RankNotificationAutomation] Setting up rank approval listener for user:',
      user.id
    );

    // Listen for rank approval notifications
    const notificationChannel = supabase
      .channel('rank-approval-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {

            '[RankNotificationAutomation] Notification received:',
            payload
          );

          const notification = payload.new;

          // Check if it's a rank approval notification
          if (
            notification.type === 'rank_approved' ||
            notification.type === 'rank_verification_approved' ||
            notification.message?.includes('được duyệt') ||
            notification.message?.includes('approved')
          ) {

              '[RankNotificationAutomation] Rank approval detected, triggering profile refresh'
            );

            // Show immediate feedback
            toast.success('🎉 Hạng của bạn đã được duyệt!', {
              description: 'Đang cập nhật thông tin hồ sơ...',
            });

            // Immediate refresh
            refreshProfile();

            // Backup refresh after 2 seconds
            setTimeout(() => {

                '[RankNotificationAutomation] Backup refresh triggered'
              );
              refreshProfile();
            }, 2000);

            // Final refresh after 5 seconds to ensure consistency
            setTimeout(() => {

                '[RankNotificationAutomation] Final refresh triggered'
              );
              refreshProfile();
            }, 5000);
          }
        }
      )
      .subscribe(status => {

          '[RankNotificationAutomation] Notification subscription status:',
          status
        );
      });

    return () => {

        '[RankNotificationAutomation] Cleaning up notification listener'
      );
      supabase.removeChannel(notificationChannel);
    };
  }, [user, refreshProfile]);

  return null;
};
