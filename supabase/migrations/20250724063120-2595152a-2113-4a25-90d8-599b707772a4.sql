-- COMPLETE FIX FOR SABO12 DOUBLE ELIMINATION BRACKET ISSUES
-- 1. Drop all conflicting functions first
-- 2. Create one clean advancement function  
-- 3. Fix data inconsistencies
-- 4. Create comprehensive repair function

-- Drop conflicting functions
DROP FUNCTION IF EXISTS public.advance_double_elimination_winner(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.advance_double_elimination_winner(uuid, uuid);
DROP FUNCTION IF EXISTS public.advance_double_elimination_winner(uuid);

-- Create ONE clean advancement function
CREATE OR REPLACE FUNCTION public.advance_double_elimination_winner_fixed(p_match_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_winner_id UUID;
  v_loser_id UUID;
  v_next_match RECORD;
  v_loser_match RECORD;
  v_advancement_count INTEGER := 0;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Get winner and loser from the completed match
  v_winner_id := v_match.winner_id;
  
  -- Handle loser ID correctly, especially when player2_id is NULL
  IF v_match.player2_id IS NULL THEN
    v_loser_id := NULL; -- Bye situation
  ELSE
    v_loser_id := CASE WHEN v_winner_id = v_match.player1_id THEN v_match.player2_id 
                       ELSE v_match.player1_id END;
  END IF;
  
  IF v_winner_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No winner specified for match');
  END IF;
  
  RAISE NOTICE 'Processing advancement for match % (R% M% %) - Winner: %, Loser: %', 
    v_match.id, v_match.round_number, v_match.match_number, v_match.bracket_type, v_winner_id, v_loser_id;
  
  -- WINNER BRACKET advancement logic
  IF v_match.bracket_type = 'winner' THEN
    -- Advance winner to next winner round (Rounds 1-2 only)
    IF v_match.round_number < 3 THEN
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'winner'
        AND round_number = v_match.round_number + 1
        AND match_number = CEIL(v_match.match_number::numeric / 2)
        AND (player1_id IS NULL OR player2_id IS NULL);
      
      IF FOUND THEN
        IF v_next_match.player1_id IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = v_winner_id, 
              status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
              updated_at = NOW()
          WHERE id = v_next_match.id;
        ELSE
          UPDATE tournament_matches 
          SET player2_id = v_winner_id, 
              status = 'scheduled',
              updated_at = NOW()
          WHERE id = v_next_match.id;
        END IF;
        v_advancement_count := v_advancement_count + 1;
        RAISE NOTICE 'Advanced winner % to WB Round %', v_winner_id, v_match.round_number + 1;
      END IF;
    ELSIF v_match.round_number = 3 THEN
      -- Winner from WB Round 3 goes to Semifinal (Round 4)
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'semifinal'
        AND round_number = 4
        AND match_number = v_match.match_number
        AND (player1_id IS NULL OR player2_id IS NULL);
      
      IF FOUND THEN
        IF v_next_match.player1_id IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = v_winner_id, 
              status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
              updated_at = NOW()
          WHERE id = v_next_match.id;
        ELSE
          UPDATE tournament_matches 
          SET player2_id = v_winner_id, 
              status = 'scheduled',
              updated_at = NOW()
          WHERE id = v_next_match.id;
        END IF;
        v_advancement_count := v_advancement_count + 1;
        RAISE NOTICE 'Advanced WB Round 3 winner % to Semifinal %', v_winner_id, v_match.match_number;
      END IF;
    END IF;
    
    -- Send loser to appropriate Loser Bracket branch (only if loser exists)
    IF v_loser_id IS NOT NULL THEN
      IF v_match.round_number = 1 THEN
        -- Loser from WB Round 1 → Branch A Round 1
        SELECT * INTO v_loser_match
        FROM tournament_matches
        WHERE tournament_id = v_match.tournament_id
          AND bracket_type = 'loser'
          AND branch_type = 'branch_a'
          AND round_number = 1
          AND match_number = CEIL(v_match.match_number::numeric / 2)
          AND (player1_id IS NULL OR player2_id IS NULL);
        
        IF FOUND THEN
          IF v_loser_match.player1_id IS NULL THEN
            UPDATE tournament_matches 
            SET player1_id = v_loser_id, 
                status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
                updated_at = NOW()
            WHERE id = v_loser_match.id;
          ELSE
            UPDATE tournament_matches 
            SET player2_id = v_loser_id, 
                status = 'scheduled',
                updated_at = NOW()
            WHERE id = v_loser_match.id;
          END IF;
          v_advancement_count := v_advancement_count + 1;
          RAISE NOTICE 'Sent WB Round 1 loser % to Branch A Round 1', v_loser_id;
        END IF;
        
      ELSIF v_match.round_number = 2 THEN
        -- Loser from WB Round 2 → Branch B Round 1
        SELECT * INTO v_loser_match
        FROM tournament_matches
        WHERE tournament_id = v_match.tournament_id
          AND bracket_type = 'loser'
          AND branch_type = 'branch_b'
          AND round_number = 1
          AND match_number = v_match.match_number
          AND (player1_id IS NULL OR player2_id IS NULL);
        
        IF FOUND THEN
          IF v_loser_match.player1_id IS NULL THEN
            UPDATE tournament_matches 
            SET player1_id = v_loser_id, 
                status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
                updated_at = NOW()
            WHERE id = v_loser_match.id;
          ELSE
            UPDATE tournament_matches 
            SET player2_id = v_loser_id, 
                status = 'scheduled',
                updated_at = NOW()
            WHERE id = v_loser_match.id;
          END IF;
          v_advancement_count := v_advancement_count + 1;
          RAISE NOTICE 'Sent WB Round 2 loser % to Branch B Round 1', v_loser_id;
        END IF;
      ELSIF v_match.round_number = 3 THEN
        -- Loser from WB Round 3 → goes to one of the semifinals as player2
        SELECT * INTO v_loser_match
        FROM tournament_matches
        WHERE tournament_id = v_match.tournament_id
          AND bracket_type = 'semifinal'
          AND round_number = 4
          AND match_number = v_match.match_number
          AND player2_id IS NULL;
        
        IF FOUND THEN
          UPDATE tournament_matches 
          SET player2_id = v_loser_id, 
              status = CASE WHEN player1_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
              updated_at = NOW()
          WHERE id = v_loser_match.id;
          v_advancement_count := v_advancement_count + 1;
          RAISE NOTICE 'Sent WB Round 3 loser % to Semifinal as player2', v_loser_id;
        END IF;
      END IF;
    END IF;
  
  -- LOSER BRACKET advancement logic
  ELSIF v_match.bracket_type = 'loser' THEN
    IF v_match.branch_type = 'branch_a' THEN
      -- Advance within Branch A
      IF v_match.round_number < 3 THEN
        SELECT * INTO v_next_match
        FROM tournament_matches
        WHERE tournament_id = v_match.tournament_id
          AND bracket_type = 'loser'
          AND branch_type = 'branch_a'
          AND round_number = v_match.round_number + 1
          AND match_number = CEIL(v_match.match_number::numeric / 2)
          AND (player1_id IS NULL OR player2_id IS NULL);
        
        IF FOUND THEN
          IF v_next_match.player1_id IS NULL THEN
            UPDATE tournament_matches 
            SET player1_id = v_winner_id, 
                status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
                updated_at = NOW()
            WHERE id = v_next_match.id;
          ELSE
            UPDATE tournament_matches 
            SET player2_id = v_winner_id, 
                status = 'scheduled',
                updated_at = NOW()
            WHERE id = v_next_match.id;
          END IF;
          v_advancement_count := v_advancement_count + 1;
        END IF;
      ELSIF v_match.round_number = 3 THEN
        -- Branch A Final → Semifinal Round 4 Match 1 (as player1)
        SELECT * INTO v_next_match
        FROM tournament_matches
        WHERE tournament_id = v_match.tournament_id
          AND bracket_type = 'semifinal'
          AND round_number = 4
          AND match_number = 1
          AND player1_id IS NULL;
        
        IF FOUND THEN
          UPDATE tournament_matches 
          SET player1_id = v_winner_id, 
              status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
              updated_at = NOW()
          WHERE id = v_next_match.id;
          v_advancement_count := v_advancement_count + 1;
        END IF;
      END IF;
      
    ELSIF v_match.branch_type = 'branch_b' THEN
      -- Advance within Branch B
      IF v_match.round_number < 2 THEN
        SELECT * INTO v_next_match
        FROM tournament_matches
        WHERE tournament_id = v_match.tournament_id
          AND bracket_type = 'loser'
          AND branch_type = 'branch_b'
          AND round_number = v_match.round_number + 1
          AND (player1_id IS NULL OR player2_id IS NULL);
        
        IF FOUND THEN
          IF v_next_match.player1_id IS NULL THEN
            UPDATE tournament_matches 
            SET player1_id = v_winner_id, 
                status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
                updated_at = NOW()
            WHERE id = v_next_match.id;
          ELSE
            UPDATE tournament_matches 
            SET player2_id = v_winner_id, 
                status = 'scheduled',
                updated_at = NOW()
            WHERE id = v_next_match.id;
          END IF;
          v_advancement_count := v_advancement_count + 1;
        END IF;
      ELSIF v_match.round_number = 2 THEN
        -- Branch B Final → Semifinal Round 4 Match 2 (as player1)
        SELECT * INTO v_next_match
        FROM tournament_matches
        WHERE tournament_id = v_match.tournament_id
          AND bracket_type = 'semifinal'
          AND round_number = 4
          AND match_number = 2
          AND player1_id IS NULL;
        
        IF FOUND THEN
          UPDATE tournament_matches 
          SET player1_id = v_winner_id, 
              status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
              updated_at = NOW()
          WHERE id = v_next_match.id;
          v_advancement_count := v_advancement_count + 1;
        END IF;
      END IF;
    END IF;
  
  -- SEMIFINAL advancement logic
  ELSIF v_match.bracket_type = 'semifinal' THEN
    -- Semifinal winners go to Final (Round 5)
    SELECT * INTO v_next_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'final'
      AND round_number = 5
      AND (player1_id IS NULL OR player2_id IS NULL);
    
    IF FOUND THEN
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, 
            status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
            updated_at = NOW()
        WHERE id = v_next_match.id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_winner_id, 
            status = 'scheduled',
            updated_at = NOW()
        WHERE id = v_next_match.id;
      END IF;
      v_advancement_count := v_advancement_count + 1;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_id', v_winner_id,
    'loser_id', v_loser_id,
    'advancements', v_advancement_count,
    'bracket_type', v_match.bracket_type,
    'branch_type', v_match.branch_type,
    'round_number', v_match.round_number
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to advance winner: ' || SQLERRM,
      'match_id', p_match_id
    );
END;
$$;

-- Fix data inconsistencies in sabo12 tournament
UPDATE tournament_matches 
SET status = 'pending'
WHERE tournament_id = 'd528882d-bf18-4db7-b4d6-7b9f80cc7939'
  AND status = 'scheduled' 
  AND winner_id IS NOT NULL;

-- Fix duplicate player assignments (player1_id = player2_id)
UPDATE tournament_matches 
SET player2_id = NULL,
    status = 'pending'
WHERE tournament_id = 'd528882d-bf18-4db7-b4d6-7b9f80cc7939'
  AND player1_id = player2_id;

-- Create comprehensive repair function for sabo12
CREATE OR REPLACE FUNCTION public.repair_sabo12_bracket()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament_id UUID := 'd528882d-bf18-4db7-b4d6-7b9f80cc7939';
  v_match RECORD;
  v_repair_result JSONB;
  v_fixed_advancements INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting comprehensive repair for sabo12 tournament';
  
  -- Step 1: Fix all completed matches that need advancement
  FOR v_match IN
    SELECT * FROM tournament_matches 
    WHERE tournament_id = v_tournament_id
    AND status = 'completed' 
    AND winner_id IS NOT NULL
    ORDER BY bracket_type, round_number, match_number
  LOOP
    BEGIN
      -- Use the fixed advancement function
      SELECT public.advance_double_elimination_winner_fixed(v_match.id) INTO v_repair_result;
      
      IF v_repair_result->>'success' = 'true' AND COALESCE((v_repair_result->>'advancements')::integer, 0) > 0 THEN
        v_fixed_advancements := v_fixed_advancements + 1;
        RAISE NOTICE 'Successfully advanced match %: %', v_match.id, v_repair_result;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Failed to advance winner for match %: %', v_match.id, SQLERRM;
    END;
  END LOOP;
  
  -- Step 2: Update match statuses to be consistent
  UPDATE tournament_matches 
  SET status = 'scheduled'
  WHERE tournament_id = v_tournament_id
    AND status = 'pending'
    AND player1_id IS NOT NULL 
    AND player2_id IS NOT NULL;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', v_tournament_id,
    'fixed_advancements', v_fixed_advancements,
    'repair_summary', format('Fixed %s advancement issues in sabo12', v_fixed_advancements),
    'repaired_at', NOW()
  );
END;
$$;