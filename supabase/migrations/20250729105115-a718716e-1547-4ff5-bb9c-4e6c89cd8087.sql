-- Fix submit_double_elimination_score_v9 function by consolidating DECLARE blocks
CREATE OR REPLACE FUNCTION public.submit_double_elimination_score_v9(
  p_match_id UUID,
  p_player1_score INTEGER,
  p_player2_score INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_match RECORD;
  v_tournament RECORD;
  v_winner_id UUID;
  v_loser_id UUID;
  v_advancement_result JSONB;
  v_is_final_match BOOLEAN := FALSE;
  v_max_round INTEGER;
  v_final_matches_count INTEGER;
  v_completed_final_matches INTEGER;
BEGIN
  -- Get match details with tournament info
  SELECT tm.*, t.status as tournament_status, t.name as tournament_name
  INTO v_match
  FROM tournament_matches tm
  JOIN tournaments t ON tm.tournament_id = t.id
  WHERE tm.id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;
  
  -- Validate match can be scored
  IF v_match.status = 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match already completed');
  END IF;
  
  IF v_match.player1_id IS NULL OR v_match.player2_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match players not set');
  END IF;
  
  -- Prevent ties
  IF p_player1_score = p_player2_score THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ties are not allowed');
  END IF;
  
  -- Determine winner and loser
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
    v_loser_id := v_match.player2_id;
  ELSE
    v_winner_id := v_match.player2_id;
    v_loser_id := v_match.player1_id;
  END IF;
  
  -- Update match with scores and winner
  UPDATE tournament_matches
  SET 
    player1_score = p_player1_score,
    player2_score = p_player2_score,
    winner_id = v_winner_id,
    status = 'completed',
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- Check if this is a final match for tournament completion
  SELECT MAX(round_number) INTO v_max_round
  FROM tournament_matches 
  WHERE tournament_id = v_match.tournament_id;
  
  -- Count final matches (round 300 or highest round)
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_final_matches_count, v_completed_final_matches
  FROM tournament_matches 
  WHERE tournament_id = v_match.tournament_id 
  AND round_number = v_max_round
  AND bracket_type != 'losers'
  AND NOT COALESCE(is_third_place_match, false);
  
  v_is_final_match := (v_match.round_number = v_max_round AND 
                      v_match.bracket_type != 'losers' AND 
                      NOT COALESCE(v_match.is_third_place_match, false));
  
  -- Advance winner automatically
  SELECT public.advance_double_elimination_v9(v_match.tournament_id, p_match_id, v_winner_id)
  INTO v_advancement_result;
  
  -- Check for tournament completion if this was a final match
  IF v_is_final_match AND v_completed_final_matches = v_final_matches_count THEN
    UPDATE tournaments
    SET status = 'completed', completed_at = NOW(), updated_at = NOW()
    WHERE id = v_match.tournament_id AND status != 'completed';
    
    -- Process tournament completion (awards, etc.)
    PERFORM public.process_tournament_completion(v_match.tournament_id);
    
    RAISE NOTICE 'Tournament % completed with champion %', v_match.tournament_id, v_winner_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_id', v_winner_id,
    'advancement_result', v_advancement_result,
    'tournament_completed', v_is_final_match AND v_completed_final_matches = v_final_matches_count
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$function$;