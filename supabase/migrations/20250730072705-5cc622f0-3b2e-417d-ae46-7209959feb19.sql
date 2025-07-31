-- PHASE 2 & 3: COMPREHENSIVE FUNCTION UPDATE
-- Update ALL advancement functions to use double1_advancement_rules table

-- 1. Enhanced advance_sabo_tournament_fixed (improved version)
CREATE OR REPLACE FUNCTION public.advance_sabo_tournament_fixed(
  p_tournament_id UUID,
  p_completed_match_id UUID DEFAULT NULL,
  p_winner_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_result JSONB;
  v_completed_match RECORD;
  v_winner_id UUID;
  v_loser_id UUID;
  v_advancement_rule RECORD;
  v_target_match RECORD;
  v_total_advanced INTEGER := 0;
  v_log TEXT := '';
BEGIN
  -- If specific match provided, advance that match
  IF p_completed_match_id IS NOT NULL THEN
    -- Get match details
    SELECT * INTO v_completed_match
    FROM tournament_matches 
    WHERE id = p_completed_match_id AND tournament_id = p_tournament_id;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object('error', 'Match not found');
    END IF;
    
    -- Determine winner and loser
    v_winner_id := COALESCE(p_winner_id, v_completed_match.winner_id);
    v_loser_id := CASE 
      WHEN v_winner_id = v_completed_match.player1_id THEN v_completed_match.player2_id
      ELSE v_completed_match.player1_id
    END;
    
    -- ✅ PROCESS WINNER ADVANCEMENT USING RULES TABLE
    FOR v_advancement_rule IN 
      SELECT * FROM double1_advancement_rules
      WHERE from_bracket = v_completed_match.bracket_type
      AND from_round = v_completed_match.round_number  
      AND from_match = v_completed_match.match_number
      AND player_role = 'winner'
    LOOP
      -- Find target match
      SELECT * INTO v_target_match
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
      AND bracket_type = v_advancement_rule.to_bracket
      AND round_number = v_advancement_rule.to_round
      AND match_number = v_advancement_rule.to_match;
      
      IF FOUND THEN
        -- Place winner in correct position (prevent duplicates)
        IF v_advancement_rule.to_position = 'player1' AND v_target_match.player1_id IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = v_winner_id, status = 'scheduled', updated_at = NOW()
          WHERE id = v_target_match.id;
          v_total_advanced := v_total_advanced + 1;
          v_log := v_log || format('W:%s->R%sM%sP1 ', v_winner_id, v_advancement_rule.to_round, v_advancement_rule.to_match);
        ELSIF v_advancement_rule.to_position = 'player2' AND v_target_match.player2_id IS NULL THEN
          UPDATE tournament_matches 
          SET player2_id = v_winner_id, status = 'scheduled', updated_at = NOW()
          WHERE id = v_target_match.id;
          v_total_advanced := v_total_advanced + 1;
          v_log := v_log || format('W:%s->R%sM%sP2 ', v_winner_id, v_advancement_rule.to_round, v_advancement_rule.to_match);
        END IF;
      END IF;
    END LOOP;
    
    -- ✅ PROCESS LOSER ADVANCEMENT USING RULES TABLE
    FOR v_advancement_rule IN
      SELECT * FROM double1_advancement_rules
      WHERE from_bracket = v_completed_match.bracket_type
      AND from_round = v_completed_match.round_number
      AND from_match = v_completed_match.match_number  
      AND player_role = 'loser'
    LOOP
      -- Find target match
      SELECT * INTO v_target_match
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
      AND bracket_type = v_advancement_rule.to_bracket
      AND round_number = v_advancement_rule.to_round
      AND match_number = v_advancement_rule.to_match;
      
      IF FOUND THEN
        -- Place loser in correct position (prevent duplicates)
        IF v_advancement_rule.to_position = 'player1' AND v_target_match.player1_id IS NULL THEN
          UPDATE tournament_matches
          SET player1_id = v_loser_id, status = 'scheduled', updated_at = NOW()
          WHERE id = v_target_match.id;
          v_total_advanced := v_total_advanced + 1;
          v_log := v_log || format('L:%s->R%sM%sP1 ', v_loser_id, v_advancement_rule.to_round, v_advancement_rule.to_match);
        ELSIF v_advancement_rule.to_position = 'player2' AND v_target_match.player2_id IS NULL THEN
          UPDATE tournament_matches
          SET player2_id = v_loser_id, status = 'scheduled', updated_at = NOW()
          WHERE id = v_target_match.id;
          v_total_advanced := v_total_advanced + 1;
          v_log := v_log || format('L:%s->R%sM%sP2 ', v_loser_id, v_advancement_rule.to_round, v_advancement_rule.to_match);
        END IF;
      END IF;
    END LOOP;
  ELSE
    -- Auto-advance all completed matches that haven't been processed
    FOR v_completed_match IN
      SELECT * FROM tournament_matches
      WHERE tournament_id = p_tournament_id
      AND status = 'completed'
      AND winner_id IS NOT NULL
      ORDER BY round_number, match_number
    LOOP
      -- Check if advancement rules exist for this match
      IF EXISTS (
        SELECT 1 FROM double1_advancement_rules dar
        WHERE dar.from_bracket = v_completed_match.bracket_type
        AND dar.from_round = v_completed_match.round_number
        AND dar.from_match = v_completed_match.match_number
      ) THEN
        -- Process this match advancement recursively
        SELECT advance_sabo_tournament_fixed(p_tournament_id, v_completed_match.id, v_completed_match.winner_id) INTO v_result;
        IF v_result ? 'total_advanced' THEN
          v_total_advanced := v_total_advanced + COALESCE((v_result->>'total_advanced')::INTEGER, 0);
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'total_advanced', v_total_advanced,
    'advancement_log', v_log,
    'message', format('Advanced %s players using double1_advancement_rules table', v_total_advanced)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournament_id', p_tournament_id
    );
END;
$function$;

-- 2. Update advance_tournament_like_double1 to use rules table
CREATE OR REPLACE FUNCTION public.advance_tournament_like_double1(
  p_tournament_id uuid,
  p_completed_match_id uuid,
  p_winner_id uuid
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- ✅ REDIRECT TO THE MAIN FUNCTION THAT USES RULES TABLE
  RETURN advance_sabo_tournament_fixed(p_tournament_id, p_completed_match_id, p_winner_id);
END;
$function$;

-- 3. Update advance_simplified_double_elimination to use rules table
CREATE OR REPLACE FUNCTION public.advance_simplified_double_elimination(
  p_match_id uuid
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_match RECORD;
  v_result JSONB;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;
  
  -- ✅ USE THE RULES-BASED ADVANCEMENT FUNCTION
  SELECT advance_sabo_tournament_fixed(v_match.tournament_id, p_match_id, v_match.winner_id) INTO v_result;
  
  RETURN v_result;
END;
$function$;

-- 4. Create universal submit_match_score that uses rules table
CREATE OR REPLACE FUNCTION public.submit_match_score(
  p_match_id uuid,
  p_player1_score integer,
  p_player2_score integer,
  p_submitted_by uuid DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_match RECORD;
  v_winner_id UUID;
  v_advancement_result JSONB;
  v_tournament RECORD;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF v_match IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;
  
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = v_match.tournament_id;
  
  -- Check permissions (player, admin, or club owner)
  IF p_submitted_by NOT IN (v_match.player1_id, v_match.player2_id) THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = p_submitted_by 
      AND (is_admin = true OR role = 'club_owner')
    ) THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Only match participants, admins, or club owners can submit scores'
      );
    END IF;
  END IF;
  
  -- Auto-start match if scheduled
  IF v_match.status = 'scheduled' THEN
    UPDATE tournament_matches 
    SET status = 'in_progress', updated_at = NOW()
    WHERE id = p_match_id;
  END IF;
  
  -- Determine winner based on scores
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
  ELSIF p_player2_score > p_player1_score THEN
    v_winner_id := v_match.player2_id;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Scores cannot be tied');
  END IF;
  
  -- Update match with scores and winner
  UPDATE tournament_matches 
  SET 
    score_player1 = p_player1_score,
    score_player2 = p_player2_score,
    winner_id = v_winner_id,
    status = 'completed',
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- ✅ USE RULES-BASED ADVANCEMENT
  SELECT advance_sabo_tournament_fixed(
    v_match.tournament_id,
    p_match_id,
    v_winner_id
  ) INTO v_advancement_result;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', format('Score submitted using rules-based advancement: %s', v_advancement_result->>'message'),
    'winner_id', v_winner_id,
    'match_id', p_match_id,
    'player1_score', p_player1_score,
    'player2_score', p_player2_score,
    'advancement_result', v_advancement_result
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Score submission failed: %s', SQLERRM)
    );
END;
$function$;