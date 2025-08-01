import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface ScoreUpdateRequest {
  challengeId: string;
  challengerScore: number;
  opponentScore: number;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { challengeId, challengerScore, opponentScore }: ScoreUpdateRequest =
      await req.json();

    console.log('Processing score update:', {
      challengeId,
      challengerScore,
      opponentScore,
      userId: user.id,
    });

    // Validate input
    if (
      !challengeId ||
      challengerScore === undefined ||
      opponentScore === undefined
    ) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (challengerScore < 0 || opponentScore < 0) {
      return new Response(
        JSON.stringify({ error: 'Scores must be non-negative' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Call the database function to process challenge completion
    const { data: result, error: processError } = await supabase.rpc(
      'process_challenge_completion',
      {
        p_challenge_id: challengeId,
        p_challenger_score: challengerScore,
        p_opponent_score: opponentScore,
        p_submitter_id: user.id,
      }
    );

    if (processError) {
      console.error('Process challenge completion error:', processError);
      return new Response(
        JSON.stringify({ error: 'Failed to process challenge completion' }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (result.error) {
      console.error('Challenge completion failed:', result.error);
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    console.log('Challenge completed successfully:', result);

    // Create notification for both players
    const { data: challenge } = await supabase
      .from('challenges')
      .select('challenger_id, opponent_id')
      .eq('id', challengeId)
      .single();

    if (challenge) {
      const winnerId = result.winner_id;
      const loserId =
        winnerId === challenge.challenger_id
          ? challenge.opponent_id
          : challenge.challenger_id;

      // Notify winner
      await supabase.from('notifications').insert({
        user_id: winnerId,
        title: '🎉 Bạn đã thắng thách đấu!',
        message: `Chúc mừng! Bạn đã thắng và nhận được ${result.points_awarded} SPA điểm.`,
        type: 'success',
        metadata: { challengeId, pointsAwarded: result.points_awarded },
      });

      // Notify loser
      await supabase.from('notifications').insert({
        user_id: loserId,
        title: '😔 Thách đấu đã kết thúc',
        message:
          'Rất tiếc! Bạn đã thua trong thách đấu này. Hãy cố gắng hơn lần sau!',
        type: 'info',
        metadata: { challengeId },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        result: result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Challenge score update error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
