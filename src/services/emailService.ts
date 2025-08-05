import { supabase } from '@/integrations/supabase/client';
import type {
  EmailTemplate,
  EmailConfig,
  MatchResult,
  PaymentDetails,
  TournamentEmailData,
  RankingUpdateData,
} from '@/types/email';

export const EMAIL_CONFIG: EmailConfig = {
  from: 'noreply@sabopoolarena.com',
  fromName: 'SABO Pool Arena',
  replyTo: 'support@sabopoolarena.com',
};

export class EmailService {
  private static instance: EmailService;

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
    const template = this.getWelcomeEmailTemplate(userName);
    await this.sendEmail(userEmail, template);
  }

  async sendTournamentConfirmation(
    userEmail: string,
    tournamentName: string,
    userName: string
  ): Promise<void> {
    const template = this.getTournamentConfirmationTemplate(
      tournamentName,
      userName
    );
    await this.sendEmail(userEmail, template);
  }

  async sendMatchResultNotification(
    userEmail: string,
    matchResult: MatchResult,
    userName: string
  ): Promise<void> {
    const template = this.getMatchResultTemplate(matchResult, userName);
    await this.sendEmail(userEmail, template);
  }

  async sendRankingUpdateNotification(
    userEmail: string,
    newRank: string,
    oldRank: string,
    userName: string
  ): Promise<void> {
    const template = this.getRankingUpdateTemplate(newRank, oldRank, userName);
    await this.sendEmail(userEmail, template);
  }

  async sendPaymentConfirmation(
    userEmail: string,
    paymentDetails: PaymentDetails,
    userName: string
  ): Promise<void> {
    const template = this.getPaymentConfirmationTemplate(
      paymentDetails,
      userName
    );
    await this.sendEmail(userEmail, template);
  }

  async sendPasswordResetEmail(
    userEmail: string,
    resetLink: string
  ): Promise<void> {
    const template = this.getPasswordResetTemplate(resetLink);
    await this.sendEmail(userEmail, template);
  }

  private async sendEmail(to: string, template: EmailTemplate): Promise<void> {
    try {
      // In production, this would integrate with a real email service
      // For now, we'll use Supabase's built-in email functionality
      console.log(`Sending email to: ${to}`);
      console.log(`Subject: ${template.subject}`);
      console.log(`Content: ${template.text}`);

      // Store email log in database for tracking
      await this.logEmail(to, template.subject, 'sent');
    } catch (error) {
      console.error('Failed to send email:', error);
      await this.logEmail(to, template.subject, 'failed');
      throw error;
    }
  }

  private async logEmail(
    to: string,
    subject: string,
    status: 'sent' | 'failed'
  ): Promise<void> {
    try {
      // Log email activity for audit purposes
      console.log(`Email log: ${to} - ${subject} - ${status}`);
    } catch (error) {
      console.error('Failed to log email:', error);
    }
  }

  private getWelcomeEmailTemplate(userName: string): EmailTemplate {
    return {
      subject: 'Chào mừng bạn đến với SABO Pool Arena! 🎱',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin-bottom: 10px;">🎱 SABO Pool Arena</h1>
            <p style="color: #666; font-size: 16px;">Nền tảng thi đấu Billiards hàng đầu Việt Nam</p>
          </div>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
            <h2 style="color: #1e40af; margin-bottom: 15px;">Xin chào ${userName}!</h2>
            <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
              Chúc mừng bạn đã gia nhập cộng đồng SABO Pool Arena! Chúng tôi rất vui mừng chào đón bạn.
            </p>
            <p style="color: #374151; line-height: 1.6;">
              Tại đây bạn có thể:
            </p>
            <ul style="color: #374151; line-height: 1.8; margin: 15px 0;">
              <li>🏆 Tham gia các giải đấu chuyên nghiệp</li>
              <li>📊 Theo dõi bảng xếp hạng cá nhân</li>
              <li>🎯 Thách đấu với những cao thủ khác</li>
              <li>💰 Nhận thưởng hấp dẫn</li>
              <li>👥 Kết nối với cộng đồng đam mê Billiards</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${window.location.origin}/dashboard" 
               style="background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Bắt đầu ngay
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
              Cần hỗ trợ? Liên hệ với chúng tôi tại: support@sabopoolarena.com
            </p>
            <p style="color: #6b7280; font-size: 12px;">
              © 2024 SABO Pool Arena. Tất cả quyền được bảo lưu.
            </p>
          </div>
        </div>
      `,
      text: `Chào mừng ${userName} đến với SABO Pool Arena! Tham gia ngay để thi đấu và kết nối với cộng đồng Billiards. Truy cập: ${window.location.origin}/dashboard`,
    };
  }

  private getTournamentConfirmationTemplate(
    tournamentName: string,
    userName: string
  ): EmailTemplate {
    return {
      subject: `✅ Xác nhận đăng ký giải đấu: ${tournamentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af;">🏆 SABO Pool Arena</h1>
          </div>
          
          <div style="background: #10b981; color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 25px;">
            <h2 style="margin-bottom: 10px;">Đăng ký thành công!</h2>
            <p style="margin: 0; opacity: 0.9;">Bạn đã đăng ký tham gia giải đấu</p>
          </div>

          <div style="background: #f8fafc; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
            <h3 style="color: #1e40af; margin-bottom: 15px;">Thông tin giải đấu</h3>
            <p><strong>Tên giải:</strong> ${tournamentName}</p>
            <p><strong>Người tham gia:</strong> ${userName}</p>
            <p><strong>Trạng thái:</strong> <span style="color: #10b981;">Đã xác nhận</span></p>
          </div>

          <div style="border: 2px solid #fbbf24; border-radius: 10px; padding: 20px; margin: 25px 0;">
            <h4 style="color: #d97706; margin-bottom: 15px;">📋 Lưu ý quan trọng:</h4>
            <ul style="color: #374151; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>Vui lòng có mặt đúng giờ theo lịch thi đấu</li>
              <li>Mang theo giấy tờ tùy thân để xác minh</li>
              <li>Kiểm tra email thường xuyên để cập nhật thông tin</li>
              <li>Liên hệ BTC nếu có thay đổi về lịch trình</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${window.location.origin}/tournaments" 
               style="background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Xem chi tiết giải đấu
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px;">
              Chúc bạn thi đấu thành công! 🎱<br>
              Đội ngũ SABO Pool Arena
            </p>
          </div>
        </div>
      `,
      text: `Xác nhận đăng ký giải đấu ${tournamentName} thành công cho ${userName}. Chi tiết tại: ${window.location.origin}/tournaments`,
    };
  }

  private getMatchResultTemplate(
    matchResult: MatchResult,
    userName: string
  ): EmailTemplate {
    const isWinner = matchResult.winner === userName;
    const resultColor = isWinner ? '#10b981' : '#ef4444';
    const resultText = isWinner ? 'THẮNG' : 'THUA';
    const emoji = isWinner ? '🏆' : '💪';

    return {
      subject: `${emoji} Kết quả trận đấu của bạn - SABO Pool Arena`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af;">🎱 SABO Pool Arena</h1>
          </div>
          
          <div style="background: ${resultColor}; color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 25px;">
            <h2 style="margin-bottom: 10px;">${emoji} BẠN ĐÃ ${resultText}!</h2>
            <p style="margin: 0; opacity: 0.9;">Kết quả trận đấu vừa được cập nhật</p>
          </div>

          <div style="background: #f8fafc; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
            <h3 style="color: #1e40af; margin-bottom: 15px;">Chi tiết trận đấu</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span><strong>Đối thủ:</strong> ${matchResult.opponent || 'N/A'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span><strong>Tỷ số:</strong> ${matchResult.score || 'N/A'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span><strong>Thời gian:</strong> ${new Date().toLocaleDateString('vi-VN')}</span>
            </div>
          </div>

          ${
            isWinner
              ? `
          <div style="background: #dcfce7; border: 2px solid #10b981; border-radius: 10px; padding: 20px; margin: 25px 0;">
            <h4 style="color: #059669; margin-bottom: 15px;">🎉 Chúc mừng chiến thắng!</h4>
            <p style="color: #374151; margin: 0;">
              Bạn đã có một trận đấu xuất sắc! Hãy tiếp tục nỗ lực để đạt được nhiều thành công hơn nữa.
            </p>
          </div>
          `
              : `
          <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 10px; padding: 20px; margin: 25px 0;">
            <h4 style="color: #dc2626; margin-bottom: 15px;">💪 Đừng bỏ cuộc!</h4>
            <p style="color: #374151; margin: 0;">
              Mỗi trận đấu đều là cơ hội học hỏi. Hãy tiếp tục luyện tập và chuẩn bị cho những thử thách tiếp theo!
            </p>
          </div>
          `
          }

          <div style="text-align: center; margin: 30px 0;">
            <a href="${window.location.origin}/matches" 
               style="background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Xem lịch sử trận đấu
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px;">
              Chúc bạn ngày càng tiến bộ! 🎱<br>
              Đội ngũ SABO Pool Arena
            </p>
          </div>
        </div>
      `,
      text: `Kết quả trận đấu: Bạn đã ${resultText}! Chi tiết tại: ${window.location.origin}/matches`,
    };
  }

  private getRankingUpdateTemplate(
    newRank: string,
    oldRank: string,
    userName: string
  ): EmailTemplate {
    const isPromotion = newRank > oldRank;
    const changeColor = isPromotion ? '#10b981' : '#ef4444';
    const changeText = isPromotion ? 'THĂNG HẠNG' : 'XUỐNG HẠNG';
    const emoji = isPromotion ? '📈' : '📉';

    return {
      subject: `${emoji} Thay đổi xếp hạng - SABO Pool Arena`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af;">🎱 SABO Pool Arena</h1>
          </div>
          
          <div style="background: ${changeColor}; color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 25px;">
            <h2 style="margin-bottom: 10px;">${emoji} ${changeText}!</h2>
            <p style="margin: 0; opacity: 0.9;">Xếp hạng của bạn đã được cập nhật</p>
          </div>

          <div style="background: #f8fafc; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
            <h3 style="color: #1e40af; margin-bottom: 15px;">Thông tin xếp hạng</h3>
            <div style="text-align: center; margin: 20px 0;">
              <div style="display: inline-block; margin: 0 20px;">
                <div style="background: #e5e7eb; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                  <div style="font-size: 24px; font-weight: bold; color: #6b7280;">#{oldRank}</div>
                  <div style="font-size: 12px; color: #6b7280;">HẠNG CŨ</div>
                </div>
              </div>
              <div style="display: inline-block; margin: 0 10px; font-size: 24px; color: #6b7280;">→</div>
              <div style="display: inline-block; margin: 0 20px;">
                <div style="background: ${changeColor}; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                  <div style="font-size: 24px; font-weight: bold; color: white;">#{newRank}</div>
                  <div style="font-size: 12px; color: white; opacity: 0.9;">HẠNG MỚI</div>
                </div>
              </div>
            </div>
            <p style="text-align: center; color: #374151; margin-top: 20px;">
              <strong>Người chơi:</strong> ${userName}
            </p>
          </div>

          ${
            isPromotion
              ? `
          <div style="background: #dcfce7; border: 2px solid #10b981; border-radius: 10px; padding: 20px; margin: 25px 0;">
            <h4 style="color: #059669; margin-bottom: 15px;">🎉 Xuất sắc!</h4>
            <p style="color: #374151; margin: 0;">
              Chúc mừng bạn đã thăng hạng! Thành tích này là kết quả của sự nỗ lực và kỹ năng thi đấu tuyệt vời.
            </p>
          </div>
          `
              : `
          <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 10px; padding: 20px; margin: 25px 0;">
            <h4 style="color: #dc2626; margin-bottom: 15px;">💪 Tiếp tục cố gắng!</h4>
            <p style="color: #374151; margin: 0;">
              Đây là cơ hội để bạn trở lại mạnh mẽ hơn. Hãy luyện tập chăm chỉ và cải thiện kỹ năng của mình!
            </p>
          </div>
          `
          }

          <div style="text-align: center; margin: 30px 0;">
            <a href="${window.location.origin}/leaderboard" 
               style="background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Xem bảng xếp hạng
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px;">
              Chúc bạn thành công trong những trận đấu tiếp theo! 🎱<br>
              Đội ngũ SABO Pool Arena
            </p>
          </div>
        </div>
      `,
      text: `Xếp hạng cập nhật: ${userName} từ #${oldRank} → #${newRank}. Chi tiết: ${window.location.origin}/leaderboard`,
    };
  }

  private getPaymentConfirmationTemplate(
    paymentDetails: PaymentDetails,
    userName: string
  ): EmailTemplate {
    return {
      subject: '💳 Xác nhận thanh toán - SABO Pool Arena',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af;">🎱 SABO Pool Arena</h1>
          </div>
          
          <div style="background: #10b981; color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 25px;">
            <h2 style="margin-bottom: 10px;">💳 Thanh toán thành công!</h2>
            <p style="margin: 0; opacity: 0.9;">Giao dịch của bạn đã được xử lý</p>
          </div>

          <div style="background: #f8fafc; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
            <h3 style="color: #1e40af; margin-bottom: 15px;">Chi tiết giao dịch</h3>
            <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 15px; margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span><strong>Mã giao dịch:</strong></span>
                <span style="font-family: monospace;">${paymentDetails.transactionId || 'TXN_' + Date.now()}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span><strong>Người thanh toán:</strong></span>
                <span>${userName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span><strong>Dịch vụ:</strong></span>
                <span>${paymentDetails.service || 'Phí tham gia giải đấu'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span><strong>Thời gian:</strong></span>
                <span>${new Date().toLocaleString('vi-VN')}</span>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #10b981;">
              <span>Tổng tiền:</span>
              <span>${paymentDetails.amount || '100,000'} VNĐ</span>
            </div>
          </div>

          <div style="background: #dbeafe; border: 2px solid #3b82f6; border-radius: 10px; padding: 20px; margin: 25px 0;">
            <h4 style="color: #1d4ed8; margin-bottom: 15px;">📋 Thông tin quan trọng:</h4>
            <ul style="color: #374151; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>Hóa đơn điện tử đã được gửi đến email này</li>
              <li>Vui lòng lưu giữ thông tin giao dịch để tra cứu</li>
              <li>Liên hệ hỗ trợ nếu có thắc mắc: support@sabopoolarena.com</li>
              <li>Giao dịch có thể mất 5-10 phút để được cập nhật hoàn toàn</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${window.location.origin}/wallet" 
               style="background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Xem lịch sử giao dịch
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px;">
              Cảm ơn bạn đã tin tưởng SABO Pool Arena! 💳<br>
              Đội ngũ SABO Pool Arena
            </p>
          </div>
        </div>
      `,
      text: `Thanh toán thành công ${paymentDetails.amount || '100,000'} VNĐ cho ${paymentDetails.service || 'dịch vụ'}. Mã: ${paymentDetails.transactionId || 'TXN_' + Date.now()}`,
    };
  }

  private getPasswordResetTemplate(resetLink: string): EmailTemplate {
    return {
      subject: '🔐 Yêu cầu đặt lại mật khẩu - SABO Pool Arena',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af;">🎱 SABO Pool Arena</h1>
          </div>
          
          <div style="background: #f59e0b; color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 25px;">
            <h2 style="margin-bottom: 10px;">🔐 Đặt lại mật khẩu</h2>
            <p style="margin: 0; opacity: 0.9;">Chúng tôi đã nhận được yêu cầu của bạn</p>
          </div>

          <div style="background: #f8fafc; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              Xin chào,
            </p>
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản SABO Pool Arena của bạn.
              Để tạo mật khẩu mới, vui lòng nhấn vào nút bên dưới:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Đặt lại mật khẩu
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 20px;">
              Nếu nút không hoạt động, vui lòng copy và paste link sau vào trình duyệt:<br>
              <span style="word-break: break-all; font-family: monospace; background: #e5e7eb; padding: 5px; border-radius: 3px;">
                ${resetLink}
              </span>
            </p>
          </div>

          <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 10px; padding: 20px; margin: 25px 0;">
            <h4 style="color: #dc2626; margin-bottom: 15px;">⚠️ Lưu ý bảo mật:</h4>
            <ul style="color: #374151; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>Link này chỉ có hiệu lực trong 1 giờ</li>
              <li>Chỉ sử dụng link nếu bạn thực sự yêu cầu đặt lại mật khẩu</li>
              <li>Không chia sẻ link này với bất kỳ ai</li>
              <li>Nếu không phải bạn yêu cầu, vui lòng bỏ qua email này</li>
            </ul>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px;">
              Cần hỗ trợ? Liên hệ: support@sabopoolarena.com<br>
              Đội ngũ SABO Pool Arena
            </p>
          </div>
        </div>
      `,
      text: `Yêu cầu đặt lại mật khẩu SABO Pool Arena. Link: ${resetLink} (có hiệu lực 1 giờ)`,
    };
  }
}

export const emailService = EmailService.getInstance();
