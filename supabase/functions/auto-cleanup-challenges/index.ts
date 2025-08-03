// Edge function to automatically cleanup expired challenges
// This can be called periodically or by a cron job

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting automatic challenge cleanup...');

    // Call the cleanup function
    const { data: result, error } = await supabase.rpc(
      'cleanup_expired_challenges'
    );

    if (error) {
      console.error('Cleanup error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to cleanup challenges' }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`Cleanup completed. Expired challenges: ${result}`);

    return new Response(
      JSON.stringify({
        success: true,
        expired_challenges: result,
        cleanup_time: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
