import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  user_id: string;
  template_key?: string;
  variables?: Record<string, string>;
  priority?: string;
  scheduled_at?: string;
  // Direct message support
  type?: string;
  title?: string;
  message?: string;
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
      user_id,
      template_key,
      variables = {},
      priority,
      scheduled_at,
      type,
      title: directTitle,
      message: directMessage,
    }: NotificationRequest = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let finalTitle: string;
    let finalMessage: string;
    let finalType: string;
    let finalPriority: string = priority || 'normal';
    let category: string = 'general';

    // Check if it's a direct message or template-based
    if (directTitle && directMessage && type) {
      // Direct message mode
      finalTitle = directTitle;
      finalMessage = directMessage;
      finalType = type;
      console.log('Using direct message mode:', {
        user_id,
        type,
        title: directTitle,
        message: directMessage,
      });
    } else if (template_key) {
      // Template mode
      const { data: template, error: templateError } = await supabaseClient
        .from('notification_templates')
        .select('*')
        .eq('template_key', template_key)
        .eq('is_active', true)
        .single();

      if (templateError || !template) {
        console.error('Template error:', templateError);
        return new Response(JSON.stringify({ error: 'Template not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Process template variables
      finalTitle = template.title_template;
      finalMessage = template.message_template;

      for (const [key, value] of Object.entries(variables)) {
        finalTitle = finalTitle.replace(new RegExp(`{{${key}}}`, 'g'), value);
        finalMessage = finalMessage.replace(
          new RegExp(`{{${key}}}`, 'g'),
          value
        );
      }

      finalType = template_key;
      finalPriority = priority || template.default_priority;
      category = template.category;
      console.log('Using template mode:', {
        user_id,
        template_key,
        finalTitle,
        finalMessage,
      });
    } else {
      return new Response(
        JSON.stringify({
          error: 'Either provide template_key or direct title/message/type',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create in-app notification for immediate display
    const { data: notificationData, error: notificationError } =
      await supabaseClient
        .from('notifications')
        .insert({
          user_id,
          type: finalType,
          title: finalTitle,
          message: finalMessage,
          priority: finalPriority,
          metadata: variables || {},
          is_read: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (notificationError) {
      console.error('Notification error:', notificationError);
      throw notificationError;
    }

    console.log(
      `Notification sent successfully to user ${user_id}:`,
      notificationData
    );

    return new Response(
      JSON.stringify({
        success: true,
        notification: notificationData,
        message: 'Notification sent successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
