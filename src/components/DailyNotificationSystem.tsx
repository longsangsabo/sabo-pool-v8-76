import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCheckIn } from '@/hooks/useCheckIn';

const DailyNotificationSystem = () => {
  const { user } = useAuth();
  const { hasCheckedInToday } = useCheckIn();

  useEffect(() => {
    if (!user || hasCheckedInToday) return;

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Schedule daily reminder at 8 PM
    const scheduleNotification = () => {
      const now = new Date();
      const targetTime = new Date();
      targetTime.setHours(20, 0, 0, 0); // 8 PM

      // If it's already past 8 PM today, schedule for tomorrow
      if (now > targetTime) {
        targetTime.setDate(targetTime.getDate() + 1);
      }

      const timeUntilNotification = targetTime.getTime() - now.getTime();

      setTimeout(() => {
        if (!hasCheckedInToday && Notification.permission === 'granted') {
          new Notification('🎱 SABO ARENA', {
            body: 'Đừng quên check-in hôm nay để duy trì streak! 🔥',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
          });
        }

        // Schedule next day's notification
        scheduleNotification();
      }, timeUntilNotification);
    };

    scheduleNotification();
  }, [user, hasCheckedInToday]);

  // This component doesn't render anything
  return null;
};

export default DailyNotificationSystem;
