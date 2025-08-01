import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface MatchUpdateRequest {
  challengeId: string;
  challengerScore: number;
  opponentScore: number;
  playerId: string;
  addRackResult?: boolean;
}

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

    const {
      challengeId,
      challengerScore,
      opponentScore,
      playerId,
      addRackResult = false,
    }: MatchUpdateRequest = await req.json();

    console.log('SABO Match Update Request:', {
      challengeId,
      challengerScore,
      opponentScore,
      playerId,
    });

    // Verify player is involved in the challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('sabo_challenges')
      .select('*')
      .eq('id', challengeId)
      .in('status', ['accepted', 'in_progress'])
      .single();

    if (challengeError || !challenge) {
      console.error('Challenge not found:', challengeError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Challenge not found or not active',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    // Verify player is involved
    if (
      challenge.challenger_id !== playerId &&
      challenge.opponent_id !== playerId
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Player not involved in this challenge',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      );
    }

    // Use the simulation function to update scores
    const { data: updateResult, error: updateError } = await supabase.rpc(
      'simulate_sabo_match_progress',
      {
        p_challenge_id: challengeId,
        p_challenger_score: challengerScore,
        p_opponent_score: opponentScore,
        p_add_rack_result: addRackResult,
      }
    );

    if (updateError) {
      console.error('Error updating match:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    console.log('Match update result:', updateResult);

    // Get updated challenge data
    const { data: updatedChallenge, error: fetchError } = await supabase
      .from('sabo_challenges')
      .select(
        `
        id,
        challenger_id,
        opponent_id,
        stake_amount,
        race_to,
        status,
        challenger_score,
        opponent_score,
        winner_id,
        rack_history
      `
      )
      .eq('id', challengeId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated challenge:', fetchError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        challenge: updatedChallenge,
        message: 'Match updated successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('SABO Match Update Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
