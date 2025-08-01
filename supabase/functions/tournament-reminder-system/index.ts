import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface TournamentMatch {
  id: string;
  tournament_id: string;
  player1_id: string;
  player2_id: string;
  scheduled_time: string;
  tournament: {
    name: string;
    venue_address: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('⏰ Starting tournament reminder system...');

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);

    let totalNotifications = 0;

    // 1. 24-hour advance reminders for tournaments starting tomorrow
    console.log('📅 Checking for tournaments starting in 24 hours...');
    const { data: tournamentsIn24h, error: t24Error } = await supabase
      .from('tournaments')
      .select('id, name, tournament_start, venue_address')
      .gte('tournament_start', now.toISOString())
      .lte('tournament_start', in24Hours.toISOString())
      .in('status', ['ongoing', 'registration_closed']);

    if (t24Error) {
      console.error('❌ Error fetching 24h tournaments:', t24Error);
    } else {
      for (const tournament of tournamentsIn24h || []) {
        // Get all registered participants
        const { data: participants, error: pError } = await supabase
          .from('tournament_registrations')
          .select('user_id')
          .eq('tournament_id', tournament.id)
          .eq('status', 'confirmed');

        if (!pError && participants?.length) {
          const notifications = participants.map(p => ({
            user_id: p.user_id,
            type: 'tournament_reminder_24h',
            title: 'Nhắc nhở giải đấu - 24 giờ',
            message: `Giải đấu "${tournament.name}" sẽ bắt đầu vào ngày mai. Hãy chuẩn bị sẵn sàng!`,
            priority: 'normal',
            action_url: `/tournaments/${tournament.id}`,
            metadata: {
              tournament_id: tournament.id,
              tournament_name: tournament.name,
              tournament_start: tournament.tournament_start,
              venue: tournament.venue_address,
              reminder_type: '24h_advance',
            },
          }));

          const { error: notifError } = await supabase
            .from('notifications')
            .insert(notifications);

          if (!notifError) {
            totalNotifications += notifications.length;
            console.log(
              `📢 Sent 24h reminders for "${tournament.name}" to ${notifications.length} participants`
            );
          }
        }
      }
    }

    // 2. 2-hour advance reminders for matches starting soon
    console.log('🕐 Checking for matches starting in 2 hours...');
    const { data: matchesIn2h, error: m2Error } = await supabase
      .from('tournament_matches')
      .select(
        `
        id, tournament_id, player1_id, player2_id, scheduled_time,
        tournaments(name, venue_address)
      `
      )
      .gte('scheduled_time', now.toISOString())
      .lte('scheduled_time', in2Hours.toISOString())
      .eq('status', 'scheduled');

    if (m2Error) {
      console.error('❌ Error fetching 2h matches:', m2Error);
    } else {
      for (const match of matchesIn2h || []) {
        const notifications = [];

        if (match.player1_id) {
          notifications.push({
            user_id: match.player1_id,
            type: 'match_reminder_2h',
            title: 'Trận đấu sắp bắt đầu - 2 giờ',
            message: `Trận đấu của bạn trong giải "${match.tournaments?.name}" sẽ bắt đầu trong 2 giờ nữa.`,
            priority: 'high',
            action_url: `/tournaments/${match.tournament_id}`,
            metadata: {
              match_id: match.id,
              tournament_id: match.tournament_id,
              tournament_name: match.tournaments?.name,
              scheduled_time: match.scheduled_time,
              venue: match.tournaments?.venue_address,
              reminder_type: '2h_match',
            },
          });
        }

        if (match.player2_id) {
          notifications.push({
            user_id: match.player2_id,
            type: 'match_reminder_2h',
            title: 'Trận đấu sắp bắt đầu - 2 giờ',
            message: `Trận đấu của bạn trong giải "${match.tournaments?.name}" sẽ bắt đầu trong 2 giờ nữa.`,
            priority: 'high',
            action_url: `/tournaments/${match.tournament_id}`,
            metadata: {
              match_id: match.id,
              tournament_id: match.tournament_id,
              tournament_name: match.tournaments?.name,
              scheduled_time: match.scheduled_time,
              venue: match.tournaments?.venue_address,
              reminder_type: '2h_match',
            },
          });
        }

        if (notifications.length > 0) {
          const { error: notifError } = await supabase
            .from('notifications')
            .insert(notifications);

          if (!notifError) {
            totalNotifications += notifications.length;
            console.log(
              `📢 Sent 2h match reminders for tournament "${match.tournaments?.name}" to ${notifications.length} players`
            );
          }
        }
      }
    }

    // 3. 30-minute urgent reminders for matches starting very soon
    console.log('⚡ Checking for matches starting in 30 minutes...');
    const { data: matchesIn30m, error: m30Error } = await supabase
      .from('tournament_matches')
      .select(
        `
        id, tournament_id, player1_id, player2_id, scheduled_time,
        tournaments(name, venue_address)
      `
      )
      .gte('scheduled_time', now.toISOString())
      .lte('scheduled_time', in30Minutes.toISOString())
      .eq('status', 'scheduled');

    if (m30Error) {
      console.error('❌ Error fetching 30m matches:', m30Error);
    } else {
      for (const match of matchesIn30m || []) {
        const notifications = [];

        if (match.player1_id) {
          notifications.push({
            user_id: match.player1_id,
            type: 'match_reminder_30m',
            title: '🚨 KHẨN CẤP - Trận đấu 30 phút nữa!',
            message: `Trận đấu của bạn trong giải "${match.tournaments?.name}" sẽ bắt đầu trong 30 phút nữa. Hãy di chuyển đến địa điểm ngay!`,
            priority: 'urgent',
            action_url: `/tournaments/${match.tournament_id}`,
            metadata: {
              match_id: match.id,
              tournament_id: match.tournament_id,
              tournament_name: match.tournaments?.name,
              scheduled_time: match.scheduled_time,
              venue: match.tournaments?.venue_address,
              reminder_type: '30m_urgent',
            },
          });
        }

        if (match.player2_id) {
          notifications.push({
            user_id: match.player2_id,
            type: 'match_reminder_30m',
            title: '🚨 KHẨN CẤP - Trận đấu 30 phút nữa!',
            message: `Trận đấu của bạn trong giải "${match.tournaments?.name}" sẽ bắt đầu trong 30 phút nữa. Hãy di chuyển đến địa điểm ngay!`,
            priority: 'urgent',
            action_url: `/tournaments/${match.tournament_id}`,
            metadata: {
              match_id: match.id,
              tournament_id: match.tournament_id,
              tournament_name: match.tournaments?.name,
              scheduled_time: match.scheduled_time,
              venue: match.tournaments?.venue_address,
              reminder_type: '30m_urgent',
            },
          });
        }

        if (notifications.length > 0) {
          const { error: notifError } = await supabase
            .from('notifications')
            .insert(notifications);

          if (!notifError) {
            totalNotifications += notifications.length;
            console.log(
              `🚨 Sent URGENT 30m reminders for tournament "${match.tournaments?.name}" to ${notifications.length} players`
            );
          }
        }
      }
    }

    // Log the automation activity
    await supabase.from('system_logs').insert({
      log_type: 'tournament_reminder_system',
      message: 'Tournament reminder system completed',
      metadata: {
        tournaments_24h: tournamentsIn24h?.length || 0,
        matches_2h: matchesIn2h?.length || 0,
        matches_30m: matchesIn30m?.length || 0,
        total_notifications_sent: totalNotifications,
        execution_time: new Date().toISOString(),
      },
    });

    const result = {
      success: true,
      tournaments_24h_reminders: tournamentsIn24h?.length || 0,
      matches_2h_reminders: matchesIn2h?.length || 0,
      matches_30m_urgent: matchesIn30m?.length || 0,
      total_notifications_sent: totalNotifications,
      message: `Sent ${totalNotifications} reminder notifications`,
    };

    console.log('🎉 Tournament reminder system completed:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('💥 Error in tournament reminder system:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
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
