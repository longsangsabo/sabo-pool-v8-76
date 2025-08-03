import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface ScoreConfirmationEmailRequest {
  challenge_id: string;
  recipient_email: string;
  recipient_name: string;
  challenger_name: string;
  opponent_name: string;
  challenger_score: number;
  opponent_score: number;
  club_name?: string;
  match_time?: string;
  action_type: 'score_entered' | 'score_confirmed' | 'club_final_confirmation';
}

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      challenge_id,
      recipient_email,
      recipient_name,
      challenger_name,
      opponent_name,
      challenger_score,
      opponent_score,
      club_name,
      match_time,
      action_type,
    }: ScoreConfirmationEmailRequest = await req.json();

    if (!challenge_id || !recipient_email || !recipient_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.log('Email: Missing Resend API key, skipping email delivery');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate email content based on action type
    const emailContent = generateEmailContent({
      challenge_id,
      recipient_name,
      challenger_name,
      opponent_name,
      challenger_score,
      opponent_score,
      club_name,
      match_time,
      action_type,
    });

    // Send email using Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SABO Pool Arena <noreply@sabopoolarena.com>',
        to: [recipient_email],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const result = await response.json();
    console.log('Score confirmation email sent successfully:', result);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Score confirmation email sent successfully',
        email_id: result.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending score confirmation email:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateEmailContent(params: {
  challenge_id: string;
  recipient_name: string;
  challenger_name: string;
  opponent_name: string;
  challenger_score: number;
  opponent_score: number;
  club_name?: string;
  match_time?: string;
  action_type: 'score_entered' | 'score_confirmed' | 'club_final_confirmation';
}) {
  const {
    challenge_id,
    recipient_name,
    challenger_name,
    opponent_name,
    challenger_score,
    opponent_score,
    club_name,
    match_time,
    action_type,
  } = params;

  const baseUrl =
    Deno.env.get('SITE_URL') || 'https://knxevbkkkiadgppxbphh.supabase.co';
  const challengeUrl = `${baseUrl}/challenges?tab=dang-dien-ra&highlight=${challenge_id}`;

  const scoreDisplay = `${challenger_name}: ${challenger_score} - ${opponent_name}: ${opponent_score}`;
  const timeDisplay = match_time
    ? new Date(match_time).toLocaleString('vi-VN')
    : 'Thời gian chưa xác định';
  const clubDisplay = club_name || 'CLB chưa xác định';

  let subject: string;
  let mainMessage: string;
  let actionButtons: string;
  let additionalInfo: string;

  switch (action_type) {
    case 'score_entered':
      subject = `🎱 Xác nhận tỷ số trận đấu với ${challenger_name === recipient_name ? opponent_name : challenger_name}`;
      mainMessage = `
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="color: #92400e; margin: 0 0 10px 0;">⚠️ Cần xác nhận tỷ số</h3>
          <p style="color: #78350f; margin: 0;">
            Đối thủ đã nhập tỷ số trận đấu. Vui lòng kiểm tra và xác nhận hoặc chỉnh sửa nếu cần thiết.
          </p>
        </div>
      `;
      actionButtons = `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${challengeUrl}" 
             style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 0 10px; display: inline-block;">
            ✅ Xác nhận tỷ số
          </a>
          <a href="${challengeUrl}" 
             style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 0 10px; display: inline-block;">
            ✏️ Chỉnh sửa tỷ số
          </a>
        </div>
      `;
      additionalInfo = `
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #374151; margin: 0 0 10px 0;">📋 Hướng dẫn:</h4>
          <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
            <li>Kiểm tra kỹ tỷ số đã nhập</li>
            <li>Nhấn "Xác nhận tỷ số" nếu đúng</li>
            <li>Nhấn "Chỉnh sửa tỷ số" nếu cần điều chỉnh</li>
            <li>Sau khi xác nhận, CLB sẽ thực hiện xác nhận cuối cùng</li>
          </ul>
        </div>
      `;
      break;

    case 'score_confirmed':
      subject = `🎱 Thông báo: Tỷ số đã được xác nhận - Chờ CLB duyệt`;
      mainMessage = `
        <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="color: #1e40af; margin: 0 0 10px 0;">ℹ️ Cập nhật trạng thái</h3>
          <p style="color: #1e3a8a; margin: 0;">
            Tỷ số trận đấu đã được cả hai người chơi xác nhận. CLB đang xem xét và sẽ xác nhận kết quả cuối cùng.
          </p>
        </div>
      `;
      actionButtons = `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${challengeUrl}" 
             style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            👀 Xem chi tiết trận đấu
          </a>
        </div>
      `;
      additionalInfo = `
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #0369a1; margin: 0 0 10px 0;">📋 Trạng thái hiện tại:</h4>
          <ul style="color: #0284c7; margin: 0; padding-left: 20px;">
            <li>✅ Tỷ số đã được nhập</li>
            <li>✅ Cả hai người chơi đã xác nhận</li>
            <li>⏳ Đang chờ CLB xác nhận cuối cùng</li>
            <li>🔄 ELO/SPA sẽ được cập nhật sau khi CLB xác nhận</li>
          </ul>
        </div>
      `;
      break;

    case 'club_final_confirmation':
      subject = `🎱 Trận đấu hoàn thành - ELO/SPA đã được cập nhật`;
      mainMessage = `
        <div style="background: #dcfce7; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="color: #059669; margin: 0 0 10px 0;">🎉 Trận đấu hoàn thành!</h3>
          <p style="color: #047857; margin: 0;">
            CLB đã xác nhận kết quả trận đấu. ELO và SPA điểm của bạn đã được cập nhật.
          </p>
        </div>
      `;
      actionButtons = `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/profile" 
             style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 0 10px; display: inline-block;">
            📊 Xem thống kê cá nhân
          </a>
          <a href="${baseUrl}/leaderboard" 
             style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 0 10px; display: inline-block;">
            🏆 Xem bảng xếp hạng
          </a>
        </div>
      `;
      additionalInfo = `
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #15803d; margin: 0 0 10px 0;">✨ Kết quả đã được ghi nhận:</h4>
          <ul style="color: #16a34a; margin: 0; padding-left: 20px;">
            <li>🎯 ELO rating đã được cập nhật</li>
            <li>💎 SPA điểm đã được cộng/trừ</li>
            <li>📈 Thống kê cá nhân đã được cập nhật</li>
            <li>🏆 Xếp hạng trên bảng xếp hạng đã thay đổi</li>
          </ul>
        </div>
      `;
      break;

    default:
      subject = '🎱 Thông báo từ SABO Pool Arena';
      mainMessage = '<p>Có cập nhật mới về trận đấu của bạn.</p>';
      actionButtons = '';
      additionalInfo = '';
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎱 SABO Pool Arena</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 5px 0 0 0; font-size: 16px;">Nền tảng thi đấu Billiards hàng đầu</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 24px;">Xin chào ${recipient_name}!</h2>
          
          ${mainMessage}

          <!-- Match Details -->
          <div style="background: #f8fafc; padding: 25px; border-radius: 10px; margin: 25px 0; border: 1px solid #e2e8f0;">
            <h3 style="color: #1e40af; margin: 0 0 20px 0; font-size: 18px;">🎯 Chi tiết trận đấu</h3>
            
            <!-- Score Display -->
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border: 2px solid #e2e8f0;">
              <div style="text-align: center;">
                <h4 style="color: #374151; margin: 0 0 15px 0;">Tỷ số trận đấu:</h4>
                <div style="font-size: 24px; font-weight: bold; color: #1e40af; margin: 10px 0;">
                  ${scoreDisplay}
                </div>
              </div>
            </div>

            <div style="display: table; width: 100%; margin-top: 15px;">
              <div style="display: table-row;">
                <div style="display: table-cell; padding: 8px 0; color: #6b7280;"><strong>⏰ Thời gian:</strong></div>
                <div style="display: table-cell; padding: 8px 0; text-align: right; color: #374151;">${timeDisplay}</div>
              </div>
              <div style="display: table-row;">
                <div style="display: table-cell; padding: 8px 0; color: #6b7280;"><strong>🏢 Địa điểm:</strong></div>
                <div style="display: table-cell; padding: 8px 0; text-align: right; color: #374151;">${clubDisplay}</div>
              </div>
              <div style="display: table-row;">
                <div style="display: table-cell; padding: 8px 0; color: #6b7280;"><strong>🆔 Mã trận đấu:</strong></div>
                <div style="display: table-cell; padding: 8px 0; text-align: right; color: #374151; font-family: monospace;">#${challenge_id.slice(0, 8).toUpperCase()}</div>
              </div>
            </div>
          </div>

          ${actionButtons}
          ${additionalInfo}

          <!-- Quick Access -->
          <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h4 style="color: #374151; margin: 0 0 15px 0;">🔗 Truy cập nhanh:</h4>
            <div style="text-align: center;">
              <a href="${baseUrl}/challenges" style="color: #3b82f6; text-decoration: none; margin: 0 15px; font-weight: bold;">📋 Danh sách thách đấu</a>
              <a href="${baseUrl}/profile" style="color: #3b82f6; text-decoration: none; margin: 0 15px; font-weight: bold;">👤 Hồ sơ cá nhân</a>
              <a href="${baseUrl}/leaderboard" style="color: #3b82f6; text-decoration: none; margin: 0 15px; font-weight: bold;">🏆 Bảng xếp hạng</a>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
            Cần hỗ trợ? Liên hệ với chúng tôi tại: 
            <a href="mailto:support@sabopoolarena.com" style="color: #3b82f6; text-decoration: none;">support@sabopoolarena.com</a>
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Đây là email tự động từ SABO Pool Arena. Vui lòng không trả lời email này.<br>
            © 2024 SABO Pool Arena. Tất cả quyền được bảo lưu.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  return { subject, html };
}
