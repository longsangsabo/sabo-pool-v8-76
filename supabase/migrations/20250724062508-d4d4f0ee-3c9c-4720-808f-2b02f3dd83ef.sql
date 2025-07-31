-- Fix double elimination bracket advancement and repair logic
-- 1. Update repair function to use correct signature
-- 2. Fix advancement logic for NULL player2_id cases  
-- 3. Add proper missing match creation
-- 4. Fix trigger functions

-- First, update the repair function to use correct function signature
CREATE OR REPLACE FUNCTION public.repair_double_elimination_bracket(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_repair_result JSONB;
  v_advancement_count INTEGER := 0;
  v_match RECORD;
  v_next_match RECORD;
  v_loser_id UUID;
  v_created_matches INTEGER := 0;
  v_fixed_advancements INTEGER := 0;
  v_missing_matches INTEGER := 0;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  IF v_tournament.tournament_type != 'double_elimination' THEN
    RETURN jsonb_build_object('error', 'This repair function is only for double elimination tournaments');
  END IF;
  
  RAISE NOTICE 'Starting bracket repair for tournament: %', v_tournament.name;
  
  -- Step 1: Fix completed matches that have winners but no advancement
  FOR v_match IN
    SELECT * FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
    AND status = 'completed' 
    AND winner_id IS NOT NULL
    ORDER BY bracket_type, round_number, match_number
  LOOP
    -- Check if this match needs advancement (winner not already in next round)
    DECLARE
      v_needs_advancement BOOLEAN := FALSE;
      v_expected_next_match RECORD;
    BEGIN
      -- Check if winner is already advanced correctly
      IF v_match.bracket_type = 'winner' AND v_match.round_number < 3 THEN
        -- Check next winner bracket round
        SELECT * INTO v_expected_next_match
        FROM tournament_matches
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'winner'
          AND round_number = v_match.round_number + 1
          AND match_number = CEIL(v_match.match_number::numeric / 2)
          AND (player1_id = v_match.winner_id OR player2_id = v_match.winner_id);
        
        IF NOT FOUND THEN
          v_needs_advancement := TRUE;
        END IF;
      ELSIF v_match.bracket_type = 'winner' AND v_match.round_number = 3 THEN
        -- Check semifinal
        SELECT * INTO v_expected_next_match
        FROM tournament_matches
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'semifinal'
          AND round_number = 4
          AND match_number = v_match.match_number
          AND (player1_id = v_match.winner_id OR player2_id = v_match.winner_id);
        
        IF NOT FOUND THEN
          v_needs_advancement := TRUE;
        END IF;
      ELSIF v_match.bracket_type = 'loser' THEN
        -- Check loser bracket advancement
        v_needs_advancement := TRUE; -- Simplify for now
      ELSIF v_match.bracket_type = 'semifinal' THEN
        -- Check final
        SELECT * INTO v_expected_next_match
        FROM tournament_matches
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'final'
          AND (player1_id = v_match.winner_id OR player2_id = v_match.winner_id);
        
        IF NOT FOUND THEN
          v_needs_advancement := TRUE;
        END IF;
      END IF;
      
      -- Try to advance if needed
      IF v_needs_advancement THEN
        BEGIN
          -- Use the correct function signature: only match_id
          SELECT public.advance_double_elimination_winner(v_match.id) INTO v_repair_result;
          
          IF v_repair_result->>'success' = 'true' AND COALESCE((v_repair_result->>'advancements')::integer, 0) > 0 THEN
            v_fixed_advancements := v_fixed_advancements + 1;
            RAISE NOTICE 'Successfully advanced match %: %', v_match.id, v_repair_result;
          ELSE
            RAISE NOTICE 'No advancement needed or failed for match %: %', v_match.id, v_repair_result;
          END IF;
        EXCEPTION
          WHEN OTHERS THEN
            -- Log error but continue
            RAISE NOTICE 'Failed to advance winner for match %: %', v_match.id, SQLERRM;
        END;
      END IF;
    END;
  END LOOP;
  
  -- Step 2: Create missing matches if bracket structure is incomplete
  -- Check for missing loser bracket matches
  WITH winner_completed AS (
    SELECT round_number, COUNT(*) as completed_count
    FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
      AND bracket_type = 'winner'
      AND status = 'completed'
      AND winner_id IS NOT NULL
    GROUP BY round_number
  ),
  expected_loser_matches AS (
    SELECT 
      1 as round_number,
      'branch_a' as branch_type,
      CEIL(wc.completed_count / 2.0)::integer as expected_matches
    FROM winner_completed wc 
    WHERE wc.round_number = 1
    UNION ALL
    SELECT 
      1 as round_number,
      'branch_b' as branch_type, 
      wc.completed_count::integer as expected_matches
    FROM winner_completed wc 
    WHERE wc.round_number = 2
  ),
  actual_loser_matches AS (
    SELECT 
      round_number,
      branch_type,
      COUNT(*) as actual_matches
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND bracket_type = 'loser'
    GROUP BY round_number, branch_type
  )
  SELECT COUNT(*) INTO v_missing_matches
  FROM expected_loser_matches elm
  LEFT JOIN actual_loser_matches alm ON elm.round_number = alm.round_number 
    AND elm.branch_type = alm.branch_type
  WHERE COALESCE(alm.actual_matches, 0) < elm.expected_matches;
  
  -- If we have missing matches, create them
  IF v_missing_matches > 0 THEN
    RAISE NOTICE 'Found % missing loser bracket matches, creating them...', v_missing_matches;
    
    -- Create missing Branch A Round 1 matches
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, branch_type, 
      status, created_at, updated_at
    )
    SELECT 
      p_tournament_id,
      1,
      generate_series(
        COALESCE((SELECT MAX(match_number) FROM tournament_matches 
                  WHERE tournament_id = p_tournament_id 
                    AND bracket_type = 'loser' 
                    AND branch_type = 'branch_a' 
                    AND round_number = 1), 0) + 1,
        CEIL((SELECT COUNT(*) FROM tournament_matches 
              WHERE tournament_id = p_tournament_id 
                AND bracket_type = 'winner' 
                AND round_number = 1 
                AND status = 'completed') / 2.0)::integer
      ),
      'loser',
      'branch_a',
      'pending',
      NOW(),
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM tournament_matches 
      WHERE tournament_id = p_tournament_id 
        AND bracket_type = 'loser' 
        AND branch_type = 'branch_a' 
        AND round_number = 1
    );
    
    GET DIAGNOSTICS v_created_matches = ROW_COUNT;
  END IF;
  
  -- Step 3: Log repair activity
  INSERT INTO tournament_automation_log (
    tournament_id,
    automation_type,
    status,
    details,
    completed_at
  ) VALUES (
    p_tournament_id,
    'bracket_repair',
    'completed',
    jsonb_build_object(
      'fixed_advancements', v_fixed_advancements,
      'created_matches', v_created_matches,
      'missing_matches_found', v_missing_matches,
      'repair_type', 'double_elimination_comprehensive',
      'tournament_name', v_tournament.name
    ),
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'tournament_name', v_tournament.name,
    'fixed_advancements', v_fixed_advancements,
    'created_matches', v_created_matches,
    'missing_matches_found', v_missing_matches,
    'repair_summary', format('Fixed %s advancements, created %s matches, found %s missing matches', 
                           v_fixed_advancements, v_created_matches, v_missing_matches),
    'repaired_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Bracket repair failed: %s', SQLERRM),
      'tournament_id', p_tournament_id
    );
END;
$$;

-- Update the advancement function to handle NULL player2_id correctly
CREATE OR REPLACE FUNCTION public.advance_double_elimination_winner(p_match_id uuid)
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
    -- This is likely a bye situation, no loser to advance
    v_loser_id := NULL;
  ELSE
    v_loser_id := CASE WHEN v_winner_id = v_match.player1_id THEN v_match.player2_id 
                       ELSE v_match.player1_id END;
  END IF;
  
  IF v_winner_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No winner specified for match');
  END IF;
  
  RAISE NOTICE 'Processing advancement for match % (R% M% %) - Winner: %, Loser: %', 
    v_match.id, v_match.round_number, v_match.match_number, v_match.bracket_type, v_winner_id, v_loser_id;
  
  -- 🏆 WINNER BRACKET advancement logic
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
        -- Loser from WB Round 3 → Semifinal (as player2)
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
  
  -- 🔽 LOSER BRACKET advancement logic
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
  
  -- 🏁 SEMIFINAL advancement logic
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

-- Update trigger function to use correct signature
CREATE OR REPLACE FUNCTION public.trigger_advance_double_elimination_winner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_tournament_type TEXT;
BEGIN
  -- Only trigger on matches that have been completed with a winner
  -- And the winner was just set (changed from NULL or different winner)
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND 
     (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
    
    -- Check if this is a double elimination tournament
    SELECT tournament_type INTO v_tournament_type
    FROM tournaments 
    WHERE id = NEW.tournament_id;
    
    -- Only auto-advance for double elimination tournaments
    IF v_tournament_type = 'double_elimination' THEN
      -- Log the trigger execution
      RAISE NOTICE 'Auto-advancing double elimination winner % for match % in tournament %', 
        NEW.winner_id, NEW.id, NEW.tournament_id;
      
      -- Call the advance winner function with only match_id
      SELECT public.advance_double_elimination_winner(NEW.id) INTO v_result;
      
      -- Log the result for debugging
      RAISE NOTICE 'Double elimination advancement result: %', v_result;
      
      -- Insert automation log for monitoring
      INSERT INTO public.tournament_automation_log (
        tournament_id, automation_type, status, details, completed_at
      ) VALUES (
        NEW.tournament_id, 'auto_advancement', 'completed',
        jsonb_build_object(
          'match_id', NEW.id,
          'winner_id', NEW.winner_id,
          'advancement_result', v_result,
          'trigger_type', 'double_elimination'
        ),
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;