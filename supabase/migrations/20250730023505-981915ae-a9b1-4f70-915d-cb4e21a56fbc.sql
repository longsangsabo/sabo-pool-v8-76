-- Drop existing function first
DROP FUNCTION IF EXISTS public.submit_sabo_match_score(uuid,integer,integer,uuid);

-- Create updated function with auto-start capability
CREATE OR REPLACE FUNCTION public.submit_sabo_match_score(
  p_match_id uuid,
  p_player1_score integer,
  p_player2_score integer,
  p_submitted_by uuid
)
RETURNS TABLE(success boolean, message text, winner_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match record;
  v_winner_id uuid;
  v_tournament_id uuid;
BEGIN
  -- Get match details
  SELECT * INTO v_match 
  FROM tournament_matches 
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Match not found', null::uuid;
    RETURN;
  END IF;
  
  -- ✅ UPDATED: Accept both 'scheduled' and 'in_progress' status
  IF v_match.status NOT IN ('scheduled', 'in_progress') THEN
    RETURN QUERY SELECT false, 
      format('Match not ready for score submission. Status: %s. Expected: scheduled or in_progress', v_match.status), 
      null::uuid;
    RETURN;
  END IF;
  
  -- ✅ AUTO-START: Transition scheduled → in_progress
  IF v_match.status = 'scheduled' THEN
    UPDATE tournament_matches 
    SET 
      status = 'in_progress',
      updated_at = NOW()
    WHERE id = p_match_id;
  END IF;
  
  -- Validate scores
  IF p_player1_score < 0 OR p_player2_score < 0 THEN
    RETURN QUERY SELECT false, 'Scores cannot be negative', null::uuid;
    RETURN;
  END IF;
  
  IF p_player1_score = p_player2_score THEN
    RETURN QUERY SELECT false, 'Matches cannot end in a tie', null::uuid;
    RETURN;
  END IF;
  
  -- Determine winner
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
  ELSE
    v_winner_id := v_match.player2_id;
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
  
  -- Get tournament ID for advancement
  v_tournament_id := v_match.tournament_id;
  
  -- Auto-advance to next round using existing SABO logic
  PERFORM advance_double_elimination_v9_fixed(v_tournament_id);
  
  RETURN QUERY SELECT true, 'Score submitted successfully', v_winner_id;
END;
$$;