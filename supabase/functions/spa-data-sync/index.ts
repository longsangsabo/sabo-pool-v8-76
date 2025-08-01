import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if this is a manual trigger or scheduled job
    const { type = 'manual' } = await req.json().catch(() => ({}));

    console.log(`Starting SPA data sync - Type: ${type}`);

    // Run the comprehensive data consistency check
    const { data: syncResult, error: syncError } = await supabaseClient.rpc(
      'ensure_spa_data_consistency'
    );

    if (syncError) {
      console.error('Sync error:', syncError);
      throw syncError;
    }

    // Get current data health status
    const { data: healthData, error: healthError } = await supabaseClient.rpc(
      'check_spa_data_health'
    );

    if (healthError) {
      console.error('Health check error:', healthError);
      // Don't throw, just log
    }

    // Log sync operation for audit
    const { error: logError } = await supabaseClient
      .from('automation_performance_log')
      .insert({
        automation_type: 'spa_data_sync',
        success: true,
        metadata: {
          type,
          health_status: healthData || 'unknown',
          timestamp: new Date().toISOString(),
        },
      });

    if (logError) {
      console.error('Log error:', logError);
    }

    const response = {
      success: true,
      message: 'SPA data sync completed successfully',
      type,
      health_status: healthData,
      timestamp: new Date().toISOString(),
    };

    console.log('Sync completed:', response);

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('SPA sync error:', error);

    // Log failed operation
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabaseClient.from('automation_performance_log').insert({
        automation_type: 'spa_data_sync',
        success: false,
        error_message: error.message,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
        timestamp: new Date().toISOString(),
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
