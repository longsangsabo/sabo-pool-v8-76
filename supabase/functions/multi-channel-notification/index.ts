import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  notification_id: string;
  user_id: string;
  channels: string[];
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
  metadata?: Record<string, any>;
}

interface CommunicationChannel {
  channel_type: 'sms' | 'email' | 'zalo' | 'push';
  channel_address: string;
  is_verified: boolean;
}

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// SMS Service using Twilio (placeholder - needs actual API keys)
async function sendSMS(phoneNumber: string, message: string): Promise<boolean> {
  try {
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.log('SMS: Missing Twilio credentials, skipping SMS delivery');
      return false;
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: twilioPhoneNumber,
          To: phoneNumber,
          Body: message,
        }),
      }
    );

    if (response.ok) {
      console.log(`SMS sent successfully to ${phoneNumber}`);
      return true;
    } else {
      const error = await response.text();
      console.error(`SMS failed for ${phoneNumber}:`, error);
      return false;
    }
  } catch (error) {
    console.error('SMS delivery error:', error);
    return false;
  }
}

// Email Service using Resend
async function sendEmail(
  email: string,
  title: string,
  message: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      console.log('Email: Missing Resend API key, skipping email delivery');
      return false;
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🎱 Sabo Pool Arena</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 16px;">${title}</h2>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
            <p style="color: #666; line-height: 1.6; margin: 0;">${message}</p>
          </div>
          ${
            metadata?.action_url
              ? `
            <div style="text-align: center; margin-top: 20px;">
              <a href="${metadata.action_url}" 
                 style="background: #667eea; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                Xem chi tiết
              </a>
            </div>
          `
              : ''
          }
        </div>
        <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>Đây là email tự động từ Sabo Pool Arena. Vui lòng không trả lời email này.</p>
        </div>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Sabo Pool Arena <noreply@sabopoolarena.com>',
        to: [email],
        subject: title,
        html: emailHtml,
      }),
    });

    if (response.ok) {
      console.log(`Email sent successfully to ${email}`);
      return true;
    } else {
      const error = await response.text();
      console.error(`Email failed for ${email}:`, error);
      return false;
    }
  } catch (error) {
    console.error('Email delivery error:', error);
    return false;
  }
}

// Push Notification Service using Firebase Cloud Messaging
async function sendPushNotification(
  token: string,
  title: string,
  message: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  try {
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');

    if (!fcmServerKey) {
      console.log('Push: Missing FCM server key, skipping push notification');
      return false;
    }

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        Authorization: `key=${fcmServerKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title: title,
          body: message,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
        },
        data: metadata || {},
      }),
    });

    if (response.ok) {
      console.log(`Push notification sent successfully to ${token}`);
      return true;
    } else {
      const error = await response.text();
      console.error(`Push notification failed for ${token}:`, error);
      return false;
    }
  } catch (error) {
    console.error('Push notification delivery error:', error);
    return false;
  }
}

// Zalo Service (placeholder - needs actual Zalo API integration)
async function sendZaloMessage(
  zaloId: string,
  message: string
): Promise<boolean> {
  try {
    const zaloAccessToken = Deno.env.get('ZALO_ACCESS_TOKEN');

    if (!zaloAccessToken) {
      console.log('Zalo: Missing access token, skipping Zalo delivery');
      return false;
    }

    // Placeholder for Zalo API integration
    // This would need actual Zalo Official API implementation
    console.log(`Zalo message would be sent to ${zaloId}: ${message}`);
    return true;
  } catch (error) {
    console.error('Zalo delivery error:', error);
    return false;
  }
}

// Main notification delivery function
async function deliverNotification(
  channels: CommunicationChannel[],
  enabledChannels: string[],
  title: string,
  message: string,
  smsMessage?: string,
  metadata?: Record<string, any>
): Promise<{ sent: string[]; failed: string[] }> {
  const sent: string[] = [];
  const failed: string[] = [];

  for (const channel of channels) {
    if (
      !enabledChannels.includes(channel.channel_type) ||
      !channel.is_verified
    ) {
      continue;
    }

    let success = false;

    switch (channel.channel_type) {
      case 'sms':
        success = await sendSMS(channel.channel_address, smsMessage || message);
        break;
      case 'email':
        success = await sendEmail(
          channel.channel_address,
          title,
          message,
          metadata
        );
        break;
      case 'push':
        success = await sendPushNotification(
          channel.channel_address,
          title,
          message,
          metadata
        );
        break;
      case 'zalo':
        success = await sendZaloMessage(channel.channel_address, message);
        break;
    }

    if (success) {
      sent.push(channel.channel_type);
    } else {
      failed.push(channel.channel_type);
    }

    // Update channel usage
    await supabase
      .from('user_communication_channels')
      .update({ last_used_at: new Date().toISOString() })
      .eq('user_id', channel.channel_address);
  }

  return { sent, failed };
}

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      notification_id,
      user_id,
      channels,
      title,
      message,
      priority,
      category,
      metadata,
    }: NotificationRequest = await req.json();

    console.log(
      `Processing notification ${notification_id} for user ${user_id}`
    );

    // Get user's communication channels
    const { data: userChannels, error: channelsError } = await supabase
      .from('user_communication_channels')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true);

    if (channelsError) {
      throw new Error(
        `Failed to fetch user channels: ${channelsError.message}`
      );
    }

    // Get user's notification preferences
    const { data: preferences, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (prefsError && prefsError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch preferences: ${prefsError.message}`);
    }

    // Check quiet hours
    if (preferences?.quiet_hours_enabled) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      const quietStart = preferences.quiet_start_time;
      const quietEnd = preferences.quiet_end_time;

      const isQuietTime =
        quietStart <= quietEnd
          ? currentTime >= quietStart && currentTime <= quietEnd
          : currentTime >= quietStart || currentTime <= quietEnd;

      if (isQuietTime && priority !== 'urgent') {
        console.log('Notification blocked due to quiet hours');

        // Update notification log
        await supabase
          .from('notification_logs')
          .update({
            status: 'cancelled',
            channels_failed: ['quiet_hours'],
            updated_at: new Date().toISOString(),
          })
          .eq('id', notification_id);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Notification cancelled due to quiet hours',
            sent: [],
            failed: ['quiet_hours'],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
    }

    // Determine enabled channels based on preferences
    const enabledChannels: string[] = [];
    if (preferences?.in_app) enabledChannels.push('in_app');
    if (preferences?.email) enabledChannels.push('email');
    if (preferences?.sms) enabledChannels.push('sms');
    if (preferences?.push_notification) enabledChannels.push('push');
    if (preferences?.zalo) enabledChannels.push('zalo');

    // Filter channels based on request and user preferences
    const targetChannels = channels.filter(c => enabledChannels.includes(c));

    // Get SMS template if available
    const { data: template } = await supabase
      .from('notification_templates')
      .select('sms_template')
      .eq('template_key', metadata?.template_key)
      .single();

    // Deliver notifications
    const deliveryResult = await deliverNotification(
      userChannels as CommunicationChannel[],
      targetChannels,
      title,
      message,
      template?.sms_template,
      metadata
    );

    // Update notification log with delivery status
    const updateData: any = {
      status: deliveryResult.sent.length > 0 ? 'sent' : 'failed',
      channels_sent: deliveryResult.sent,
      channels_failed: deliveryResult.failed,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (deliveryResult.sent.length > 0) {
      updateData.delivered_at = new Date().toISOString();
    }

    await supabase
      .from('notification_logs')
      .update(updateData)
      .eq('id', notification_id);

    console.log(`Notification ${notification_id} processed:`, deliveryResult);

    return new Response(
      JSON.stringify({
        success: true,
        notification_id,
        ...deliveryResult,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error) {
    console.error('Multi-channel notification error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});
