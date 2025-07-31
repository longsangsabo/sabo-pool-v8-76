-- Phase 1: Emergency tournament completion function for club owners
CREATE OR REPLACE FUNCTION public.emergency_complete_tournament_match(
  p_match_id uuid,
  p_player1_score integer,
  p_player2_score integer,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_tournament RECORD;
  v_winner_id uuid;
  v_admin_user RECORD;
  v_result jsonb;
BEGIN
  -- Get current user info
  SELECT * INTO v_admin_user FROM public.profiles WHERE user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;
  
  -- Check if user is admin or club owner
  IF NOT (v_admin_user.is_admin = true OR v_admin_user.role = 'admin' OR EXISTS(
    SELECT 1 FROM public.club_profiles WHERE user_id = auth.uid()
  )) THEN
    RETURN jsonb_build_object('error', 'Unauthorized: Only admins or club owners can use emergency completion');
  END IF;
  
  -- Get match details
  SELECT * INTO v_match FROM public.tournament_matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Get tournament details
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = v_match.tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Determine winner
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
  ELSIF p_player2_score > p_player1_score THEN
    v_winner_id := v_match.player2_id;
  ELSE
    RETURN jsonb_build_object('error', 'Scores cannot be tied');
  END IF;
  
  -- Update match with emergency completion
  UPDATE public.tournament_matches
  SET 
    player1_score = p_player1_score,
    player2_score = p_player2_score,
    winner_id = v_winner_id,
    status = 'completed',
    completed_at = now(),
    updated_at = now(),
    admin_notes = COALESCE(p_admin_notes, 'Emergency completion by ' || COALESCE(v_admin_user.display_name, v_admin_user.full_name))
  WHERE id = p_match_id;
  
  -- Log the emergency action
  INSERT INTO public.admin_actions (
    admin_id,
    action_type,
    target_user_id,
    action_details,
    reason
  ) VALUES (
    auth.uid(),
    'emergency_match_completion',
    v_winner_id,
    jsonb_build_object(
      'match_id', p_match_id,
      'tournament_id', v_match.tournament_id,
      'player1_score', p_player1_score,
      'player2_score', p_player2_score,
      'winner_id', v_winner_id,
      'tournament_name', v_tournament.name
    ),
    COALESCE(p_admin_notes, 'Emergency match completion to unblock tournament')
  );
  
  -- Try to advance tournament (if function exists)
  BEGIN
    SELECT public.advance_double_elimination_winner(p_match_id, v_winner_id) INTO v_result;
  EXCEPTION
    WHEN OTHERS THEN
      -- If advance function fails, continue anyway
      v_result := jsonb_build_object('warning', 'Match completed but auto-advancement failed: ' || SQLERRM);
  END;
  
  -- Check if tournament should be completed
  IF NOT EXISTS (
    SELECT 1 FROM public.tournament_matches 
    WHERE tournament_id = v_match.tournament_id 
    AND status IN ('scheduled', 'in_progress')
  ) THEN
    -- All matches completed, mark tournament as completed
    UPDATE public.tournaments
    SET status = 'completed', updated_at = now()
    WHERE id = v_match.tournament_id;
    
    v_result := jsonb_build_object(
      'success', true,
      'message', 'Match completed and tournament finished!',
      'tournament_completed', true,
      'match_id', p_match_id,
      'winner_id', v_winner_id,
      'advancement_result', v_result
    );
  ELSE
    v_result := jsonb_build_object(
      'success', true,
      'message', 'Match completed successfully',
      'match_id', p_match_id,
      'winner_id', v_winner_id,
      'advancement_result', v_result
    );
  END IF;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Emergency completion failed: ' || SQLERRM,
      'details', SQLSTATE
    );
END;
$$;

-- Grant execute permission to authenticated users (will be checked by function logic)
GRANT EXECUTE ON FUNCTION public.emergency_complete_tournament_match(uuid, integer, integer, text) TO authenticated;

-- Phase 2: Fix tournament_matches RLS policies to work with emergency function
DROP POLICY IF EXISTS "Allow all operations on tournament matches" ON public.tournament_matches;

-- Create more specific policies
CREATE POLICY "Users can view tournament matches" 
ON public.tournament_matches 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Club owners and admins can update tournament matches" 
ON public.tournament_matches 
FOR UPDATE 
TO authenticated 
USING (
  -- Admin users
  (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND (is_admin = true OR role = 'admin')))
  OR
  -- Club owners for matches in tournaments at their club
  (EXISTS (
    SELECT 1 FROM public.tournaments t
    JOIN public.club_profiles cp ON t.club_id = cp.id
    WHERE t.id = tournament_matches.tournament_id AND cp.user_id = auth.uid()
  ))
  OR
  -- Players in the match
  (auth.uid() = player1_id OR auth.uid() = player2_id)
);

CREATE POLICY "System can insert tournament matches" 
ON public.tournament_matches 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Phase 3: Add tournament completion detection trigger
CREATE OR REPLACE FUNCTION public.check_tournament_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament_id uuid;
  v_pending_matches integer;
BEGIN
  -- Get tournament ID from the updated match
  v_tournament_id := COALESCE(NEW.tournament_id, OLD.tournament_id);
  
  -- Only check when a match is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Count remaining non-completed matches
    SELECT COUNT(*) INTO v_pending_matches
    FROM public.tournament_matches
    WHERE tournament_id = v_tournament_id
    AND status IN ('scheduled', 'in_progress');
    
    -- If no pending matches, mark tournament as completed
    IF v_pending_matches = 0 THEN
      UPDATE public.tournaments
      SET status = 'completed', updated_at = now()
      WHERE id = v_tournament_id AND status != 'completed';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic tournament completion
DROP TRIGGER IF EXISTS trigger_check_tournament_completion ON public.tournament_matches;
CREATE TRIGGER trigger_check_tournament_completion
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.check_tournament_completion();