-- Fix get_double_elimination_status function to use correct column names
CREATE OR REPLACE FUNCTION public.get_double_elimination_status(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_result JSONB;
  v_winners_bracket JSONB;
  v_losers_bracket JSONB;
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
  ) INTO v_winners_bracket
  FROM tournament_matches tm
  WHERE tm.tournament_id = p_tournament_id
    AND tm.bracket_type = 'winners'
    AND tm.round_number = 1;
  
  -- Losers Bracket - Branch A (rounds 1,3,5,7)
  WITH losers_branch_a AS (
    SELECT tm.*
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND tm.bracket_type = 'losers'
      AND tm.loser_branch = 'A'
    ORDER BY tm.round_number, tm.match_number
  )
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
    )
  ) INTO v_losers_bracket
  FROM losers_branch_a tm;
  
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
  
  -- Build complete result
  v_result := jsonb_build_object(
    'tournament_id', p_tournament_id,
    'tournament_name', v_tournament.name,
    'tournament_status', v_tournament.status,
    'winners_bracket', jsonb_build_object(
      'round_1', COALESCE(v_winners_bracket, '[]'::jsonb)
    ),
    'losers_bracket', jsonb_build_object(
      'branch_a', COALESCE(v_losers_bracket, '[]'::jsonb),
      'branch_b', '[]'::jsonb
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