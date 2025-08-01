import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      tournament_id,
      seeding_method = 'registration_order',
      generation_type,
    } = await req.json();

    if (!tournament_id) {
      return new Response(
        JSON.stringify({ error: 'Tournament ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🏗️ Generating tournament bracket for:', tournament_id);

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*, tournament_type, max_participants')
      .eq('id', tournament_id)
      .single();

    if (tournamentError || !tournament) {
      console.error('❌ Tournament not found:', tournamentError);
      return new Response(JSON.stringify({ error: 'Tournament not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get confirmed participants
    const { data: registrations, error: regError } = await supabase
      .from('tournament_registrations')
      .select(
        `
        user_id,
        profiles!tournament_registrations_user_id_fkey(
          user_id, full_name, display_name, elo
        )
      `
      )
      .eq('tournament_id', tournament_id)
      .eq('registration_status', 'confirmed')
      .order('created_at', { ascending: true });

    if (regError) {
      console.error('❌ Error fetching registrations:', regError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch participants' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!registrations || registrations.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No confirmed participants found' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate bracket based on tournament type
    let bracketResult;

    if (tournament.tournament_type === 'double_elimination') {
      bracketResult = await generateDoubleEliminationBracket(
        supabase,
        tournament_id,
        registrations
      );
    } else {
      bracketResult = await generateSingleEliminationBracket(
        supabase,
        tournament_id,
        registrations
      );
    }

    if (!bracketResult.success) {
      return new Response(JSON.stringify({ error: bracketResult.error }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Tournament bracket generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        tournament_id,
        tournament_type: tournament.tournament_type,
        participants_count: registrations.length,
        matches_created: bracketResult.matches_created,
        message: 'Tournament bracket generated successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error generating tournament bracket:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate tournament bracket',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function generateDoubleEliminationBracket(
  supabase: any,
  tournamentId: string,
  participants: any[]
) {
  try {
    console.log(
      '🏆 Generating double elimination bracket for',
      participants.length,
      'participants'
    );

    // Validate participant count (must be power of 2, minimum 4)
    if (
      participants.length < 4 ||
      (participants.length & (participants.length - 1)) !== 0
    ) {
      return {
        success: false,
        error: `Double elimination bracket requires a power of 2 participants (4, 8, 16, etc.), found ${participants.length}`,
      };
    }

    // Sort participants by ELO for seeding
    const seededParticipants = participants.sort((a, b) => {
      const eloA = a.profiles?.elo || 1000;
      const eloB = b.profiles?.elo || 1000;
      return eloB - eloA; // Higher ELO first
    });

    // Extract user IDs for the new v6 function
    const participantIds = seededParticipants.map(p => p.user_id);

    console.log(
      '🔥 Using new v6 double elimination generator with participants:',
      participantIds.length
    );

    // Use the SABO tournament bracket generation function
    const { data: bracketResult, error: bracketError } = await supabase.rpc(
      'generate_sabo_tournament_bracket',
      {
        p_tournament_id: tournamentId,
        p_seeding_method: 'elo_ranking',
      }
    );

    if (bracketError) {
      console.error('❌ Bracket generation error:', bracketError);
      return {
        success: false,
        error: bracketError.message || 'Failed to generate bracket',
      };
    }

    if (!bracketResult || !bracketResult.success) {
      console.error(
        '❌ Bracket function returned error:',
        bracketResult?.error || 'Unknown error'
      );
      return {
        success: false,
        error:
          bracketResult?.error ||
          'Bracket generation failed - function returned no data',
      };
    }

    console.log('✅ Double elimination bracket generated:', bracketResult);

    // Update tournament status
    await supabase
      .from('tournaments')
      .update({
        status: 'registration_closed',
      })
      .eq('id', tournamentId);

    return {
      success: true,
      matches_created:
        bracketResult.matches_created || bracketResult.total_matches || 0,
    };
  } catch (error) {
    console.error('❌ Error in generateDoubleEliminationBracket:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function generateSingleEliminationBracket(
  supabase: any,
  tournamentId: string,
  participants: any[]
) {
  try {
    console.log(
      '🏆 Generating single elimination bracket for',
      participants.length,
      'participants'
    );

    // Clear existing matches
    await supabase
      .from('tournament_matches')
      .delete()
      .eq('tournament_id', tournamentId);

    // Calculate rounds needed
    const totalRounds = Math.ceil(Math.log2(participants.length));
    const matches = [];

    // Sort participants by ELO for seeding
    const seededParticipants = participants.sort((a, b) => {
      const eloA = a.profiles?.elo || 1000;
      const eloB = b.profiles?.elo || 1000;
      return eloB - eloA;
    });

    let matchNumber = 1;

    // Generate first round matches
    const firstRoundMatches = Math.floor(participants.length / 2);
    for (let i = 0; i < firstRoundMatches; i++) {
      matches.push({
        tournament_id: tournamentId,
        match_number: matchNumber++,
        round_number: 1,
        player1_id: seededParticipants[i * 2].user_id,
        player2_id: seededParticipants[i * 2 + 1].user_id,
        status: 'scheduled',
        bracket_type: 'main',
      });
    }

    // Generate subsequent rounds (TBD players)
    for (let round = 2; round <= totalRounds; round++) {
      const matchesInRound = Math.ceil(
        participants.length / Math.pow(2, round)
      );

      for (let i = 0; i < matchesInRound; i++) {
        matches.push({
          tournament_id: tournamentId,
          match_number: matchNumber++,
          round_number: round,
          player1_id: null,
          player2_id: null,
          status: 'pending',
          bracket_type: 'main',
        });
      }
    }

    // Insert matches
    const { error: insertError } = await supabase
      .from('tournament_matches')
      .insert(matches);

    if (insertError) {
      console.error('❌ Error inserting matches:', insertError);
      return {
        success: false,
        error: 'Failed to create tournament matches',
      };
    }

    // Update tournament status
    await supabase
      .from('tournaments')
      .update({ status: 'registration_closed' })
      .eq('id', tournamentId);

    return {
      success: true,
      matches_created: matches.length,
    };
  } catch (error) {
    console.error('❌ Error in generateSingleEliminationBracket:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
