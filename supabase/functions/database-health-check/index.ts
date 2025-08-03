import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check all essential tables exist
    const tableChecks = await Promise.allSettled([
      supabase.from('ranks').select('count', { count: 'exact', head: true }),
      supabase.from('wallets').select('count', { count: 'exact', head: true }),
      supabase
        .from('spa_points_log')
        .select('count', { count: 'exact', head: true }),
      supabase
        .from('spa_reward_milestones')
        .select('count', { count: 'exact', head: true }),
      supabase
        .from('rank_requests')
        .select('count', { count: 'exact', head: true }),
      supabase
        .from('rank_verifications')
        .select('count', { count: 'exact', head: true }),
      supabase
        .from('test_schedules')
        .select('count', { count: 'exact', head: true }),
      supabase
        .from('rank_test_results')
        .select('count', { count: 'exact', head: true }),
      supabase
        .from('tournament_automation_log')
        .select('count', { count: 'exact', head: true }),
      supabase
        .from('user_chat_sessions')
        .select('count', { count: 'exact', head: true }),
      supabase.from('profiles').select('count', { count: 'exact', head: true }),
      supabase
        .from('club_profiles')
        .select('count', { count: 'exact', head: true }),
      supabase
        .from('tournaments')
        .select('count', { count: 'exact', head: true }),
      supabase
        .from('player_rankings')
        .select('count', { count: 'exact', head: true }),
    ]);

    const tableNames = [
      'ranks',
      'wallets',
      'spa_points_log',
      'spa_reward_milestones',
      'rank_requests',
      'rank_verifications',
      'test_schedules',
      'rank_test_results',
      'tournament_automation_log',
      'user_chat_sessions',
      'profiles',
      'club_profiles',
      'tournaments',
      'player_rankings',
    ];

    const tableStatus = tableChecks.map((result, index) => ({
      table: tableNames[index],
      exists: result.status === 'fulfilled',
      count: result.status === 'fulfilled' ? result.value.count : 0,
      error: result.status === 'rejected' ? result.reason?.message : null,
    }));

    // Check available functions
    const { data: functions, error: functionsError } = await supabase
      .rpc('pg_catalog.pg_get_functiondef', { func_oid: 0 })
      .then(() =>
        supabase
          .from('information_schema.routines')
          .select('routine_name, routine_type')
          .eq('routine_schema', 'public')
          .like('routine_name', '%tournament%')
      );

    // Check active policies
    const { data: policies, error: policiesError } = await supabase
      .from('information_schema.table_privileges')
      .select('table_name, privilege_type')
      .eq('table_schema', 'public')
      .in('table_name', tableNames);

    const healthReport = {
      timestamp: new Date().toISOString(),
      database_status: 'healthy',
      tables: tableStatus,
      functions_available: functions || [],
      policies_count: policies?.length || 0,
      missing_tables: tableStatus.filter(t => !t.exists).map(t => t.table),
      total_users: tableStatus.find(t => t.table === 'profiles')?.count || 0,
      total_clubs:
        tableStatus.find(t => t.table === 'club_profiles')?.count || 0,
      total_tournaments:
        tableStatus.find(t => t.table === 'tournaments')?.count || 0,
      summary: {
        all_tables_exist: tableStatus.every(t => t.exists),
        critical_missing: tableStatus.filter(
          t =>
            !t.exists &&
            ['profiles', 'rank_requests', 'wallets'].includes(t.table)
        ),
        database_ready: tableStatus
          .filter(t =>
            [
              'rank_requests',
              'rank_verifications',
              'wallets',
              'spa_points_log',
            ].includes(t.table)
          )
          .every(t => t.exists),
      },
    };

    return new Response(JSON.stringify(healthReport, null, 2), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Database health check failed:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'failed',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
