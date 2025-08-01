import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface TournamentSyncRequest {
  tournament_id: string;
  action: 'generate_bracket' | 'update_matches' | 'sync_all';
}

Deno.serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { tournament_id, action = 'sync_all' }: TournamentSyncRequest =
      await req.json();

    console.log(
      `🔄 Tournament Data Sync - Action: ${action}, Tournament: ${tournament_id}`
    );

    if (!tournament_id) {
      throw new Error('Tournament ID is required');
    }

    let result: any = { success: false };

    switch (action) {
      case 'generate_bracket':
        result = await generateTournamentBracket(supabase, tournament_id);
        break;

      case 'update_matches':
        result = await updateTournamentMatches(supabase, tournament_id);
        break;

      case 'sync_all':
        result = await syncAllTournamentData(supabase, tournament_id);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Log automation performance
    await logAutomationPerformance(
      supabase,
      tournament_id,
      action,
      true,
      result
    );

    console.log(`✅ Tournament sync completed:`, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('❌ Tournament sync error:', error);

    // Log failed automation
    await logAutomationPerformance(supabase, null, 'sync_error', false, {
      error: error.message,
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function generateTournamentBracket(supabase: any, tournament_id: string) {
  console.log(`🏆 Generating bracket for tournament: ${tournament_id}`);

  // Check if bracket generation is possible
  const { data: canGenerate, error: checkError } = await supabase.rpc(
    'can_generate_bracket',
    { p_tournament_id: tournament_id }
  );

  if (checkError) {
    throw new Error(
      `Failed to check bracket generation: ${checkError.message}`
    );
  }

  if (!canGenerate.valid) {
    throw new Error(`Cannot generate bracket: ${canGenerate.reason}`);
  }

  // Generate bracket using v8 function for double elimination
  const { data: bracketData, error: bracketError } = await supabase.rpc(
    'generate_double_elimination_bracket_complete_v8',
    {
      p_tournament_id: tournament_id,
      p_participant_count: canGenerate.participant_count,
    }
  );

  if (bracketError) {
    throw new Error(`Failed to generate bracket: ${bracketError.message}`);
  }

  // Update tournament status to indicate bracket is generated
  const { error: updateError } = await supabase
    .from('tournaments')
    .update({
      bracket_generated: true,
      status: 'upcoming',
      updated_at: new Date().toISOString(),
    })
    .eq('id', tournament_id);

  if (updateError) {
    console.error('Failed to update tournament status:', updateError);
  }

  return {
    success: true,
    action: 'generate_bracket',
    tournament_id,
    bracket_data: bracketData,
    participant_count: canGenerate.participant_count,
  };
}

async function updateTournamentMatches(supabase: any, tournament_id: string) {
  console.log(`⚽ Updating matches for tournament: ${tournament_id}`);

  // Get tournament matches that need updates
  const { data: matches, error: matchesError } = await supabase
    .from('tournament_matches')
    .select(
      `
      id, round_number, match_number, status,
      player1_id, player2_id, winner_id,
      bracket_type, is_third_place_match
    `
    )
    .eq('tournament_id', tournament_id)
    .order('round_number', { ascending: true })
    .order('match_number', { ascending: true });

  if (matchesError) {
    throw new Error(`Failed to fetch matches: ${matchesError.message}`);
  }

  let updated_matches = 0;
  let advanced_players = 0;

  // ============= CHAMPIONSHIP FINAL ADVANCEMENT =============
  // Championship Final receives:
  // 1. Winner's Bracket Final winner (highest round in winners bracket)
  // 2. Loser's Bracket Semifinal winner (Round 250)

  // First: Check for Loser's Bracket Semifinal completion (Round 250)
  const loserSemifinalMatches = matches.filter(
    m => m.round_number === 250 && m.status === 'completed' && m.winner_id
  );

  console.log(
    `🎯 Found ${loserSemifinalMatches.length} completed Loser's Bracket Semifinal matches`
  );

  // Also check for Winner's Bracket Final completion
  const maxWinnerRound = Math.max(
    ...matches
      .filter(m => m.bracket_type === 'winners')
      .map(m => m.round_number)
  );
  const winnerFinalMatches = matches.filter(
    m =>
      m.round_number === maxWinnerRound &&
      m.bracket_type === 'winners' &&
      m.status === 'completed' &&
      m.winner_id
  );

  console.log(
    `🎯 Found ${winnerFinalMatches.length} completed Winner's Bracket Final matches (Round ${maxWinnerRound})`
  );

  // If both winners are available, advance to Championship Final
  if (loserSemifinalMatches.length >= 1 && winnerFinalMatches.length >= 1) {
    const loserBracketWinner = loserSemifinalMatches[0].winner_id;
    const winnerBracketWinner = winnerFinalMatches[0].winner_id;

    console.log(
      `🏆 Both finalists ready: WB Winner ${winnerBracketWinner}, LB Winner ${loserBracketWinner}`
    );

    const { data: finalMatch, error: finalError } = await supabase
      .from('tournament_matches')
      .select('id, player1_id, player2_id')
      .eq('tournament_id', tournament_id)
      .eq('round_number', 300)
      .eq('match_number', 1)
      .single();

    if (
      !finalError &&
      finalMatch &&
      (!finalMatch.player1_id || !finalMatch.player2_id)
    ) {
      const { error: advanceError } = await supabase
        .from('tournament_matches')
        .update({
          player1_id: winnerBracketWinner, // Winner's Bracket winner gets priority slot
          player2_id: loserBracketWinner, // Loser's Bracket winner
          status: 'scheduled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', finalMatch.id);

      if (!advanceError) {
        advanced_players += 2;
        console.log(
          `✅ Advanced to Championship Final: WB Winner ${winnerBracketWinner} vs LB Winner ${loserBracketWinner}`
        );
      } else {
        console.error(
          `❌ Failed to advance to Championship Final:`,
          advanceError
        );
      }
    } else {
      console.log(
        `ℹ️ Championship Final already populated or error:`,
        finalError
      );
    }
  } else if (loserSemifinalMatches.length >= 1) {
    // Only loser bracket semifinal completed - wait for winner bracket final
    console.log(
      `⏳ Loser's Bracket Semifinal complete, waiting for Winner's Bracket Final`
    );
  } else if (winnerFinalMatches.length >= 1) {
    // Only winner bracket final completed - wait for loser bracket semifinal
    console.log(
      `⏳ Winner's Bracket Final complete, waiting for Loser's Bracket Semifinal`
    );
  }

  // ============= CRITICAL: LOSER'S BRANCH A LOGIC =============
  // Branch A ONLY receives losers from Winner's Bracket Round 1 (round 100)
  // This is the DEFINITIVE source of truth for Branch A placement

  // Step 1: Clear any incorrectly placed players in Branch A (cleanup old tournaments)
  const { error: clearError } = await supabase
    .from('tournament_matches')
    .update({
      player1_id: null,
      player2_id: null,
      winner_id: null,
      status: 'scheduled',
      updated_at: new Date().toISOString(),
    })
    .eq('tournament_id', tournament_id)
    .eq('match_stage', 'losers_branch_a')
    .neq('round_number', 101); // Don't clear Round 1 where WB R1 losers should be

  // Step 2: Process Winner's Bracket Round 1 completed matches - send losers to Branch A
  const wbRound1Matches = matches.filter(
    m =>
      m.round_number === 1 &&
      m.bracket_type === 'winners' &&
      m.status === 'completed' &&
      m.winner_id
  );

  console.log(
    `🎯 Processing ${wbRound1Matches.length} completed WB R1 matches for Branch A placement`
  );

  // Track which WB R1 losers have been placed to avoid duplicates
  const placedLosers = new Set();

  for (const wbMatch of wbRound1Matches) {
    const loser_id =
      wbMatch.player1_id === wbMatch.winner_id
        ? wbMatch.player2_id
        : wbMatch.player1_id;

    if (loser_id && !placedLosers.has(loser_id)) {
      // Check if this loser is already placed in Branch A Round 1
      const { data: existingPlacement } = await supabase
        .from('tournament_matches')
        .select('id')
        .eq('tournament_id', tournament_id)
        .eq('round_number', 101)
        .eq('match_stage', 'losers_branch_a')
        .or(`player1_id.eq.${loser_id},player2_id.eq.${loser_id}`)
        .limit(1)
        .single();

      if (!existingPlacement) {
        // Find appropriate Branch A Round 1 match to place loser
        const { data: branchAMatch, error: branchAError } = await supabase
          .from('tournament_matches')
          .select('id, player1_id, player2_id, match_number')
          .eq('tournament_id', tournament_id)
          .eq('round_number', 101)
          .eq('match_stage', 'losers_branch_a')
          .or('player1_id.is.null,player2_id.is.null')
          .order('match_number', { ascending: true })
          .limit(1)
          .single();

        if (!branchAError && branchAMatch) {
          const player_slot = !branchAMatch.player1_id
            ? 'player1_id'
            : 'player2_id';

          const { error: placeError } = await supabase
            .from('tournament_matches')
            .update({
              [player_slot]: loser_id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', branchAMatch.id);

          if (!placeError) {
            advanced_players++;
            placedLosers.add(loser_id);
            console.log(
              `✅ Placed WB R1 loser ${loser_id} into Branch A Round 1 Match ${branchAMatch.match_number}`
            );
          } else {
            console.error(
              `❌ Failed to place WB R1 loser ${loser_id}:`,
              placeError
            );
          }
        } else {
          console.log(
            `⚠️ No available Branch A Round 1 slots for loser ${loser_id}`
          );
        }
      } else {
        placedLosers.add(loser_id);
        console.log(`ℹ️ WB R1 loser ${loser_id} already placed in Branch A`);
      }
    }
  }

  console.log(
    `✅ Branch A placement complete: ${placedLosers.size} WB R1 losers processed`
  );

  // ============= LOSER'S BRANCH B LOGIC =============
  // Branch B receives:
  // 1. Losers from Winner's Bracket Round 2 → Branch B Round 1 (201)
  // 2. Losers from Winner's Bracket Round 3+ → Branch B Round 2 (202)
  // 3. Winner from Branch A Round 3 → Branch B Round 2 (202)

  // Process Winner's Bracket Round 2 losers → Branch B Round 1
  const wbRound2Matches = matches.filter(
    m =>
      m.round_number === 2 &&
      m.bracket_type === 'winners' &&
      m.status === 'completed' &&
      m.winner_id
  );

  console.log(
    `🎯 Processing ${wbRound2Matches.length} completed WB R2 matches for Branch B R1 placement`
  );

  for (const wbMatch of wbRound2Matches) {
    const loser_id =
      wbMatch.player1_id === wbMatch.winner_id
        ? wbMatch.player2_id
        : wbMatch.player1_id;

    if (loser_id) {
      // Check if this loser is already placed in Branch B Round 1
      const { data: existingPlacement } = await supabase
        .from('tournament_matches')
        .select('id')
        .eq('tournament_id', tournament_id)
        .eq('round_number', 201)
        .eq('match_stage', 'losers_branch_b')
        .or(`player1_id.eq.${loser_id},player2_id.eq.${loser_id}`)
        .limit(1)
        .single();

      if (!existingPlacement) {
        // Find appropriate Branch B Round 1 match to place loser
        const { data: branchBMatch, error: branchBError } = await supabase
          .from('tournament_matches')
          .select('id, player1_id, player2_id, match_number')
          .eq('tournament_id', tournament_id)
          .eq('round_number', 201)
          .eq('match_stage', 'losers_branch_b')
          .or('player1_id.is.null,player2_id.is.null')
          .order('match_number', { ascending: true })
          .limit(1)
          .single();

        if (!branchBError && branchBMatch) {
          const player_slot = !branchBMatch.player1_id
            ? 'player1_id'
            : 'player2_id';

          const { error: placeError } = await supabase
            .from('tournament_matches')
            .update({
              [player_slot]: loser_id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', branchBMatch.id);

          if (!placeError) {
            advanced_players++;
            console.log(
              `✅ Placed WB R2 loser ${loser_id} into Branch B Round 1 Match ${branchBMatch.match_number}`
            );
          }
        }
      }
    }
  }

  // Process Winner's Bracket Round 3+ losers → Branch B Round 2
  const wbRound3PlusMatches = matches.filter(
    m =>
      m.round_number >= 3 &&
      m.bracket_type === 'winners' &&
      m.status === 'completed' &&
      m.winner_id
  );

  console.log(
    `🎯 Processing ${wbRound3PlusMatches.length} completed WB R3+ matches for Branch B R2 placement`
  );

  for (const wbMatch of wbRound3PlusMatches) {
    const loser_id =
      wbMatch.player1_id === wbMatch.winner_id
        ? wbMatch.player2_id
        : wbMatch.player1_id;

    if (loser_id) {
      // Check if this loser is already placed in Branch B Round 2
      const { data: existingPlacement } = await supabase
        .from('tournament_matches')
        .select('id')
        .eq('tournament_id', tournament_id)
        .eq('round_number', 202)
        .eq('match_stage', 'losers_branch_b')
        .or(`player1_id.eq.${loser_id},player2_id.eq.${loser_id}`)
        .limit(1)
        .single();

      if (!existingPlacement) {
        // Find appropriate Branch B Round 2 match to place loser
        const { data: branchBMatch, error: branchBError } = await supabase
          .from('tournament_matches')
          .select('id, player1_id, player2_id, match_number')
          .eq('tournament_id', tournament_id)
          .eq('round_number', 202)
          .eq('match_stage', 'losers_branch_b')
          .or('player1_id.is.null,player2_id.is.null')
          .order('match_number', { ascending: true })
          .limit(1)
          .single();

        if (!branchBError && branchBMatch) {
          const player_slot = !branchBMatch.player1_id
            ? 'player1_id'
            : 'player2_id';

          const { error: placeError } = await supabase
            .from('tournament_matches')
            .update({
              [player_slot]: loser_id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', branchBMatch.id);

          if (!placeError) {
            advanced_players++;
            console.log(
              `✅ Placed WB R3+ loser ${loser_id} into Branch B Round 2 Match ${branchBMatch.match_number}`
            );
          }
        }
      }
    }
  }

  // Process Branch A Round 3 winner → Branch B Round 2
  const branchAFinalMatches = matches.filter(
    m =>
      m.round_number === 103 &&
      m.match_stage === 'losers_branch_a' &&
      m.status === 'completed' &&
      m.winner_id
  );

  console.log(
    `🎯 Processing ${branchAFinalMatches.length} completed Branch A R3 matches for Branch B R2 placement`
  );

  for (const branchAMatch of branchAFinalMatches) {
    const winner_id = branchAMatch.winner_id;

    if (winner_id) {
      // Check if this winner is already placed in Branch B Round 2
      const { data: existingPlacement } = await supabase
        .from('tournament_matches')
        .select('id')
        .eq('tournament_id', tournament_id)
        .eq('round_number', 202)
        .eq('match_stage', 'losers_branch_b')
        .or(`player1_id.eq.${winner_id},player2_id.eq.${winner_id}`)
        .limit(1)
        .single();

      if (!existingPlacement) {
        // Find appropriate Branch B Round 2 match to place winner
        const { data: branchBMatch, error: branchBError } = await supabase
          .from('tournament_matches')
          .select('id, player1_id, player2_id, match_number')
          .eq('tournament_id', tournament_id)
          .eq('round_number', 202)
          .eq('match_stage', 'losers_branch_b')
          .or('player1_id.is.null,player2_id.is.null')
          .order('match_number', { ascending: true })
          .limit(1)
          .single();

        if (!branchBError && branchBMatch) {
          const player_slot = !branchBMatch.player1_id
            ? 'player1_id'
            : 'player2_id';

          const { error: placeError } = await supabase
            .from('tournament_matches')
            .update({
              [player_slot]: winner_id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', branchBMatch.id);

          if (!placeError) {
            advanced_players++;
            console.log(
              `✅ Placed Branch A R3 winner ${winner_id} into Branch B Round 2 Match ${branchBMatch.match_number}`
            );
          }
        }
      }
    }
  }

  console.log(`✅ Branch B placement complete`);

  // Process other completed matches for standard advancement (excluding WB R1)
  for (const match of matches) {
    if (
      match.status === 'completed' &&
      match.winner_id &&
      match.round_number > 100 &&
      match.round_number < 250
    ) {
      // Standard next round advancement logic for other rounds
      const next_round = match.round_number + 1;
      const next_match_number = Math.ceil(match.match_number / 2);

      const { data: nextMatch, error: nextMatchError } = await supabase
        .from('tournament_matches')
        .select('id, player1_id, player2_id')
        .eq('tournament_id', tournament_id)
        .eq('round_number', next_round)
        .eq('match_number', next_match_number)
        .single();

      if (!nextMatchError && nextMatch) {
        const player_slot =
          match.match_number % 2 === 1 ? 'player1_id' : 'player2_id';

        if (!nextMatch[player_slot]) {
          const { error: advanceError } = await supabase
            .from('tournament_matches')
            .update({
              [player_slot]: match.winner_id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', nextMatch.id);

          if (!advanceError) {
            advanced_players++;
            console.log(
              `✅ Advanced player ${match.winner_id} to round ${next_round}`
            );
          }
        }
      }
      updated_matches++;
    }
  }

  return {
    success: true,
    action: 'update_matches',
    tournament_id,
    total_matches: matches.length,
    updated_matches,
    advanced_players,
  };
}

async function syncAllTournamentData(supabase: any, tournament_id: string) {
  console.log(`🔄 Full sync for tournament: ${tournament_id}`);

  const results = {
    success: true,
    action: 'sync_all',
    tournament_id,
    operations: [],
  };

  try {
    // 1. Check if bracket exists, generate if needed
    const { data: bracketCheck } = await supabase
      .from('tournament_brackets')
      .select('id')
      .eq('tournament_id', tournament_id)
      .single();

    if (!bracketCheck) {
      const bracketResult = await generateTournamentBracket(
        supabase,
        tournament_id
      );
      results.operations.push(bracketResult);
    }

    // 2. Update tournament matches
    const matchesResult = await updateTournamentMatches(
      supabase,
      tournament_id
    );
    results.operations.push(matchesResult);

    // 3. Update tournament status based on current state
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('status, tournament_start, tournament_end')
      .eq('id', tournament_id)
      .single();

    if (tournament && !tournamentError) {
      const now = new Date();
      const startTime = new Date(tournament.tournament_start);
      const endTime = new Date(tournament.tournament_end);

      let newStatus = tournament.status;

      if (
        now >= startTime &&
        now <= endTime &&
        tournament.status !== 'ongoing'
      ) {
        newStatus = 'ongoing';
      } else if (now > endTime && tournament.status !== 'completed') {
        newStatus = 'completed';
      }

      if (newStatus !== tournament.status) {
        await supabase
          .from('tournaments')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tournament_id);

        results.operations.push({
          action: 'status_update',
          old_status: tournament.status,
          new_status: newStatus,
        });
      }
    }
  } catch (error) {
    results.success = false;
    results.error = error.message;
  }

  return results;
}

async function logAutomationPerformance(
  supabase: any,
  tournament_id: string | null,
  automation_type: string,
  success: boolean,
  metadata: any
) {
  try {
    await supabase.from('automation_performance_log').insert({
      automation_type: `tournament_data_sync_${automation_type}`,
      tournament_id,
      success,
      metadata: JSON.stringify(metadata),
      execution_time_ms: metadata.execution_time || 0,
    });
  } catch (error) {
    console.error('Failed to log automation performance:', error);
  }
}
