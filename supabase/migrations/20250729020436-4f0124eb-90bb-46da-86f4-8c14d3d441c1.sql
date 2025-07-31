-- Fix submit_double_elimination_score function to use correct column names
CREATE OR REPLACE FUNCTION public.submit_double_elimination_score(
  p_match_id uuid,
  p_player1_score integer,
  p_player2_score integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_match RECORD;
  v_winner_id UUID;
  v_tournament_id UUID;
  v_result JSONB;
BEGIN
  -- Get match details using correct column names
  SELECT 
    id, tournament_id, player1_id, player2_id, status, round_number, match_number
  INTO v_match
  FROM tournament_matches 
  WHERE id = p_match_id;
  
  IF v_match IS NULL THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  IF v_match.status = 'completed' THEN
    RETURN jsonb_build_object('error', 'Match already completed');
  END IF;
  
  -- Determine winner
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
  ELSIF p_player2_score > p_player1_score THEN
    v_winner_id := v_match.player2_id;
  ELSE
    RETURN jsonb_build_object('error', 'Scores cannot be tied');
  END IF;
  
  v_tournament_id := v_match.tournament_id;
  
  -- Update match with scores and winner using correct column names
  UPDATE tournament_matches 
  SET 
    score_player1 = p_player1_score,
    score_player2 = p_player2_score,
    winner_id = v_winner_id,
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- Call advancement function
  SELECT public.advance_double_elimination_winner_comprehensive(p_match_id) INTO v_result;
  
  -- Return success with advancement result
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_id', v_winner_id,
    'player1_score', p_player1_score,
    'player2_score', p_player2_score,
    'advancement_result', v_result,
    'completed_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Failed to submit score: %s', SQLERRM),
      'match_id', p_match_id
    );
END;
$function$;

-- Complete get_double_elimination_status function to include all rounds
CREATE OR REPLACE FUNCTION public.get_double_elimination_status(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_result JSONB;
  v_winners_round1 JSONB;
  v_winners_round2 JSONB;
  v_winners_round3 JSONB;
  v_losers_branch_a JSONB;
  v_losers_branch_b JSONB;
  v_semifinal_matches JSONB;
  v_final_match JSONB;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF v_tournament IS NULL THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Winners Bracket - Round 1 (8 matches)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', tm.id,
      'match_number', tm.match_number,
      'round_number', tm.round_number,
      'player1_id', tm.player1_id,
      'player2_id', tm.player2_id,
      'score_player1', tm.score_player1,
      'score_player2', tm.score_player2,
      'winner_id', tm.winner_id,
      'status', tm.status,
      'round_position', tm.round_position,
      'match_stage', tm.match_stage,
      'bracket_type', tm.bracket_type
    ) ORDER BY tm.match_number
  ) INTO v_winners_round1
  FROM tournament_matches tm
  WHERE tm.tournament_id = p_tournament_id
    AND tm.bracket_type = 'winners'
    AND tm.round_number = 1;
  
  -- Winners Bracket - Round 2 (4 matches)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', tm.id,
      'match_number', tm.match_number,
      'round_number', tm.round_number,
      'player1_id', tm.player1_id,
      'player2_id', tm.player2_id,
      'score_player1', tm.score_player1,
      'score_player2', tm.score_player2,
      'winner_id', tm.winner_id,
      'status', tm.status,
      'round_position', tm.round_position,
      'match_stage', tm.match_stage,
      'bracket_type', tm.bracket_type
    ) ORDER BY tm.match_number
  ) INTO v_winners_round2
  FROM tournament_matches tm
  WHERE tm.tournament_id = p_tournament_id
    AND tm.bracket_type = 'winners'
    AND tm.round_number = 2;
  
  -- Winners Bracket - Round 3 (2 matches)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', tm.id,
      'match_number', tm.match_number,
      'round_number', tm.round_number,
      'player1_id', tm.player1_id,
      'player2_id', tm.player2_id,
      'score_player1', tm.score_player1,
      'score_player2', tm.score_player2,
      'winner_id', tm.winner_id,
      'status', tm.status,
      'round_position', tm.round_position,
      'match_stage', tm.match_stage,
      'bracket_type', tm.bracket_type
    ) ORDER BY tm.match_number
  ) INTO v_winners_round3
  FROM tournament_matches tm
  WHERE tm.tournament_id = p_tournament_id
    AND tm.bracket_type = 'winners'
    AND tm.round_number = 3;
  
  -- Losers Bracket - Branch A
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', tm.id,
      'match_number', tm.match_number,
      'round_number', tm.round_number,
      'player1_id', tm.player1_id,
      'player2_id', tm.player2_id,
      'score_player1', tm.score_player1,
      'score_player2', tm.score_player2,
      'winner_id', tm.winner_id,
      'status', tm.status,
      'round_position', tm.round_position,
      'match_stage', tm.match_stage,
      'bracket_type', tm.bracket_type,
      'loser_branch', tm.loser_branch
    ) ORDER BY tm.round_number, tm.match_number
  ) INTO v_losers_branch_a
  FROM tournament_matches tm
  WHERE tm.tournament_id = p_tournament_id
    AND tm.bracket_type = 'losers'
    AND tm.loser_branch = 'A';
  
  -- Losers Bracket - Branch B
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', tm.id,
      'match_number', tm.match_number,
      'round_number', tm.round_number,
      'player1_id', tm.player1_id,
      'player2_id', tm.player2_id,
      'score_player1', tm.score_player1,
      'score_player2', tm.score_player2,
      'winner_id', tm.winner_id,
      'status', tm.status,
      'round_position', tm.round_position,
      'match_stage', tm.match_stage,
      'bracket_type', tm.bracket_type,
      'loser_branch', tm.loser_branch
    ) ORDER BY tm.round_number, tm.match_number
  ) INTO v_losers_branch_b
  FROM tournament_matches tm
  WHERE tm.tournament_id = p_tournament_id
    AND tm.bracket_type = 'losers'
    AND tm.loser_branch = 'B';
  
  -- Semifinal matches
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', tm.id,
      'match_number', tm.match_number,
      'round_number', tm.round_number,
      'player1_id', tm.player1_id,
      'player2_id', tm.player2_id,
      'score_player1', tm.score_player1,
      'score_player2', tm.score_player2,
      'winner_id', tm.winner_id,
      'status', tm.status,
      'round_position', tm.round_position,
      'match_stage', tm.match_stage,
      'bracket_type', tm.bracket_type
    ) ORDER BY tm.match_number
  ) INTO v_semifinal_matches
  FROM tournament_matches tm
  WHERE tm.tournament_id = p_tournament_id
    AND tm.match_stage = 'semifinal';
  
  -- Final match
  SELECT jsonb_build_object(
    'id', tm.id,
    'match_number', tm.match_number,
    'round_number', tm.round_number,
    'player1_id', tm.player1_id,
    'player2_id', tm.player2_id,
    'score_player1', tm.score_player1,
    'score_player2', tm.score_player2,
    'winner_id', tm.winner_id,
    'status', tm.status,
    'round_position', tm.round_position,
    'match_stage', tm.match_stage,
    'bracket_type', tm.bracket_type
  ) INTO v_final_match
  FROM tournament_matches tm
  WHERE tm.tournament_id = p_tournament_id
    AND tm.match_stage = 'final'
  LIMIT 1;
  
  -- Build complete result with all rounds
  v_result := jsonb_build_object(
    'tournament_id', p_tournament_id,
    'tournament_name', v_tournament.name,
    'tournament_status', v_tournament.status,
    'winners_bracket', jsonb_build_object(
      'round_1', COALESCE(v_winners_round1, '[]'::jsonb),
      'round_2', COALESCE(v_winners_round2, '[]'::jsonb),
      'round_3', COALESCE(v_winners_round3, '[]'::jsonb)
    ),
    'losers_bracket', jsonb_build_object(
      'branch_a', COALESCE(v_losers_branch_a, '[]'::jsonb),
      'branch_b', COALESCE(v_losers_branch_b, '[]'::jsonb)
    ),
    'semifinal_matches', COALESCE(v_semifinal_matches, '[]'::jsonb),
    'final_match', v_final_match,
    'updated_at', NOW()
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Failed to get tournament status: %s', SQLERRM),
      'tournament_id', p_tournament_id
    );
END;
$function$;