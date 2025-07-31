-- 🚨 CRITICAL FIX: SABO Tournament Advancement System
-- Fixes duplicate player bug and impossible matches

-- 1. Drop the broken advancement function
DROP FUNCTION IF EXISTS public.advance_double_elimination_v9_fixed(uuid);

-- 2. Create FIXED advancement function with proper logic
CREATE OR REPLACE FUNCTION public.advance_sabo_tournament_fixed(
  p_tournament_id uuid,
  p_completed_match_id uuid,
  p_winner_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_completed_match record;
  v_loser_id uuid;
  v_next_match record;
  v_loser_match record;
BEGIN
  -- Get completed match details
  SELECT * INTO v_completed_match
  FROM tournament_matches
  WHERE id = p_completed_match_id;
  
  IF NOT FOUND THEN
    RAISE WARNING 'Match not found: %', p_completed_match_id;
    RETURN;
  END IF;
  
  -- Determine loser
  IF v_completed_match.player1_id = p_winner_id THEN
    v_loser_id := v_completed_match.player2_id;
  ELSE
    v_loser_id := v_completed_match.player1_id;
  END IF;
  
  RAISE NOTICE 'Processing match R% M%: Winner=%, Loser=%', 
    v_completed_match.round_number, v_completed_match.match_number, p_winner_id, v_loser_id;
  
  -- WINNERS BRACKET ADVANCEMENT
  IF v_completed_match.bracket_type = 'winners' AND v_completed_match.round_number IN (1, 2, 3) THEN
    
    -- Calculate next round and match position
    IF v_completed_match.round_number = 1 THEN
      -- R1 M1,M2 → R2 M1 | R1 M3,M4 → R2 M2 | etc.
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
        AND bracket_type = 'winners'
        AND round_number = 2
        AND match_number = CEIL(v_completed_match.match_number::numeric / 2)
        AND status = 'pending';
        
    ELSIF v_completed_match.round_number = 2 THEN
      -- R2 M1,M2 → R3 M1 | R2 M3,M4 → R3 M2
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
        AND bracket_type = 'winners'
        AND round_number = 3
        AND match_number = CEIL(v_completed_match.match_number::numeric / 2)
        AND status = 'pending';
        
    ELSIF v_completed_match.round_number = 3 THEN
      -- R3 winners go to semifinals
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
        AND bracket_type = 'semifinals'
        AND round_number = 250
        AND match_number = v_completed_match.match_number
        AND status = 'pending';
    END IF;
    
    -- Assign winner to correct position in next match
    IF v_next_match.id IS NOT NULL THEN
      IF v_completed_match.match_number % 2 = 1 THEN
        -- Odd matches go to player1 position
        IF v_next_match.player1_id IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = p_winner_id, 
              status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
              updated_at = NOW()
          WHERE id = v_next_match.id;
          RAISE NOTICE '✅ Advanced winner to R% M% player1', v_next_match.round_number, v_next_match.match_number;
        END IF;
      ELSE
        -- Even matches go to player2 position
        IF v_next_match.player2_id IS NULL THEN
          UPDATE tournament_matches 
          SET player2_id = p_winner_id,
              status = CASE WHEN player1_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
              updated_at = NOW()
          WHERE id = v_next_match.id;
          RAISE NOTICE '✅ Advanced winner to R% M% player2', v_next_match.round_number, v_next_match.match_number;
        END IF;
      END IF;
    END IF;
    
    -- LOSERS BRACKET ROUTING (only for R1 and R2 - R3 losers are eliminated)
    IF v_completed_match.round_number = 1 THEN
      -- R1 losers go to Branch A (Round 101)
      SELECT * INTO v_loser_match
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
        AND bracket_type = 'losers'
        AND round_number = 101
        AND match_number = CEIL(v_completed_match.match_number::numeric / 2)
        AND status = 'pending';
        
    ELSIF v_completed_match.round_number = 2 THEN
      -- R2 losers go to Branch B (Round 201)  
      SELECT * INTO v_loser_match
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
        AND bracket_type = 'losers'
        AND round_number = 201
        AND match_number = v_completed_match.match_number
        AND status = 'pending';
    END IF;
    
    -- Assign loser to losers bracket
    IF v_loser_match.id IS NOT NULL THEN
      IF v_completed_match.match_number % 2 = 1 THEN
        -- Odd matches → player1
        IF v_loser_match.player1_id IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = v_loser_id,
              status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
              updated_at = NOW()
          WHERE id = v_loser_match.id;
          RAISE NOTICE '✅ Moved loser to Losers R% M% player1', v_loser_match.round_number, v_loser_match.match_number;
        END IF;
      ELSE
        -- Even matches → player2
        IF v_loser_match.player2_id IS NULL THEN
          UPDATE tournament_matches 
          SET player2_id = v_loser_id,
              status = CASE WHEN player1_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
              updated_at = NOW()
          WHERE id = v_loser_match.id;
          RAISE NOTICE '✅ Moved loser to Losers R% M% player2', v_loser_match.round_number, v_loser_match.match_number;
        END IF;
      END IF;
    END IF;
    
  END IF;
  
  -- LOSERS BRACKET ADVANCEMENT
  IF v_completed_match.bracket_type = 'losers' THEN
    IF v_completed_match.round_number = 101 THEN
      -- Branch A R1 → Branch A R2
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
        AND bracket_type = 'losers'
        AND round_number = 102
        AND match_number = CEIL(v_completed_match.match_number::numeric / 2)
        AND status = 'pending';
        
    ELSIF v_completed_match.round_number = 102 THEN
      -- Branch A R2 → Branch A R3
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
        AND bracket_type = 'losers'
        AND round_number = 103
        AND match_number = 1
        AND status = 'pending';
        
    ELSIF v_completed_match.round_number = 103 THEN
      -- Branch A R3 → Semifinals M1
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
        AND bracket_type = 'semifinals'
        AND round_number = 250
        AND match_number = 1
        AND status = 'pending';
        
    ELSIF v_completed_match.round_number = 201 THEN
      -- Branch B R1 → Branch B R2
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
        AND bracket_type = 'losers'
        AND round_number = 202
        AND match_number = 1
        AND status = 'pending';
        
    ELSIF v_completed_match.round_number = 202 THEN
      -- Branch B R2 → Semifinals M2
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
        AND bracket_type = 'semifinals'
        AND round_number = 250
        AND match_number = 2
        AND status = 'pending';
    END IF;
    
    -- Advance winner in losers bracket
    IF v_next_match.id IS NOT NULL THEN
      IF v_next_match.bracket_type = 'semifinals' THEN
        -- Semifinals have specific positions
        IF v_next_match.player2_id IS NULL THEN
          UPDATE tournament_matches 
          SET player2_id = p_winner_id,
              status = CASE WHEN player1_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
              updated_at = NOW()
          WHERE id = v_next_match.id;
          RAISE NOTICE '✅ Advanced losers winner to Semifinals';
        END IF;
      ELSE
        -- Regular losers bracket advancement
        IF v_completed_match.match_number % 2 = 1 AND v_next_match.player1_id IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = p_winner_id,
              status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
              updated_at = NOW()
          WHERE id = v_next_match.id;
        ELSIF v_completed_match.match_number % 2 = 0 AND v_next_match.player2_id IS NULL THEN
          UPDATE tournament_matches 
          SET player2_id = p_winner_id,
              status = CASE WHEN player1_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
              updated_at = NOW()
          WHERE id = v_next_match.id;
        END IF;
      END IF;
    END IF;
  END IF;
  
  -- SEMIFINALS TO FINALS
  IF v_completed_match.bracket_type = 'semifinals' AND v_completed_match.round_number = 250 THEN
    SELECT * INTO v_next_match
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND bracket_type = 'finals'
      AND round_number = 300
      AND status = 'pending';
      
    IF v_next_match.id IS NOT NULL THEN
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = p_winner_id,
            status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
            updated_at = NOW()
        WHERE id = v_next_match.id;
      ELSIF v_next_match.player2_id IS NULL THEN
        UPDATE tournament_matches 
        SET player2_id = p_winner_id,
            status = CASE WHEN player1_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
            updated_at = NOW()
        WHERE id = v_next_match.id;
      END IF;
    END IF;
  END IF;
  
END;
$$;

-- 3. Update score submission function to use FIXED advancement
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
  v_loser_id uuid;
BEGIN
  -- Get match details
  SELECT * INTO v_match
  FROM tournament_matches
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Match not found'::text, NULL::uuid;
    RETURN;
  END IF;
  
  -- Validate match can be scored
  IF v_match.status = 'completed' THEN
    RETURN QUERY SELECT false, 'Match already completed'::text, NULL::uuid;
    RETURN;
  END IF;
  
  IF v_match.player1_id IS NULL OR v_match.player2_id IS NULL THEN
    RETURN QUERY SELECT false, 'Match not ready - missing players'::text, NULL::uuid;
    RETURN;
  END IF;
  
  -- Determine winner based on scores
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
    v_loser_id := v_match.player2_id;
  ELSIF p_player2_score > p_player1_score THEN
    v_winner_id := v_match.player2_id;
    v_loser_id := v_match.player1_id;
  ELSE
    RETURN QUERY SELECT false, 'Scores cannot be tied'::text, NULL::uuid;
    RETURN;
  END IF;
  
  -- Update match with scores and winner
  UPDATE tournament_matches
  SET 
    score_player1 = p_player1_score,
    score_player2 = p_player2_score,
    winner_id = v_winner_id,
    status = 'completed',
    score_input_by = p_submitted_by,
    score_submitted_at = NOW(),
    actual_end_time = NOW(),
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- Use FIXED advancement function
  PERFORM advance_sabo_tournament_fixed(v_match.tournament_id, p_match_id, v_winner_id);
  
  RETURN QUERY SELECT true, 'Score submitted and tournament advanced successfully'::text, v_winner_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, ('Error: ' || SQLERRM)::text, NULL::uuid;
END;
$$;

-- 4. RESET broken tournaments with duplicate players
UPDATE tournament_matches 
SET 
  player1_id = NULL,
  player2_id = NULL,
  status = 'pending',
  score_player1 = NULL,
  score_player2 = NULL,
  winner_id = NULL,
  score_input_by = NULL,
  score_submitted_at = NULL,
  actual_end_time = NULL,
  updated_at = NOW()
WHERE tournament_id IN (
  SELECT DISTINCT tournament_id 
  FROM tournament_matches 
  WHERE player1_id = player2_id 
    AND player1_id IS NOT NULL
)
AND round_number > 1; -- Keep Round 1 results intact

-- 5. Log the fix
INSERT INTO tournament_automation_log (
  tournament_id,
  automation_type,
  status,
  details,
  completed_at
)
SELECT DISTINCT 
  tournament_id,
  'critical_bug_fix',
  'completed',
  jsonb_build_object(
    'issue', 'duplicate_players_in_matches',
    'fix_applied', 'advancement_function_rewritten',
    'matches_reset', 'rounds_2_and_above',
    'fix_timestamp', NOW()
  ),
  NOW()
FROM tournament_matches 
WHERE player1_id = player2_id 
  AND player1_id IS NOT NULL;