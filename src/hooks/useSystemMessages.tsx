import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useSystemMessages = () => {
  const { user, profile } = useAuth();

  // Create system messages for various events
  const createSystemMessage = async (
    targetUserId: string,
    type: string,
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    actionUrl?: string,
    metadata?: any
  ) => {
    try {
      // Mock notification creation since function doesn't exist
      console.log('Creating notification:', {
        target_user_id: targetUserId,
        notification_type: type,
        notification_title: title,
        notification_message: message,
        notification_action_url: actionUrl,
        notification_metadata: metadata || {},
        notification_priority: priority,
      });
    } catch (error) {
      console.error('Error in createSystemMessage:', error);
    }
  };

  // Welcome message for new users
  useEffect(() => {
    if (user && profile && !profile.welcome_email_sent) {
      const sendWelcomeMessage = async () => {
        await createSystemMessage(
          user.id,
          'welcome',
          'Chào mừng đến với SABO Billiards! 🎱',
          `Xin chào ${profile.full_name || 'bạn'}! Chào mừng bạn đến với cộng đồng bi-a SABO. Hãy khám phá các tính năng tuyệt vời của chúng tôi: thách đấu, giải đấu, và kết nối với những người chơi khác. Chúc bạn có những trải nghiệm thú vị!`,
          'medium',
          '/dashboard'
        );
      };

      setTimeout(sendWelcomeMessage, 2000);
    }
  }, [user, profile]);

  // System maintenance notifications
  const notifySystemMaintenance = async (
    startTime: string,
    endTime: string
  ) => {
    try {
      // Get all users
      const { data: users, error } = await supabase
        .from('profiles')
        .select('user_id');

      if (error) throw error;

      // Send notification to all users
      const notifications = users?.map(userProfile => ({
        target_user_id: userProfile.user_id,
        notification_type: 'system_maintenance',
        notification_title: 'Thông báo bảo trì hệ thống',
        notification_message: `Hệ thống sẽ tạm dừng hoạt động từ ${startTime} đến ${endTime} để bảo trì và nâng cấp. Vui lòng sắp xếp thời gian phù hợp. Cảm ơn bạn đã thành hình!`,
        notification_priority: 'high',
      }));

      if (notifications && notifications.length > 0) {
        // Mock bulk notification creation since function doesn't exist
        console.log('Creating bulk notifications:', notifications);
      }
    } catch (error) {
      console.error('Error sending maintenance notifications:', error);
    }
  };

  // Tournament updates
  const notifyTournamentUpdate = async (
    tournamentId: string,
    eventType: string,
    message: string
  ) => {
    try {
      // Get tournament participants
      const { data: participants, error } = await supabase
        .from('tournament_registrations')
        .select('user_id')
        .eq('tournament_id', tournamentId)
        .eq('registration_status', 'confirmed');

      if (error) throw error;

      participants?.forEach(async participant => {
        await createSystemMessage(
          participant.user_id,
          `tournament_${eventType}`,
          'Cập nhật giải đấu 🏆',
          message,
          'medium',
          `/tournaments/${tournamentId}`
        );
      });
    } catch (error) {
      console.error('Error sending tournament notifications:', error);
    }
  };

  // Club registration confirmation
  const notifyClubRegistrationSubmitted = async (
    userId: string,
    clubName: string,
    registrationId: string
  ) => {
    try {
      await createSystemMessage(
        userId,
        'club_registration_submitted',
        'Đăng ký CLB thành công! 🏢',
        `Bạn đã gửi đăng ký câu lạc bộ "${clubName}" thành công. Chúng tôi sẽ xem xét và thông báo kết quả trong thời gian sớm nhất. Cảm ơn bạn đã lựa chọn hệ thống SABO!`,
        'medium',
        '/profile?tab=club',
        {
          club_name: clubName,
          registration_id: registrationId,
        }
      );
    } catch (error) {
      console.error('Error sending club registration confirmation:', error);
    }
  };

  // Club status updates
  const notifyClubStatusUpdate = async (
    clubId: string,
    status: string,
    reason?: string
  ) => {
    try {
      const { data: clubData, error } = await supabase
        .from('club_registrations')
        .select('user_id, club_name')
        .eq('id', clubId)
        .single();

      if (error) throw error;

      let title = '';
      let message = '';
      let priority: 'low' | 'medium' | 'high' = 'medium';

      switch (status) {
        case 'approved':
          title = 'Câu lạc bộ được phê duyệt! 🎉';
          message = `Chúc mừng! Câu lạc bộ "${clubData.club_name}" của bạn đã được phê duyệt thành công. Bạn có thể bắt đầu sử dụng các tính năng quản lý câu lạc bộ ngay bây giờ.`;
          priority = 'high';
          break;
        case 'rejected':
          title = 'Câu lạc bộ chưa được phê duyệt';
          message = `Đăng ký câu lạc bộ "${clubData.club_name}" chưa được phê duyệt. ${reason ? `Lý do: ${reason}` : ''} Bạn có thể chỉnh sửa thông tin và gửi lại đăng ký.`;
          priority = 'high';
          break;
        case 'under_review':
          title = 'Đang xem xét đăng ký câu lạc bộ';
          message = `Đăng ký câu lạc bộ "${clubData.club_name}" đang được xem xét. Chúng tôi sẽ thông báo kết quả trong thời gian sớm nhất.`;
          break;
      }

      if (title && message) {
        await createSystemMessage(
          clubData.user_id,
          `club_${status}`,
          title,
          message,
          priority,
          '/profile?tab=club'
        );
      }
    } catch (error) {
      console.error('Error sending club status notification:', error);
    }
  };

  // Rank verification updates
  const notifyRankVerification = async (
    playerId: string,
    status: string,
    rank: string,
    reason?: string
  ) => {
    try {
      let title = '';
      let message = '';
      let priority: 'low' | 'medium' | 'high' = 'medium';

      switch (status) {
        case 'approved':
          title = 'Xác nhận hạng thành công! ⭐';
          message = `Chúc mừng! Hạng ${rank} của bạn đã được xác nhận chính thức. Bạn có thể tham gia các thách đấu và giải đấu phù hợp với hạng của mình.`;
          priority = 'high';
          break;
        case 'rejected':
          title = 'Yêu cầu xác nhận hạng chưa được chấp nhận';
          message = `Yêu cầu xác nhận hạng ${rank} chưa được chấp nhận. ${reason ? `Lý do: ${reason}` : ''} Bạn có thể thử lại sau khi cải thiện kỹ năng.`;
          priority = 'medium';
          break;
        case 'needs_test':
          title = 'Yêu cầu kiểm tra kỹ năng';
          message = `Để xác nhận hạng ${rank}, bạn cần tham gia bài kiểm tra kỹ năng tại câu lạc bộ. Vui lòng liên hệ để sắp xếp thời gian phù hợp.`;
          priority = 'high';
          break;
      }

      if (title && message) {
        await createSystemMessage(
          playerId,
          `rank_${status}`,
          title,
          message,
          priority,
          '/profile?tab=ranking'
        );
      }
    } catch (error) {
      console.error('Error sending rank verification notification:', error);
    }
  };

  // Achievement notifications
  const notifyAchievement = async (
    playerId: string,
    achievementType: string,
    achievementData: any
  ) => {
    try {
      let title = '';
      let message = '';
      const emoji = '🎉';

      switch (achievementType) {
        case 'first_win':
          title = 'Chiến thắng đầu tiên! 🎱';
          message =
            'Chúc mừng chiến thắng đầu tiên của bạn! Đây là bước đầu của hành trình chinh phục thế giới bi-a.';
          break;
        case 'win_streak':
          title = `Chuỗi chiến thắng ${achievementData.streak} trận! 🔥`;
          message = `Tuyệt vời! Bạn đã giành chiến thắng ${achievementData.streak} trận liên tiếp. Hãy tiếp tục phong độ này!`;
          break;
        case 'rank_promotion':
          title = `Thăng hạng lên ${achievementData.newRank}! ⬆️`;
          message = `Chúc mừng! Bạn đã thăng hạng từ ${achievementData.oldRank} lên ${achievementData.newRank}. Kỹ năng của bạn đang ngày càng tiến bộ!`;
          break;
        case 'tournament_champion':
          title = `Vô địch giải đấu! 🏆`;
          message = `Xuất sắc! Bạn đã trở thành nhà vô địch giải đấu "${achievementData.tournamentName}". Thành tích đáng tự hào!`;
          break;
      }

      if (title && message) {
        await createSystemMessage(
          playerId,
          `achievement_${achievementType}`,
          title,
          message,
          'medium',
          '/profile?tab=achievements',
          achievementData
        );
      }
    } catch (error) {
      console.error('Error sending achievement notification:', error);
    }
  };

  return {
    createSystemMessage,
    notifySystemMaintenance,
    notifyTournamentUpdate,
    notifyClubRegistrationSubmitted,
    notifyClubStatusUpdate,
    notifyRankVerification,
    notifyAchievement,
  };
};
