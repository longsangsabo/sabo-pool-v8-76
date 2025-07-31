-- PHASE 1: Audit current system state
-- First, let's see what functions actually exist
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE (p.proname ILIKE '%advance%' OR p.proname ILIKE '%submit%score%' OR p.proname ILIKE '%sabo%')
  AND n.nspname = 'public'
ORDER BY p.proname;

-- PHASE 2: Create complete SABO advancement system
CREATE OR REPLACE FUNCTION public.advance_sabo_tournament_fixed(
  p_tournament_id uuid,
  p_completed_match_id uuid,
  p_winner_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_completed_match record;
  v_loser_id uuid;
  v_next_match_id uuid;
  v_loser_next_match_id uuid;
  v_result jsonb := jsonb_build_object();
BEGIN
  -- Get completed match details
  SELECT * INTO v_completed_match
  FROM tournament_matches
  WHERE id = p_completed_match_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found: %', p_completed_match_id;
  END IF;
  
  -- Determine loser
  IF v_completed_match.player1_id = p_winner_id THEN
    v_loser_id := v_completed_match.player2_id;
  ELSE
    v_loser_id := v_completed_match.player1_id;
  END IF;
  
  RAISE NOTICE 'Advancing tournament %, match %, winner %, loser %', 
    p_tournament_id, p_completed_match_id, p_winner_id, v_loser_id;
  
  -- WINNERS BRACKET ADVANCEMENT
  IF v_completed_match.round_number = 1 THEN
    -- Round 1 → Round 2 (Winners Bracket)
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND round_number = 2
      AND bracket_type = 'winners'
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    -- Assign winner to Round 2
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      END IF;
      
      v_result := jsonb_set(v_result, '{winner_advanced_to}', to_jsonb(v_next_match_id));
      RAISE NOTICE 'Advanced winner % to Round 2 match %', p_winner_id, v_next_match_id;
    END IF;
    
    -- Round 1 losers → Losers Branch A (Round 101)
    SELECT id INTO v_loser_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND round_number = 101
      AND bracket_type = 'losers'
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    -- Assign loser to Losers Branch A
    IF v_loser_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_loser_next_match_id) IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_loser_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_loser_next_match_id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_loser_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_loser_next_match_id;
      END IF;
      
      v_result := jsonb_set(v_result, '{loser_advanced_to}', to_jsonb(v_loser_next_match_id));
      RAISE NOTICE 'Advanced loser % to Losers Branch A match %', v_loser_id, v_loser_next_match_id;
    END IF;
    
  ELSIF v_completed_match.round_number = 2 THEN
    -- Round 2 → Round 3 (Winners Bracket)
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND round_number = 3
      AND bracket_type = 'winners'
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      END IF;
      
      v_result := jsonb_set(v_result, '{winner_advanced_to}', to_jsonb(v_next_match_id));
    END IF;
    
    -- Round 2 losers → Losers Branch B (Round 201)
    SELECT id INTO v_loser_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND round_number = 201
      AND bracket_type = 'losers'
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF v_loser_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_loser_next_match_id) IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_loser_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_loser_next_match_id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_loser_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_loser_next_match_id;
      END IF;
      
      v_result := jsonb_set(v_result, '{loser_advanced_to}', to_jsonb(v_loser_next_match_id));
    END IF;
    
  ELSIF v_completed_match.round_number = 3 THEN
    -- Round 3 → Semifinals (Round 250)
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND round_number = 250
      AND bracket_type = 'semifinals'
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      END IF;
      
      v_result := jsonb_set(v_result, '{winner_advanced_to}', to_jsonb(v_next_match_id));
    END IF;
    
    -- Round 3 losers are eliminated
    v_result := jsonb_set(v_result, '{loser_eliminated}', to_jsonb(true));
    
  END IF;
  
  -- LOSERS BRACKET ADVANCEMENT
  IF v_completed_match.round_number = 101 THEN
    -- Losers Branch A Round 1 → Round 2
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND round_number = 102
      AND bracket_type = 'losers'
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      END IF;
    END IF;
    
  ELSIF v_completed_match.round_number = 102 THEN
    -- Losers Branch A Round 2 → Round 3
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND round_number = 103
      AND bracket_type = 'losers'
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      END IF;
    END IF;
    
  ELSIF v_completed_match.round_number = 103 THEN
    -- Losers Branch A Round 3 → Semifinals
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND round_number = 250
      AND bracket_type = 'semifinals'
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      END IF;
    END IF;
    
  ELSIF v_completed_match.round_number = 201 THEN
    -- Losers Branch B Round 1 → Round 2
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND round_number = 202
      AND bracket_type = 'losers'
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      END IF;
    END IF;
    
  ELSIF v_completed_match.round_number = 202 THEN
    -- Losers Branch B Round 2 → Semifinals
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND round_number = 250
      AND bracket_type = 'semifinals'
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      END IF;
    END IF;
  END IF;
  
  -- SEMIFINALS AND FINALS
  IF v_completed_match.round_number = 250 THEN
    -- Semifinals → Finals (Round 300)
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND round_number = 300
      AND bracket_type = 'finals'
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      END IF;
      
      v_result := jsonb_set(v_result, '{advanced_to_finals}', to_jsonb(v_next_match_id));
    END IF;
  END IF;
  
  -- TOURNAMENT COMPLETION
  IF v_completed_match.round_number = 300 THEN
    -- Finals completed - tournament finished
    UPDATE tournaments 
    SET 
      status = 'completed',
      updated_at = NOW()
    WHERE id = p_tournament_id;
    
    v_result := jsonb_set(v_result, '{tournament_completed}', to_jsonb(true));
    v_result := jsonb_set(v_result, '{champion}', to_jsonb(p_winner_id));
    
    RAISE NOTICE 'Tournament % completed with winner %', p_tournament_id, p_winner_id;
  END IF;
  
  v_result := jsonb_set(v_result, '{success}', to_jsonb(true));
  v_result := jsonb_set(v_result, '{message}', to_jsonb('Tournament advancement completed successfully'));
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournament_id', p_tournament_id,
      'match_id', p_completed_match_id
    );
END;
$$;