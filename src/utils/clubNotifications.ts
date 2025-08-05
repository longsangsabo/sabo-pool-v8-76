import { supabase } from '@/integrations/supabase/client';

interface ClubNotificationData {
  club_name: string;
  club_phone?: string;
  booking_datetime: string;
  duration: number;
  challenger_name: string;
  challenged_name: string;
  booking_id: string;
}

export const sendClubNotification = async (
  club: any,
  booking: any,
  challengerName: string,
  challengedName: string
) => {
  try {
    const notificationData: ClubNotificationData = {
      club_name: club.name,
      club_phone: club.phone,
      booking_datetime: booking.booking_datetime,
      duration: booking.duration_minutes,
      challenger_name: challengerName,
      challenged_name: challengedName,
      booking_id: booking.id,
    };

    console.log('Club notification data:', notificationData);

    // For now, we'll just log the notification
    // In the future, this can be expanded to send actual emails/SMS
    // or integrate with external services

    // Mock notification - in a real app, this would update the booking status
    console.log('Mock: Club notified for booking', booking.id);

    return { success: true };
  } catch (error) {
    console.error('Error notifying club:', error);
    return { success: false, error };
  }
};

export const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
