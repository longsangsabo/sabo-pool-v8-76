import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🧹 Starting inactive player cleanup...');

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const cleanupStats = {
      tournament_registrations_removed: 0,
      challenge_requests_cancelled: 0,
      notifications_sent: 0,
      profiles_marked_inactive: 0,
    };

    // 1. Find and remove inactive tournament registrations
    console.log('📋 Cleaning up inactive tournament registrations...');

    // Find registrations for users who haven't been active in 30 days
    const { data: inactiveRegistrations, error: regError } = await supabase
      .from('tournament_registrations')
      .select(
        `
        id, user_id, tournament_id,
        tournaments(name, tournament_start, status)
      `
      )
      .eq('status', 'pending')
      .not('tournaments.tournament_start', 'lt', now.toISOString());

    if (!regError && inactiveRegistrations) {
      for (const registration of inactiveRegistrations) {
        // Check if user has been inactive for 30+ days
        const { data: recentActivity, error: activityError } = await supabase
          .from('matches')
          .select('id')
          .or(
            `player1_id.eq.${registration.user_id},player2_id.eq.${registration.user_id}`
          )
          .gte('created_at', thirtyDaysAgo.toISOString())
          .limit(1);

        if (
          !activityError &&
          (!recentActivity || recentActivity.length === 0)
        ) {
          // User is inactive, remove their registration
          const { error: deleteError } = await supabase
            .from('tournament_registrations')
            .delete()
            .eq('id', registration.id);

          if (!deleteError) {
            cleanupStats.tournament_registrations_removed++;
            console.log(
              `🗑️ Removed inactive registration for tournament: ${registration.tournaments?.name}`
            );

            // Send notification to user about removal
            await supabase.from('notifications').insert({
              user_id: registration.user_id,
              type: 'registration_removed_inactive',
              title: 'Đăng ký giải đấu đã bị hủy',
              message: `Đăng ký của bạn cho giải "${registration.tournaments?.name}" đã bị hủy do không hoạt động. Bạn có thể đăng ký lại nếu muốn.`,
              priority: 'normal',
              action_url: `/tournaments/${registration.tournament_id}`,
              metadata: {
                tournament_id: registration.tournament_id,
                tournament_name: registration.tournaments?.name,
                removal_reason: 'inactive_30_days',
              },
            });
            cleanupStats.notifications_sent++;
          }
        }
      }
    }

    // 2. Cancel old pending challenge requests
    console.log('⚔️ Cleaning up old challenge requests...');

    const { data: oldChallenges, error: challengeError } = await supabase
      .from('challenges')
      .select('id, challenger_id, opponent_id')
      .eq('status', 'pending')
      .lt('created_at', sevenDaysAgo.toISOString());

    if (!challengeError && oldChallenges) {
      for (const challenge of oldChallenges) {
        const { error: updateError } = await supabase
          .from('challenges')
          .update({
            status: 'expired',
            updated_at: now.toISOString(),
          })
          .eq('id', challenge.id);

        if (!updateError) {
          cleanupStats.challenge_requests_cancelled++;
          console.log(`⏱️ Expired old challenge request: ${challenge.id}`);

          // Notify challenger about expired challenge
          await supabase.from('notifications').insert({
            user_id: challenge.challenger_id,
            type: 'challenge_expired',
            title: 'Thách đấu đã hết hạn',
            message:
              'Lời thách đấu của bạn đã hết hạn do không được phản hồi trong 7 ngày.',
            priority: 'low',
            metadata: {
              challenge_id: challenge.id,
              expiry_reason: 'no_response_7_days',
            },
          });
          cleanupStats.notifications_sent++;
        }
      }
    }

    // 3. Mark inactive profiles
    console.log('👤 Marking inactive profiles...');

    const { data: inactiveProfiles, error: profileError } = await supabase.rpc(
      'get_inactive_players',
      { days_threshold: 30 }
    );

    if (!profileError && inactiveProfiles) {
      for (const profile of inactiveProfiles) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            activity_status: 'inactive',
            last_activity_check: now.toISOString(),
          })
          .eq('user_id', profile.user_id);

        if (!updateError) {
          cleanupStats.profiles_marked_inactive++;
          console.log(`💤 Marked profile as inactive: ${profile.user_id}`);
        }
      }
    }

    // 4. Send summary notification to admins
    const { data: admins, error: adminError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('is_admin', true);

    if (!adminError && admins) {
      const adminNotifications = admins.map(admin => ({
        user_id: admin.user_id,
        type: 'cleanup_summary',
        title: 'Báo cáo dọn dẹp hệ thống',
        message: `Đã dọn dẹp: ${cleanupStats.tournament_registrations_removed} đăng ký giải đấu, ${cleanupStats.challenge_requests_cancelled} thách đấu hết hạn, ${cleanupStats.profiles_marked_inactive} tài khoản không hoạt động.`,
        priority: 'low',
        metadata: {
          cleanup_stats: cleanupStats,
          execution_date: now.toISOString(),
        },
      }));

      await supabase.from('notifications').insert(adminNotifications);
    }

    // Log the automation activity
    await supabase.from('system_logs').insert({
      log_type: 'inactive_player_cleanup',
      message: 'Inactive player cleanup completed',
      metadata: {
        ...cleanupStats,
        execution_time: new Date().toISOString(),
        cleanup_thresholds: {
          tournament_registration_days: 30,
          challenge_expiry_days: 7,
          profile_inactive_days: 30,
        },
      },
    });

    const result = {
      success: true,
      ...cleanupStats,
      message: `Cleanup completed: ${cleanupStats.tournament_registrations_removed} registrations, ${cleanupStats.challenge_requests_cancelled} challenges, ${cleanupStats.profiles_marked_inactive} profiles`,
    };

    console.log('🎉 Inactive player cleanup completed:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('💥 Error in inactive player cleanup:', error);

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
