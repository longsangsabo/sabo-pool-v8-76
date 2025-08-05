import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

/**
 * Component that automatically handles profile refreshes on rank approvals
 * This should be included in the main app layout to work globally
 */
export const AutomatedProfileRefresh: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    console.log(
      '[AutomatedProfileRefresh] Setting up rank approval listener for user:',
      user.id
    );

    // Listen for rank approval notifications
    const notificationChannel = supabase
      .channel('rank-approval-global')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          console.log(
            '[AutomatedProfileRefresh] Notification received:',
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
            console.log('[AutomatedProfileRefresh] Rank approval detected');

            // Show immediate feedback
            toast.success('🎉 Hạng của bạn đã được duyệt!', {
              description: 'Đang cập nhật thông tin hồ sơ...',
            });

            // Force page reload to refresh all profile data
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          }
        }
      )
      .subscribe(status => {
        console.log(
          '[AutomatedProfileRefresh] Notification subscription status:',
          status
        );
      });

    return () => {
      console.log(
        '[AutomatedProfileRefresh] Cleaning up notification listener'
      );
      supabase.removeChannel(notificationChannel);
    };
  }, [user]);

  // This component renders nothing, it just provides the automation
  return null;
};

export default AutomatedProfileRefresh;
