import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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

    const { tournament_id, sync_all } = await req.json();

    console.log('🎯 Sync tournament rewards request:', {
      tournament_id,
      sync_all,
    });

    let result;

    if (sync_all) {
      // Sync all completed tournaments
      const { data, error } = await supabase.rpc(
        'sync_all_completed_tournament_rewards'
      );

      if (error) {
        console.error('❌ Error syncing all tournaments:', error);
        throw error;
      }

      result = data;
      console.log('✅ Synced all tournaments:', result);
    } else if (tournament_id) {
      // Sync specific tournament
      const { data, error } = await supabase.rpc(
        'sync_tournament_rewards_from_tiers',
        {
          p_tournament_id: tournament_id,
        }
      );

      if (error) {
        console.error('❌ Error syncing tournament:', tournament_id, error);
        throw error;
      }

      result = data;
      console.log('✅ Synced tournament:', tournament_id, result);
    } else {
      throw new Error('Either tournament_id or sync_all must be provided');
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        message: sync_all
          ? 'All tournaments synced successfully'
          : 'Tournament synced successfully',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('❌ Sync tournament rewards error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
