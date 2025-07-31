-- Drop old function with incorrect column names and create unified function
DROP FUNCTION IF EXISTS public.emergency_complete_tournament_match(uuid, integer, integer, text);

-- Create unified emergency_complete_tournament_match function with correct column names
CREATE OR REPLACE FUNCTION public.emergency_complete_tournament_match(
  p_match_id uuid, 
  p_player1_score integer, 
  p_player2_score integer, 
  p_club_owner_id uuid DEFAULT NULL,
  p_admin_notes text DEFAULT NULL
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
  v_current_user_id UUID;
  v_is_admin BOOLEAN := false;
  v_is_club_owner BOOLEAN := false;
BEGIN
  -- Get current user
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Authentication required');
  END IF;
  
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
  
  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = v_current_user_id AND is_admin = true
  ) INTO v_is_admin;
  
  -- Check if user is club owner (either passed as parameter or current user)
  IF p_club_owner_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM club_profiles cp
      WHERE cp.id = v_tournament.club_id AND cp.user_id = p_club_owner_id
    ) INTO v_is_club_owner;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM club_profiles cp
      WHERE cp.id = v_tournament.club_id AND cp.user_id = v_current_user_id
    ) INTO v_is_club_owner;
  END IF;
  
  -- Verify permissions (admin or club owner)
  IF NOT (v_is_admin OR v_is_club_owner) THEN
    RETURN jsonb_build_object('error', 'Only admins or club owners can emergency complete matches');
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
    score_confirmed_by = COALESCE(p_club_owner_id, v_current_user_id),
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
      'completed_by', COALESCE(p_club_owner_id, v_current_user_id),
      'scores', jsonb_build_object('player1', p_player1_score, 'player2', p_player2_score),
      'admin_notes', p_admin_notes,
      'completed_by_admin', v_is_admin,
      'completed_by_club_owner', v_is_club_owner
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