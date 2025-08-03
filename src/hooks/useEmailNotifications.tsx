import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { emailService } from '@/services/emailService';
import { toast } from 'sonner';

export const useEmailNotifications = () => {
  const { user, profile } = useAuth();

  // Auto-send welcome email for new users
  useEffect(() => {
    if (user && profile && !profile.welcome_email_sent) {
      const sendWelcomeEmail = async () => {
        try {
          await emailService.sendWelcomeEmail(
            user.email || '',
            profile.full_name || 'Bạn'
          );
          console.log('Welcome email sent successfully');
        } catch (error) {
          console.error('Failed to send welcome email:', error);
        }
      };

      // Delay to ensure user registration is complete
      setTimeout(sendWelcomeEmail, 2000);
    }
  }, [user, profile]);

  const sendTournamentConfirmation = async (tournamentName: string) => {
    if (!user || !profile) return;

    try {
      await emailService.sendTournamentConfirmation(
        user.email || '',
        tournamentName,
        profile.full_name || 'Bạn'
      );
      toast.success('Email xác nhận giải đấu đã được gửi!');
    } catch (error) {
      console.error('Failed to send tournament confirmation:', error);
      toast.error('Không thể gửi email xác nhận');
    }
  };

  const sendMatchResultNotification = async (matchResult: any) => {
    if (!user || !profile) return;

    try {
      await emailService.sendMatchResultNotification(
        user.email || '',
        matchResult,
        profile.full_name || 'Bạn'
      );
      toast.success('Thông báo kết quả trận đấu đã được gửi!');
    } catch (error) {
      console.error('Failed to send match result notification:', error);
    }
  };

  const sendRankingUpdateNotification = async (
    newRank: string,
    oldRank: string
  ) => {
    if (!user || !profile) return;

    try {
      await emailService.sendRankingUpdateNotification(
        user.email || '',
        newRank,
        oldRank,
        profile.full_name || 'Bạn'
      );
      toast.success('Thông báo thay đổi xếp hạng đã được gửi!');
    } catch (error) {
      console.error('Failed to send ranking update notification:', error);
    }
  };

  const sendPaymentConfirmation = async (paymentDetails: any) => {
    if (!user || !profile) return;

    try {
      await emailService.sendPaymentConfirmation(
        user.email || '',
        paymentDetails,
        profile.full_name || 'Bạn'
      );
      toast.success('Email xác nhận thanh toán đã được gửi!');
    } catch (error) {
      console.error('Failed to send payment confirmation:', error);
    }
  };

  return {
    sendTournamentConfirmation,
    sendMatchResultNotification,
    sendRankingUpdateNotification,
    sendPaymentConfirmation,
  };
};
