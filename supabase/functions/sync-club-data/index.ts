import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    if (!profile?.is_admin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      // Manual sync trigger
      console.log('Starting manual club data sync...');

      const { data: syncResult, error } = await supabase.rpc(
        'manual_sync_club_data'
      );

      if (error) {
        console.error('Sync failed:', error);
        return new Response(
          JSON.stringify({ error: 'Sync failed', details: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.log('Sync completed:', syncResult);

      // Log the sync operation
      await supabase.from('automation_performance_log').insert({
        automation_type: 'club_data_sync',
        success: true,
        metadata: syncResult,
        execution_time_ms: Date.now(),
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Club data sync completed',
          result: syncResult,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      // Get sync status and statistics
      const { data: clubProfilesCount } = await supabase
        .from('club_profiles')
        .select('id', { count: 'exact', head: true });

      const { data: clubsCount } = await supabase
        .from('clubs')
        .select('id', { count: 'exact', head: true });

      const { data: lastSync } = await supabase
        .from('automation_performance_log')
        .select('created_at, metadata, success')
        .eq('automation_type', 'club_data_sync')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Check for inconsistencies
      const { data: inconsistencies } = await supabase
        .from('club_profiles')
        .select(
          `
          id,
          club_name,
          verification_status,
          clubs!inner(id, name, verified)
        `
        )
        .neq('club_name', 'clubs.name');

      return new Response(
        JSON.stringify({
          status: {
            club_profiles_count: clubProfilesCount?.length || 0,
            clubs_count: clubsCount?.length || 0,
            last_sync: lastSync?.created_at || null,
            last_sync_success: lastSync?.success || false,
            inconsistencies_count: inconsistencies?.length || 0,
            inconsistencies: inconsistencies || [],
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
