-- Fix emergency_complete_tournament_match function to use correct column names
CREATE OR REPLACE FUNCTION public.emergency_complete_tournament_match(
  p_match_id uuid, 
  p_player1_score integer, 
  p_player2_score integer, 
  p_club_owner_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_winner_id UUID;
  v_tournament RECORD;
BEGIN
  -- Get match details
  SELECT * INTO v_match
  FROM tournament_matches
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Get tournament details
  SELECT * INTO v_tournament
  FROM tournaments
  WHERE id = v_match.tournament_id;
  
  -- Verify club owner permissions
  IF NOT EXISTS (
    SELECT 1 FROM club_profiles cp
    WHERE cp.id = v_tournament.club_id AND cp.user_id = p_club_owner_id
  ) THEN
    RETURN jsonb_build_object('error', 'Only club owners can emergency complete matches');
  END IF;
  
  -- Determine winner
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
  ELSIF p_player2_score > p_player1_score THEN
    v_winner_id := v_match.player2_id;
  ELSE
    RETURN jsonb_build_object('error', 'Scores cannot be tied');
  END IF;
  
  -- Update match with correct column names (score_player1, score_player2)
  UPDATE tournament_matches
  SET 
    score_player1 = p_player1_score,
    score_player2 = p_player2_score,
    winner_id = v_winner_id,
    status = 'completed',
    score_status = 'confirmed',
    score_confirmed_by = p_club_owner_id,
    score_confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- Log the emergency action
  INSERT INTO automation_performance_log (
    automation_type, tournament_id, success, metadata
  ) VALUES (
    'emergency_match_completion', 
    v_match.tournament_id, 
    true, 
    jsonb_build_object(
      'match_id', p_match_id,
      'completed_by', p_club_owner_id,
      'scores', jsonb_build_object('player1', p_player1_score, 'player2', p_player2_score)
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'winner_id', v_winner_id,
    'message', 'Match completed successfully via emergency function'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;