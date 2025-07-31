-- ================================
-- DOUBLE ELIMINATION SIMPLIFIED LOGIC IMPLEMENTATION
-- Theo specification: Winner's Bracket + Loser's Branch A/B + Semifinal + Final
-- ================================

-- 1. CREATE NEW FUNCTIONS FOR SIMPLIFIED DOUBLE ELIMINATION

-- Function: Create simplified double elimination bracket
CREATE OR REPLACE FUNCTION public.create_double_elimination_bracket_simplified(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_participants UUID[];
  v_participant_count INTEGER;
  v_bracket_matches JSONB := '[]'::JSONB;
  v_winner_matches JSONB := '[]'::JSONB;
  v_current_round INTEGER;
  v_match_count INTEGER;
  v_round_matches INTEGER;
  v_i INTEGER;
  v_j INTEGER;
BEGIN
  -- Get confirmed participants
  SELECT array_agg(user_id ORDER BY registration_date) INTO v_participants
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id 
    AND registration_status = 'confirmed';
    
  v_participant_count := array_length(v_participants, 1);
  
  IF v_participant_count IS NULL OR v_participant_count NOT IN (8, 16, 32) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid participant count. Must be 8, 16, or 32.'
    );
  END IF;

  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;

  -- ===============================
  -- STEP 1: CREATE WINNER'S BRACKET
  -- ===============================
  v_current_round := 1;
  v_match_count := 1;
  v_round_matches := v_participant_count / 2;

  -- Winner's Round 1: All participants
  FOR v_i IN 1..v_round_matches LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, bracket_type,
      status, created_at, updated_at
    ) VALUES (
      p_tournament_id, v_current_round, v_i,
      v_participants[((v_i-1)*2)+1], v_participants[((v_i-1)*2)+2],
      'winners', 'scheduled', NOW(), NOW()
    );
  END LOOP;

  -- Winner's Round 2: Half participants  
  v_current_round := 2;
  v_round_matches := v_round_matches / 2;
  FOR v_i IN 1..v_round_matches LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      bracket_type, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, v_current_round, v_i,
      'winners', 'scheduled', NOW(), NOW()
    );
  END LOOP;

  -- Winner's Round 3: Quarter participants
  v_current_round := 3;
  v_round_matches := v_round_matches / 2;
  FOR v_i IN 1..v_round_matches LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      bracket_type, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, v_current_round, v_i,
      'winners', 'scheduled', NOW(), NOW()
    );
  END LOOP;

  -- ===============================
  -- STEP 2: CREATE LOSER'S BRANCH A (từ WB Round 1)
  -- ===============================
  v_current_round := 1;
  
  -- Branch A Round 1: 8 losers from WB R1 → 4 (4 matches)
  v_round_matches := (v_participant_count / 2) / 2; -- 8/2 = 4
  FOR v_i IN 1..v_round_matches LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      bracket_type, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, v_current_round, v_i,
      'losers_branch_a', 'scheduled', NOW(), NOW()
    );
  END LOOP;

  -- Branch A Round 2: 4 → 2 (2 matches)
  v_current_round := 2;
  v_round_matches := v_round_matches / 2;
  FOR v_i IN 1..v_round_matches LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      bracket_type, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, v_current_round, v_i,
      'losers_branch_a', 'scheduled', NOW(), NOW()
    );
  END LOOP;

  -- Branch A Round 3: 2 → 1 (1 match)
  v_current_round := 3;
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number,
    bracket_type, status, created_at, updated_at
  ) VALUES (
    p_tournament_id, v_current_round, 1,
    'losers_branch_a', 'scheduled', NOW(), NOW()
  );

  -- ===============================
  -- STEP 3: CREATE LOSER'S BRANCH B (từ WB Round 2)  
  -- ===============================
  v_current_round := 1;
  
  -- Branch B Round 1: 4 losers from WB R2 → 2 (2 matches)
  v_round_matches := (v_participant_count / 4) / 2; -- 4/2 = 2
  FOR v_i IN 1..v_round_matches LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      bracket_type, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, v_current_round, v_i,
      'losers_branch_b', 'scheduled', NOW(), NOW()
    );
  END LOOP;

  -- Branch B Round 2: 2 → 1 (1 match)
  v_current_round := 2;
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number,
    bracket_type, status, created_at, updated_at
  ) VALUES (
    p_tournament_id, v_current_round, 1,
    'losers_branch_b', 'scheduled', NOW(), NOW()
  );

  -- ===============================
  -- STEP 4: CREATE SEMIFINAL (4 finalists)
  -- ===============================
  -- Semifinal Round 1: 4 → 2 (2 matches)
  FOR v_i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      bracket_type, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, v_i,
      'semifinal', 'scheduled', NOW(), NOW()
    );
  END LOOP;

  -- ===============================
  -- STEP 5: CREATE FINAL
  -- ===============================
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number,
    bracket_type, status, created_at, updated_at
  ) VALUES (
    p_tournament_id, 1, 1,
    'final', 'scheduled', NOW(), NOW()
  );

  -- Get total matches created
  SELECT COUNT(*) INTO v_match_count
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id;

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'participant_count', v_participant_count,
    'total_matches', v_match_count,
    'bracket_structure', jsonb_build_object(
      'winners_bracket', '3 rounds (8+4+2 matches)',
      'losers_branch_a', '3 rounds (4+2+1 matches)', 
      'losers_branch_b', '2 rounds (2+1 matches)',
      'semifinal', '1 round (2 matches)',
      'final', '1 round (1 match)'
    ),
    'created_at', NOW()
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Failed to create simplified bracket: %s', SQLERRM)
    );
END;
$$;

-- Function: Advance winner in simplified system
CREATE OR REPLACE FUNCTION public.advance_winner_simplified(p_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_next_match RECORD;
  v_loser_id UUID;
  v_winner_advanced BOOLEAN := false;
  v_loser_placed BOOLEAN := false;
  v_result JSONB;
BEGIN
  -- Get completed match details
  SELECT * INTO v_match
  FROM tournament_matches 
  WHERE id = p_match_id 
    AND status = 'completed'
    AND winner_id IS NOT NULL;
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Match not found or not completed'
    );
  END IF;

  -- Determine loser
  v_loser_id := CASE 
    WHEN v_match.winner_id = v_match.player1_id THEN v_match.player2_id
    ELSE v_match.player1_id
  END;

  -- ===============================
  -- WINNER ADVANCEMENT LOGIC
  -- ===============================
  IF v_match.bracket_type = 'winners' THEN
    -- Find next winner match
    SELECT * INTO v_next_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'winners'
      AND round_number = v_match.round_number + 1
      AND match_number = CEIL(v_match.match_number::numeric / 2)
      AND (player1_id IS NULL OR player2_id IS NULL);
      
    IF FOUND THEN
      -- Place winner in next match
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_match.winner_id, updated_at = NOW()
        WHERE id = v_next_match.id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_match.winner_id, updated_at = NOW()
        WHERE id = v_next_match.id;
      END IF;
      
      v_winner_advanced := true;
    ELSIF v_match.round_number = 3 THEN
      -- Winner reached semifinal
      SELECT public.setup_semifinal_from_winners(v_match.tournament_id) INTO v_result;
    END IF;

    -- ===============================
    -- LOSER PLACEMENT LOGIC
    -- ===============================
    IF v_match.round_number = 1 THEN
      -- Place in Branch A
      SELECT public.advance_loser_branch_a(v_match.tournament_id, v_loser_id, v_match.match_number) INTO v_result;
      v_loser_placed := (v_result->>'success')::boolean;
      
    ELSIF v_match.round_number = 2 THEN
      -- Place in Branch B
      SELECT public.advance_loser_branch_b(v_match.tournament_id, v_loser_id, v_match.match_number) INTO v_result;
      v_loser_placed := (v_result->>'success')::boolean;
      
    ELSIF v_match.round_number = 3 THEN
      -- Loser eliminated (no more chances)
      v_loser_placed := true;
    END IF;

  ELSIF v_match.bracket_type IN ('losers_branch_a', 'losers_branch_b') THEN
    -- Advance within same branch
    SELECT * INTO v_next_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = v_match.bracket_type
      AND round_number = v_match.round_number + 1
      AND match_number = CEIL(v_match.match_number::numeric / 2)
      AND (player1_id IS NULL OR player2_id IS NULL);
      
    IF FOUND THEN
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_match.winner_id, updated_at = NOW()
        WHERE id = v_next_match.id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_match.winner_id, updated_at = NOW()
        WHERE id = v_next_match.id;
      END IF;
      v_winner_advanced := true;
    ELSE
      -- Branch finalist → Check for semifinal setup
      SELECT public.setup_semifinal_from_branches(v_match.tournament_id) INTO v_result;
    END IF;
    
    -- Loser eliminated from tournament
    v_loser_placed := true;

  ELSIF v_match.bracket_type = 'semifinal' THEN
    -- Advance to final
    SELECT * INTO v_next_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'final'
      AND round_number = 1
      AND match_number = 1
      AND (player1_id IS NULL OR player2_id IS NULL);
      
    IF FOUND THEN
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_match.winner_id, updated_at = NOW()
        WHERE id = v_next_match.id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_match.winner_id, updated_at = NOW()
        WHERE id = v_next_match.id;
      END IF;
      v_winner_advanced := true;
    END IF;
    
    v_loser_placed := true;

  ELSIF v_match.bracket_type = 'final' THEN
    -- Tournament completed
    UPDATE tournaments 
    SET status = 'completed', completed_at = NOW(), updated_at = NOW()
    WHERE id = v_match.tournament_id;
    
    v_winner_advanced := true;
    v_loser_placed := true;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'tournament_id', v_match.tournament_id,
    'bracket_type', v_match.bracket_type,
    'winner_id', v_match.winner_id,
    'loser_id', v_loser_id,
    'winner_advanced', v_winner_advanced,
    'loser_placed', v_loser_placed,
    'processed_at', NOW()
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Failed to advance winner: %s', SQLERRM)
    );
END;
$$;

-- Function: Advance loser to Branch A
CREATE OR REPLACE FUNCTION public.advance_loser_branch_a(p_tournament_id UUID, p_loser_id UUID, p_source_match INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_target_match RECORD;
  v_target_match_number INTEGER;
BEGIN
  -- Calculate target match in Branch A Round 1
  -- Source matches 1,2 → Target match 1
  -- Source matches 3,4 → Target match 2  
  -- Source matches 5,6 → Target match 3
  -- Source matches 7,8 → Target match 4
  v_target_match_number := CEIL(p_source_match::numeric / 2);
  
  -- Find target match in Branch A
  SELECT * INTO v_target_match
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id
    AND bracket_type = 'losers_branch_a'
    AND round_number = 1
    AND match_number = v_target_match_number
    AND (player1_id IS NULL OR player2_id IS NULL);
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('No available slot in Branch A match %s', v_target_match_number)
    );
  END IF;

  -- Place loser in target match
  IF v_target_match.player1_id IS NULL THEN
    UPDATE tournament_matches 
    SET player1_id = p_loser_id, updated_at = NOW()
    WHERE id = v_target_match.id;
  ELSE
    UPDATE tournament_matches 
    SET player2_id = p_loser_id, updated_at = NOW()
    WHERE id = v_target_match.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'loser_id', p_loser_id,
    'placed_in_match', v_target_match.id,
    'branch', 'A',
    'round', 1,
    'match_number', v_target_match_number
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Failed to place in Branch A: %s', SQLERRM)
    );
END;
$$;

-- Function: Advance loser to Branch B  
CREATE OR REPLACE FUNCTION public.advance_loser_branch_b(p_tournament_id UUID, p_loser_id UUID, p_source_match INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_target_match RECORD;
  v_target_match_number INTEGER;
BEGIN
  -- Calculate target match in Branch B Round 1
  -- Source matches 1,2 → Target match 1
  -- Source matches 3,4 → Target match 2
  v_target_match_number := CEIL(p_source_match::numeric / 2);
  
  -- Find target match in Branch B
  SELECT * INTO v_target_match
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id
    AND bracket_type = 'losers_branch_b'
    AND round_number = 1
    AND match_number = v_target_match_number
    AND (player1_id IS NULL OR player2_id IS NULL);
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('No available slot in Branch B match %s', v_target_match_number)
    );
  END IF;

  -- Place loser in target match
  IF v_target_match.player1_id IS NULL THEN
    UPDATE tournament_matches 
    SET player1_id = p_loser_id, updated_at = NOW()
    WHERE id = v_target_match.id;
  ELSE
    UPDATE tournament_matches 
    SET player2_id = p_loser_id, updated_at = NOW()
    WHERE id = v_target_match.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'loser_id', p_loser_id,
    'placed_in_match', v_target_match.id,
    'branch', 'B',
    'round', 1,
    'match_number', v_target_match_number
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Failed to place in Branch B: %s', SQLERRM)
    );
END;
$$;

-- Function: Setup semifinal from all sources
CREATE OR REPLACE FUNCTION public.setup_semifinal_from_branches(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_winners_finalists UUID[];
  v_branch_a_finalist UUID;
  v_branch_b_finalist UUID;
  v_semifinal_matches RECORD;
  v_setup_count INTEGER := 0;
BEGIN
  -- Get 2 finalists from Winner's Bracket (Round 3 winners)
  SELECT array_agg(winner_id) INTO v_winners_finalists
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id
    AND bracket_type = 'winners'
    AND round_number = 3
    AND status = 'completed'
    AND winner_id IS NOT NULL;

  -- Get Branch A finalist (Round 3 winner)
  SELECT winner_id INTO v_branch_a_finalist
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id
    AND bracket_type = 'losers_branch_a'
    AND round_number = 3
    AND status = 'completed'
    AND winner_id IS NOT NULL;

  -- Get Branch B finalist (Round 2 winner)
  SELECT winner_id INTO v_branch_b_finalist
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id
    AND bracket_type = 'losers_branch_b'
    AND round_number = 2
    AND status = 'completed'
    AND winner_id IS NOT NULL;

  -- Check if we have all 4 finalists
  IF array_length(v_winners_finalists, 1) = 2 AND 
     v_branch_a_finalist IS NOT NULL AND 
     v_branch_b_finalist IS NOT NULL THEN
     
    -- Setup Semifinal Match 1: Winner1 vs Branch A Finalist
    UPDATE tournament_matches
    SET player1_id = v_winners_finalists[1],
        player2_id = v_branch_a_finalist,
        updated_at = NOW()
    WHERE tournament_id = p_tournament_id
      AND bracket_type = 'semifinal'
      AND round_number = 1
      AND match_number = 1;
      
    v_setup_count := v_setup_count + 1;

    -- Setup Semifinal Match 2: Winner2 vs Branch B Finalist  
    UPDATE tournament_matches
    SET player1_id = v_winners_finalists[2],
        player2_id = v_branch_b_finalist,
        updated_at = NOW()
    WHERE tournament_id = p_tournament_id
      AND bracket_type = 'semifinal'
      AND round_number = 1
      AND match_number = 2;
      
    v_setup_count := v_setup_count + 1;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'semifinal_matches_setup', v_setup_count,
    'winners_finalists', v_winners_finalists,
    'branch_a_finalist', v_branch_a_finalist,
    'branch_b_finalist', v_branch_b_finalist,
    'ready_for_semifinal', (v_setup_count = 2)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Failed to setup semifinal: %s', SQLERRM)
    );
END;
$$;

-- Function: Setup semifinal from winners only (if branches not ready)
CREATE OR REPLACE FUNCTION public.setup_semifinal_from_winners(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_winners_finalists UUID[];
  v_setup_count INTEGER := 0;
BEGIN
  -- Get 2 finalists from Winner's Bracket (Round 3 winners)
  SELECT array_agg(winner_id) INTO v_winners_finalists
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id
    AND bracket_type = 'winners'
    AND round_number = 3
    AND status = 'completed'
    AND winner_id IS NOT NULL;

  -- Only proceed if we have exactly 2 winners
  IF array_length(v_winners_finalists, 1) = 2 THEN
    -- Check if branches are ready, if not just setup what we can
    SELECT public.setup_semifinal_from_branches(p_tournament_id) INTO v_setup_count;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'winners_ready', array_length(v_winners_finalists, 1),
    'message', 'Winners ready for semifinal, waiting for loser branches'
  );
END;
$$;

-- Update trigger to use new simplified logic
CREATE OR REPLACE FUNCTION public.trigger_simplified_double_elimination()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
  v_tournament_type TEXT;
BEGIN
  -- Only trigger on completed matches with winners in double elimination
  IF NEW.status = 'completed' 
     AND NEW.winner_id IS NOT NULL 
     AND (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
    
    -- Check if this is a double elimination tournament
    SELECT tournament_type INTO v_tournament_type
    FROM tournaments 
    WHERE id = NEW.tournament_id;
    
    IF v_tournament_type = 'double_elimination' THEN
      -- Use simplified advancement logic
      SELECT public.advance_winner_simplified(NEW.id) INTO v_result;
      
      RAISE NOTICE 'Simplified DE advancement result: %', v_result;
      
      -- Log the automation
      INSERT INTO tournament_automation_log (
        tournament_id, automation_type, status, details, completed_at
      ) VALUES (
        NEW.tournament_id, 'simplified_double_elimination', 
        CASE WHEN (v_result->>'success')::boolean THEN 'completed' ELSE 'failed' END,
        v_result, NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS trigger_auto_advance_winner ON tournament_matches;
CREATE TRIGGER trigger_simplified_double_elimination
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_simplified_double_elimination();