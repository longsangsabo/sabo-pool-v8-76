import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface ResetRequest {
  resetType: 'soft' | 'hard' | 'demo_cleanup' | 'club_reset' | 'stats_only';
  confirmation: string;
  backup: boolean;
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', {
        status: 401,
        headers: corsHeaders,
      });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return new Response('Unauthorized', {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Check admin permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return new Response('Forbidden - Admin access required', {
        status: 403,
        headers: corsHeaders,
      });
    }

    const { resetType, confirmation, backup }: ResetRequest = await req.json();

    // Validate confirmation
    if (confirmation !== 'RESET') {
      return new Response('Invalid confirmation', {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: user.id,
      action_type: 'system_reset',
      target_type: 'system',
      details: {
        reset_type: resetType,
        backup_requested: backup,
        timestamp: new Date().toISOString(),
      },
    });

    // Perform reset based on type
    let resetResults: any = {};

    switch (resetType) {
      case 'soft':
        resetResults = await performSoftReset(supabase);
        break;
      case 'hard':
        resetResults = await performHardReset(supabase);
        break;
      case 'demo_cleanup':
        resetResults = await performDemoCleanup(supabase);
        break;
      case 'club_reset':
        resetResults = await performClubReset(supabase);
        break;
      case 'stats_only':
        resetResults = await performStatsReset(supabase);
        break;
      default:
        return new Response('Invalid reset type', {
          status: 400,
          headers: corsHeaders,
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        reset_type: resetType,
        results: resetResults,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Reset error:', error);
    return new Response(
      JSON.stringify({
        error: 'Reset failed',
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function performSoftReset(supabase: any) {
  console.log('Performing soft reset - resetting user stats only');

  try {
    // Reset player rankings to defaults (exclude demo users from being reset to real user values)
    const { error: rankingError } = await supabase
      .from('player_rankings')
      .update({
        elo_points: 1000,
        spa_points: 0,
        total_matches: 0,
        wins: 0,
        losses: 0,
        win_streak: 0,
        current_rank: null,
        promotion_eligible: false,
        last_promotion_date: null,
        updated_at: new Date().toISOString(),
      })
      .neq('user_id', '00000000-0000-0000-0000-000000000000'); // Add WHERE clause

    // Reset player stats
    const { error: statsError } = await supabase
      .from('player_stats')
      .update({
        total_matches: 0,
        total_wins: 0,
        total_losses: 0,
        win_percentage: 0,
        current_streak: 0,
        longest_win_streak: 0,
        spa_points_earned: 0,
        tournaments_played: 0,
        tournaments_won: 0,
        updated_at: new Date().toISOString(),
      })
      .neq('user_id', '00000000-0000-0000-0000-000000000000'); // Add WHERE clause

    // Reset wallets (if the table exists and has balance column)
    const { error: walletError } = await supabase
      .from('wallets')
      .update({
        points_balance: 0,
        total_earned: 0,
        total_spent: 0,
        updated_at: new Date().toISOString(),
      })
      .neq('user_id', '00000000-0000-0000-0000-000000000000'); // Add WHERE clause

    // Reset ELO history
    const { error: eloHistoryError } = await supabase
      .from('elo_history')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000');

    // Reset SPA points log (if table exists)
    let spaLogError = null;
    try {
      const { error } = await supabase
        .from('spa_points_log')
        .delete()
        .neq('user_id', '00000000-0000-0000-0000-000000000000');
      spaLogError = error;
    } catch (e) {
      console.log('spa_points_log table not found, skipping...');
      spaLogError = null;
    }

    // Reset daily challenge stats
    const { error: dailyStatsError } = await supabase
      .from('daily_challenge_stats')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000');

    // Reset match results
    const { error: matchResultsError } = await supabase
      .from('match_results')
      .delete()
      .neq('player_id', '00000000-0000-0000-0000-000000000000');

    // Reset favorite opponents
    const { error: favOpponentsError } = await supabase
      .from('favorite_opponents')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000');

    // Reset player trust scores
    const { error: trustScoreError } = await supabase
      .from('player_trust_scores')
      .update({
        trust_score: 0,
        trust_percentage: 0,
        rating_count: 0,
        last_calculated: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .neq('user_id', '00000000-0000-0000-0000-000000000000');

    console.log('Soft reset completed');

    return {
      ranking_reset: !rankingError,
      stats_reset: !statsError,
      wallet_reset: !walletError,
      elo_history_reset: !eloHistoryError,
      spa_log_reset: !spaLogError,
      daily_stats_reset: !dailyStatsError,
      match_results_reset: !matchResultsError,
      favorite_opponents_reset: !favOpponentsError,
      trust_scores_reset: !trustScoreError,
      errors: [
        rankingError,
        statsError,
        walletError,
        eloHistoryError,
        spaLogError,
        dailyStatsError,
        matchResultsError,
        favOpponentsError,
        trustScoreError,
      ].filter(Boolean),
    };
  } catch (error) {
    console.error('Soft reset error:', error);
    return {
      ranking_reset: false,
      stats_reset: false,
      wallet_reset: false,
      errors: [{ message: error.message, code: 'GENERAL_ERROR' }],
    };
  }
}

async function performHardReset(supabase: any) {
  console.log('Performing hard reset - clearing most data');

  // Delete match history
  const { error: matchError } = await supabase
    .from('matches')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  // Delete challenges
  const { error: challengeError } = await supabase
    .from('challenges')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  // Delete tournaments
  const { error: tournamentError } = await supabase
    .from('tournaments')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  // Delete ELO history
  const { error: eloError } = await supabase
    .from('elo_history')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  // Reset user stats (same as soft reset)
  const softResults = await performSoftReset(supabase);

  return {
    ...softResults,
    matches_deleted: !matchError,
    challenges_deleted: !challengeError,
    tournaments_deleted: !tournamentError,
    elo_history_deleted: !eloError,
    errors: [matchError, challengeError, tournamentError, eloError].filter(
      Boolean
    ),
  };
}

async function performDemoCleanup(supabase: any) {
  console.log('Performing demo cleanup - removing demo users and test data');

  // Delete demo user profiles
  const { error: demoError } = await supabase
    .from('profiles')
    .delete()
    .eq('is_demo_user', true);

  // Delete test tournaments
  const { error: testTournamentError } = await supabase
    .from('tournaments')
    .delete()
    .ilike('name', '%test%');

  return {
    demo_users_deleted: !demoError,
    test_tournaments_deleted: !testTournamentError,
    errors: [demoError, testTournamentError].filter(Boolean),
  };
}

async function performClubReset(supabase: any) {
  console.log('Performing club reset - resetting club data');

  // Reset club registrations
  const { error: regError } = await supabase
    .from('club_registrations')
    .update({
      status: 'draft',
      payment_status: 'pending',
      approval_date: null,
      reviewed_by: null,
    })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Add WHERE clause

  // Reset club profiles
  const { error: profileError } = await supabase
    .from('club_profiles')
    .update({
      verification_status: 'pending',
      priority_score: 0,
    })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Add WHERE clause

  return {
    club_registrations_reset: !regError,
    club_profiles_reset: !profileError,
    errors: [regError, profileError].filter(Boolean),
  };
}

async function performStatsReset(supabase: any) {
  console.log('Performing stats-only reset');

  return await performSoftReset(supabase);
}
