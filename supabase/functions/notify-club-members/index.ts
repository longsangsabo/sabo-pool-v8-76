import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface NotifyClubMembersRequest {
  tournament_id: string;
  club_id: string;
  tournament_name: string;
  created_by_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      tournament_id,
      club_id,
      tournament_name,
      created_by_id,
    }: NotifyClubMembersRequest = await req.json();

    console.log('📢 Notifying club members:', {
      tournament_id,
      club_id,
      tournament_name,
      created_by_id,
    });

    // Get club information and creator name
    const { data: clubData, error: clubError } = await supabase
      .from('club_profiles')
      .select('club_name, user_id')
      .eq('id', club_id)
      .single();

    if (clubError) {
      console.error('❌ Error fetching club:', clubError);
      throw clubError;
    }

    const { data: creatorData, error: creatorError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', created_by_id)
      .single();

    if (creatorError) {
      console.error('❌ Error fetching creator:', creatorError);
      throw creatorError;
    }

    // Get all club members (people who have registered for tournaments at this club)
    const { data: clubMembers, error: membersError } = await supabase
      .from('tournament_registrations')
      .select(
        `
        user_id,
        profiles!inner(full_name, user_id)
      `
      )
      .neq('user_id', created_by_id) // Don't notify the creator
      .in(
        'tournament_id',
        supabase.from('tournaments').select('id').eq('club_id', club_id)
      );

    if (membersError) {
      console.error('❌ Error fetching club members:', membersError);
      throw membersError;
    }

    // Get unique club members
    const uniqueMembers =
      clubMembers?.reduce(
        (acc, reg) => {
          const userId = reg.user_id;
          if (!acc.find(member => member.user_id === userId)) {
            acc.push({
              user_id: userId,
              full_name: reg.profiles?.full_name || 'Thành viên',
            });
          }
          return acc;
        },
        [] as Array<{ user_id: string; full_name: string }>
      ) || [];

    console.log('👥 Found club members:', uniqueMembers.length);

    // Create notifications for all club members
    const notifications = uniqueMembers.map(member => ({
      user_id: member.user_id,
      type: 'tournament_created',
      title: '🏆 Giải đấu mới tại CLB',
      message: `${creatorData?.full_name || 'CLB'} đã tạo giải đấu "${tournament_name}" tại ${clubData.club_name}. Hãy đăng ký ngay!`,
      priority: 'normal',
      metadata: {
        tournament_id,
        club_id,
        tournament_name,
        club_name: clubData.club_name,
        created_by: creatorData?.full_name || 'CLB',
      },
      action_url: `/tournaments/${tournament_id}`,
      created_at: new Date().toISOString(),
    }));

    if (notifications.length > 0) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notificationError) {
        console.error('❌ Error creating notifications:', notificationError);
        throw notificationError;
      }

      console.log(
        '✅ Created notifications for',
        notifications.length,
        'club members'
      );
    }

    // Also send real-time notification
    const { error: realtimeError } = await supabase
      .channel('club-notifications')
      .send({
        type: 'broadcast',
        event: 'tournament_created',
        payload: {
          tournament_id,
          tournament_name,
          club_id,
          club_name: clubData.club_name,
          created_by: creatorData?.full_name || 'CLB',
          message: `Giải đấu mới "${tournament_name}" đã được tạo!`,
        },
      });

    if (realtimeError) {
      console.error(
        '⚠️ Warning: Real-time notification failed:',
        realtimeError
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Đã gửi thông báo cho ${notifications.length} thành viên CLB`,
        notifications_sent: notifications.length,
        club_name: clubData.club_name,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('❌ Error in notify-club-members function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);
