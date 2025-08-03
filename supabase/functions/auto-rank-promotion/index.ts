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

    console.log('⬆️ Starting auto rank promotion check...');

    // Get all players who might be eligible for promotion based on ELO points and matches
    const { data: eligiblePlayers, error: playersError } = await supabase
      .from('player_rankings')
      .select(
        `
        user_id, elo_points, total_matches, current_rank_id,
        ranks!current_rank_id(id, code, level, name)
      `
      )
      .gte('elo', 1000)
      .gte('total_matches', 10);

    if (playersError) {
      console.error('❌ Error fetching eligible players:', playersError);
      throw playersError;
    }

    console.log(
      `👥 Found ${eligiblePlayers?.length || 0} players with 1000+ ELO and 10+ matches`
    );

    let promotionsCount = 0;
    const notifications = [];

    for (const player of eligiblePlayers || []) {
      console.log(
        `🎯 Checking player: ${player.user_id} with ${player.elo_points} ELO points and ${player.total_matches} matches`
      );

      // Check if player meets all promotion criteria using the corrected function
      const { data: promotionResult, error: promotionError } =
        await supabase.rpc('check_rank_promotion', {
          p_user_id: player.user_id,
        });

      if (promotionError) {
        console.error(
          `❌ Error checking promotion for player ${player.user_id}:`,
          promotionError
        );
        continue;
      }

      if (promotionResult) {
        promotionsCount++;
        console.log(
          `🎉 Successfully promoted player ${player.user_id} from ${player.ranks?.code} to next rank`
        );

        // Get updated player info for notification
        const { data: updatedPlayer, error: updateError } = await supabase
          .from('player_rankings')
          .select(
            `
            user_id, elo_points, current_rank_id,
            ranks!current_rank_id(id, code, level, name)
          `
          )
          .eq('user_id', player.user_id)
          .single();

        if (!updateError && updatedPlayer) {
          notifications.push({
            user_id: player.user_id,
            type: 'auto_rank_promotion',
            title: '🎉 Tự động thăng hạng!',
            message: `Chúc mừng! Bạn đã được tự động thăng hạng từ ${player.ranks?.code} lên ${updatedPlayer.ranks?.code} nhờ thành tích xuất sắc!`,
            priority: 'high',
            action_url: '/profile?tab=ranking',
            metadata: {
              old_rank_code: player.ranks?.code,
              new_rank_code: updatedPlayer.ranks?.code,
              old_rank_level: player.ranks?.level,
              new_rank_level: updatedPlayer.ranks?.level,
              elo_rating: updatedPlayer.elo,
              promotion_type: 'automatic',
              promotion_date: new Date().toISOString(),
            },
          });

          // Log rank promotion history
          await supabase.from('ranking_history').insert({
            user_id: player.user_id,
            old_rank_id: player.current_rank_id,
            new_rank_id: updatedPlayer.current_rank_id,
            promotion_type: 'automatic',
            total_points_earned: 1.0,
            created_at: new Date().toISOString(),
          });
        }
      } else {
        console.log(
          `ℹ️ Player ${player.user_id} not promoted - may not meet ELO or verification requirements`
        );
      }
    }

    // Send all promotion notifications
    if (notifications.length > 0) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (!notifError) {
        console.log(`📢 Sent ${notifications.length} promotion notifications`);
      } else {
        console.error('❌ Error sending promotion notifications:', notifError);
      }
    }

    // Create achievement posts for promoted players
    for (const notification of notifications) {
      if (
        notification.metadata?.old_rank_code &&
        notification.metadata?.new_rank_code
      ) {
        await supabase.from('posts').insert({
          user_id: notification.user_id,
          content: `🎉 Đã tự động thăng hạng từ ${notification.metadata.old_rank_code} lên ${notification.metadata.new_rank_code}! 🏆`,
          post_type: 'achievement',
          is_public: true,
          metadata: {
            achievement_type: 'auto_rank_promotion',
            old_rank: notification.metadata.old_rank_code,
            new_rank: notification.metadata.new_rank_code,
            spa_points_used: 1000,
          },
        });
      }
    }

    // Send summary to admins
    const { data: admins, error: adminError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('is_admin', true);

    if (!adminError && admins && promotionsCount > 0) {
      const adminNotifications = admins.map(admin => ({
        user_id: admin.user_id,
        type: 'auto_promotion_summary',
        title: 'Báo cáo thăng hạng tự động',
        message: `Hệ thống đã tự động thăng hạng cho ${promotionsCount} người chơi dựa trên ELO rating và thành tích.`,
        priority: 'low',
        metadata: {
          promotions_count: promotionsCount,
          eligible_players: eligiblePlayers?.length || 0,
          execution_date: new Date().toISOString(),
        },
      }));

      await supabase.from('notifications').insert(adminNotifications);
    }

    // Log the automation activity
    await supabase.from('system_logs').insert({
      log_type: 'auto_rank_promotion',
      message: 'Auto rank promotion completed',
      metadata: {
        eligible_players: eligiblePlayers?.length || 0,
        promotions_executed: promotionsCount,
        notifications_sent: notifications.length,
        execution_time: new Date().toISOString(),
        promotion_criteria: {
          elo_required: 1000,
          min_matches: 10,
          automatic_promotion: true,
        },
      },
    });

    const result = {
      success: true,
      eligible_players: eligiblePlayers?.length || 0,
      promotions_executed: promotionsCount,
      notifications_sent: notifications.length,
      message: `Promoted ${promotionsCount} players and sent ${notifications.length} notifications`,
    };

    console.log('🎉 Auto rank promotion completed:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('💥 Error in auto rank promotion:', error);

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
