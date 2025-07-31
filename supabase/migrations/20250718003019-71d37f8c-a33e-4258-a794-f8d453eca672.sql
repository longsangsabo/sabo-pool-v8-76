-- Drop and recreate the emergency function with enhanced debugging and full schema references
DROP FUNCTION IF EXISTS public.emergency_complete_tournament_match(uuid, integer, integer, uuid, text);

-- Create improved emergency_complete_tournament_match function with full schema references
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
AS $$
DECLARE
  v_match RECORD;
  v_winner_id UUID;
  v_tournament RECORD;
  v_current_user_id UUID;
  v_is_admin BOOLEAN := false;
  v_is_club_owner BOOLEAN := false;
  v_debug_info jsonb;
BEGIN
  -- Get current user
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Authentication required');
  END IF;
  
  -- Debug: Check if table exists and is accessible
  BEGIN
    PERFORM 1 FROM public.tournament_matches LIMIT 1;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'error', 'Cannot access tournament_matches table',
        'sql_error', SQLERRM,
        'sql_state', SQLSTATE
      );
  END;
  
  -- Get match details with full schema reference
  SELECT * INTO v_match
  FROM public.tournament_matches
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found with ID: ' || p_match_id);
  END IF;
  
  -- Get tournament details with full schema reference
  SELECT * INTO v_tournament
  FROM public.tournaments
  WHERE id = v_match.tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found for match');
  END IF;
  
  -- Check if user is admin with full schema reference
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = v_current_user_id AND is_admin = true
  ) INTO v_is_admin;
  
  -- Check if user is club owner with full schema reference
  IF p_club_owner_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.club_profiles cp
      WHERE cp.id = v_tournament.club_id AND cp.user_id = p_club_owner_id
    ) INTO v_is_club_owner;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM public.club_profiles cp
      WHERE cp.id = v_tournament.club_id AND cp.user_id = v_current_user_id
    ) INTO v_is_club_owner;
  END IF;
  
  -- Create debug info
  v_debug_info := jsonb_build_object(
    'current_user', v_current_user_id,
    'is_admin', v_is_admin,
    'is_club_owner', v_is_club_owner,
    'match_id', p_match_id,
    'tournament_id', v_match.tournament_id,
    'club_id', v_tournament.club_id
  );
  
  -- Verify permissions (admin or club owner)
  IF NOT (v_is_admin OR v_is_club_owner) THEN
    RETURN jsonb_build_object(
      'error', 'Only admins or club owners can emergency complete matches',
      'debug', v_debug_info
    );
  END IF;
  
  -- Determine winner
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
  ELSIF p_player2_score > p_player1_score THEN
    v_winner_id := v_match.player2_id;
  ELSE
    RETURN jsonb_build_object('error', 'Scores cannot be tied');
  END IF;
  
  -- Update match with full schema reference and correct column names
  UPDATE public.tournament_matches
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
  
  -- Check if update was successful
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'error', 'Failed to update match - no rows affected',
      'debug', v_debug_info
    );
  END IF;
  
  -- Log the emergency action with full schema reference
  INSERT INTO public.automation_performance_log (
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
      'completed_by_club_owner', v_is_club_owner,
      'debug_info', v_debug_info
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'winner_id', v_winner_id,
    'message', 'Match completed successfully via emergency function',
    'debug', v_debug_info
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sql_state', SQLSTATE,
      'debug', v_debug_info
    );
END;
$$;