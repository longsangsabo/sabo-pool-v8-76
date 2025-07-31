
-- BƯỚC 1: Xóa tất cả các phiên bản cũ của double elimination functions
DROP FUNCTION IF EXISTS public.submit_double_elimination_score(uuid, integer, integer, uuid);
DROP FUNCTION IF EXISTS public.submit_double_elimination_score(uuid, uuid, integer, integer);
DROP FUNCTION IF EXISTS public.advance_double_elimination_winner(uuid, uuid);
DROP FUNCTION IF EXISTS public.advance_double_elimination_winner(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.generate_double_elimination_bracket_complete(uuid);
DROP FUNCTION IF EXISTS public.validate_double_elimination_assignments(uuid);
DROP FUNCTION IF EXISTS public.get_double_elimination_status(uuid);

-- BƯỚC 2: Tạo function submission score mới với logic rõ ràng
CREATE OR REPLACE FUNCTION public.submit_double_elimination_score(
  p_match_id UUID,
  p_player1_score INTEGER,
  p_player2_score INTEGER,
  p_submitted_by UUID DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_winner_id UUID;
  v_loser_id UUID;
  v_tournament RECORD;
  v_advancement_result JSONB;
BEGIN
  -- Get match details with validation
  SELECT * INTO v_match
  FROM tournament_matches
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;
  
  -- Validate scores
  IF p_player1_score < 0 OR p_player2_score < 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Scores cannot be negative');
  END IF;
  
  IF p_player1_score = p_player2_score THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ties not allowed in elimination tournaments');
  END IF;
  
  -- Validate match players exist and are different
  IF v_match.player1_id IS NULL OR v_match.player2_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match players not properly assigned');
  END IF;
  
  IF v_match.player1_id = v_match.player2_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot have same player twice in a match');
  END IF;
  
  -- Get tournament info
  SELECT * INTO v_tournament
  FROM tournaments
  WHERE id = v_match.tournament_id;
  
  -- Determine winner and loser
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
    v_loser_id := v_match.player2_id;
  ELSE
    v_winner_id := v_match.player2_id;
    v_loser_id := v_match.player1_id;
  END IF;
  
  -- Update match with scores
  UPDATE tournament_matches
  SET 
    score_player1 = p_player1_score,
    score_player2 = p_player2_score,
    winner_id = v_winner_id,
    status = 'completed',
    score_status = 'confirmed',
    score_confirmed_by = p_submitted_by,
    score_confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- Advance winner using new double elimination logic
  SELECT advance_double_elimination_winner(p_match_id, v_winner_id, v_loser_id) INTO v_advancement_result;
  
  RETURN jsonb_build_object(
    'success', true,
    'winner_id', v_winner_id,
    'loser_id', v_loser_id,
    'advancement', v_advancement_result,
    'message', 'Score submitted and players advanced successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to submit score: ' || SQLERRM
    );
END;
$$;

-- BƯỚC 3: Tạo function advancement logic mới
CREATE OR REPLACE FUNCTION public.advance_double_elimination_winner(
  p_match_id UUID,
  p_winner_id UUID,
  p_loser_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_tournament RECORD;
  v_next_match_id UUID;
  v_loser_bracket_match_id UUID;
  v_advancement_info JSONB := jsonb_build_object();
BEGIN
  -- Get match details
  SELECT * INTO v_match
  FROM tournament_matches
  WHERE id = p_match_id;
  
  -- Get tournament details  
  SELECT * INTO v_tournament
  FROM tournaments
  WHERE id = v_match.tournament_id;
  
  -- Handle different bracket types
  IF v_match.bracket_type = 'winner' THEN
    -- WINNER BRACKET LOGIC
    -- Find next winner bracket match
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'winner'
      AND round_number = v_match.round_number + 1
      AND match_number = CEIL(v_match.match_number::numeric / 2)
      AND (player1_id IS NULL OR player2_id IS NULL)
    LIMIT 1;
    
    -- Advance winner to next winner bracket round
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = p_winner_id, updated_at = NOW()
        WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = p_winner_id, updated_at = NOW()
        WHERE id = v_next_match_id;
      END IF;
      
      v_advancement_info := v_advancement_info || jsonb_build_object(
        'winner_advanced_to', 'winner_bracket',
        'next_match_id', v_next_match_id
      );
    END IF;
    
    -- Move loser to appropriate loser bracket slot
    SELECT id INTO v_loser_bracket_match_id
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'loser'
      AND (player1_id IS NULL OR player2_id IS NULL)
      AND round_number = CASE 
        WHEN v_match.round_number = 1 THEN 1  -- Round 1 losers go to LB Round 1
        ELSE v_match.round_number  -- Later round losers go to corresponding LB round
      END
    ORDER BY match_number
    LIMIT 1;
    
    IF v_loser_bracket_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_loser_bracket_match_id) IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = p_loser_id, updated_at = NOW()
        WHERE id = v_loser_bracket_match_id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = p_loser_id, updated_at = NOW()
        WHERE id = v_loser_bracket_match_id;
      END IF;
      
      v_advancement_info := v_advancement_info || jsonb_build_object(
        'loser_advanced_to', 'loser_bracket',
        'loser_match_id', v_loser_bracket_match_id
      );
    END IF;
    
  ELSIF v_match.bracket_type = 'loser' THEN
    -- LOSER BRACKET LOGIC
    -- Find next loser bracket match
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'loser'
      AND round_number = v_match.round_number + 1
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    -- If no next loser bracket match, check for grand final
    IF v_next_match_id IS NULL THEN
      SELECT id INTO v_next_match_id
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'grand_final'
        AND (player1_id IS NULL OR player2_id IS NULL)
      LIMIT 1;
    END IF;
    
    -- Advance winner
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = p_winner_id, updated_at = NOW()
        WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = p_winner_id, updated_at = NOW()
        WHERE id = v_next_match_id;
      END IF;
      
      v_advancement_info := v_advancement_info || jsonb_build_object(
        'winner_advanced_to', CASE 
          WHEN (SELECT bracket_type FROM tournament_matches WHERE id = v_next_match_id) = 'grand_final' 
          THEN 'grand_final'
          ELSE 'loser_bracket'
        END,
        'next_match_id', v_next_match_id
      );
    END IF;
    
    -- Loser is eliminated
    v_advancement_info := v_advancement_info || jsonb_build_object(
      'loser_status', 'eliminated'
    );
    
  ELSIF v_match.bracket_type = 'grand_final' THEN
    -- GRAND FINAL LOGIC - Tournament Complete
    UPDATE tournaments
    SET status = 'completed', completed_at = NOW(), updated_at = NOW()
    WHERE id = v_match.tournament_id;
    
    v_advancement_info := jsonb_build_object(
      'tournament_complete', true,
      'champion_id', p_winner_id,
      'runner_up_id', p_loser_id
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'advancement_info', v_advancement_info
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to advance players: ' || SQLERRM
    );
END;
$$;

-- BƯỚC 4: Fix duplicate player assignments
UPDATE tournament_matches 
SET player1_id = NULL, player2_id = NULL, status = 'pending', updated_at = NOW()
WHERE tournament_id IN (
  SELECT DISTINCT tournament_id 
  FROM tournament_matches 
  WHERE player1_id = player2_id 
    AND player1_id IS NOT NULL
)
AND round_number > 1;

-- BƯỚC 5: Reset problematic matches back to proper state
UPDATE tournament_matches
SET 
  status = 'pending',
  player1_id = NULL,
  player2_id = NULL,
  winner_id = NULL,
  score_player1 = NULL,
  score_player2 = NULL,
  updated_at = NOW()
WHERE tournament_id IN (
  SELECT tournament_id 
  FROM tournament_matches 
  GROUP BY tournament_id 
  HAVING COUNT(CASE WHEN player1_id = player2_id THEN 1 END) > 0
)
AND bracket_type IN ('winner', 'loser', 'grand_final')
AND round_number > 1;
