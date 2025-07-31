-- Fix Double Elimination Logic with Correct Branch A/B Independence
-- Branch A and B are independent, each sends 1 winner to semifinal

-- First, update match statuses from pending to scheduled when players are present
UPDATE public.tournament_matches 
SET status = 'scheduled',
    updated_at = NOW()
WHERE status = 'pending' 
  AND player1_id IS NOT NULL 
  AND player2_id IS NOT NULL;

-- Create improved double elimination advancement function
CREATE OR REPLACE FUNCTION public.advance_double_elimination_winner_comprehensive_v2(p_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_match RECORD;
  v_tournament_id UUID;
  v_winner_id UUID;
  v_loser_id UUID;
  v_next_match RECORD;
  v_result JSONB;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  v_tournament_id := v_match.tournament_id;
  v_winner_id := v_match.winner_id;
  v_loser_id := CASE 
    WHEN v_match.player1_id = v_winner_id THEN v_match.player2_id 
    ELSE v_match.player1_id 
  END;
  
  -- Winner's Bracket Logic
  IF v_match.bracket_type = 'winner' OR v_match.bracket_type = 'winners' THEN
    -- Advance winner to next round in winner's bracket
    SELECT * INTO v_next_match
    FROM tournament_matches 
    WHERE tournament_id = v_tournament_id
      AND bracket_type = 'winner'
      AND round_number = v_match.round_number + 1
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF FOUND THEN
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END
        WHERE id = v_next_match.id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_winner_id, status = 'scheduled'
        WHERE id = v_next_match.id;
      END IF;
    END IF;
    
    -- Place loser in appropriate Loser's Branch
    IF v_match.round_number = 1 THEN
      -- Losers from Winner's Round 1 go to Loser's Branch A
      SELECT * INTO v_next_match
      FROM tournament_matches 
      WHERE tournament_id = v_tournament_id
        AND (bracket_type = 'loser' OR match_stage LIKE '%losers%' OR match_stage LIKE '%branch_a%')
        AND round_number = 1
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
      
    ELSIF v_match.round_number = 2 THEN
      -- Losers from Winner's Round 2 go to Loser's Branch B Round 1
      SELECT * INTO v_next_match
      FROM tournament_matches 
      WHERE tournament_id = v_tournament_id
        AND (match_stage LIKE '%branch_b%' OR match_stage LIKE '%losers_branch_b%')
        AND round_number = 1
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
    END IF;
    
    -- Place loser in found match
    IF FOUND THEN
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_loser_id, status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END
        WHERE id = v_next_match.id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_loser_id, status = 'scheduled'
        WHERE id = v_next_match.id;
      END IF;
    END IF;
  
  -- Loser's Branch A Logic (Independent progression)
  ELSIF v_match.bracket_type = 'loser' OR v_match.match_stage LIKE '%branch_a%' THEN
    -- Check if this is the final match of Branch A
    IF NOT EXISTS(
      SELECT 1 FROM tournament_matches 
      WHERE tournament_id = v_tournament_id
        AND (bracket_type = 'loser' OR match_stage LIKE '%branch_a%')
        AND round_number > v_match.round_number
    ) THEN
      -- Branch A winner goes to semifinal
      SELECT * INTO v_next_match
      FROM tournament_matches 
      WHERE tournament_id = v_tournament_id
        AND (bracket_type = 'semifinal' OR match_stage LIKE '%semifinal%')
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
    ELSE
      -- Advance to next round in Branch A
      SELECT * INTO v_next_match
      FROM tournament_matches 
      WHERE tournament_id = v_tournament_id
        AND (bracket_type = 'loser' OR match_stage LIKE '%branch_a%')
        AND round_number = v_match.round_number + 1
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
    END IF;
    
    IF FOUND THEN
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END
        WHERE id = v_next_match.id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_winner_id, status = 'scheduled'
        WHERE id = v_next_match.id;
      END IF;
    END IF;
  
  -- Loser's Branch B Logic (Independent progression)
  ELSIF v_match.match_stage LIKE '%branch_b%' THEN
    -- Check if this is the final match of Branch B
    IF NOT EXISTS(
      SELECT 1 FROM tournament_matches 
      WHERE tournament_id = v_tournament_id
        AND match_stage LIKE '%branch_b%'
        AND round_number > v_match.round_number
    ) THEN
      -- Branch B winner goes to semifinal
      SELECT * INTO v_next_match
      FROM tournament_matches 
      WHERE tournament_id = v_tournament_id
        AND (bracket_type = 'semifinal' OR match_stage LIKE '%semifinal%')
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
    ELSE
      -- Advance to next round in Branch B
      SELECT * INTO v_next_match
      FROM tournament_matches 
      WHERE tournament_id = v_tournament_id
        AND match_stage LIKE '%branch_b%'
        AND round_number = v_match.round_number + 1
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
    END IF;
    
    IF FOUND THEN
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END
        WHERE id = v_next_match.id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_winner_id, status = 'scheduled'
        WHERE id = v_next_match.id;
      END IF;
    END IF;
  
  -- Semifinal Logic
  ELSIF v_match.bracket_type = 'semifinal' OR v_match.match_stage LIKE '%semifinal%' THEN
    -- Semifinal winner goes to final
    SELECT * INTO v_next_match
    FROM tournament_matches 
    WHERE tournament_id = v_tournament_id
      AND (bracket_type = 'final' OR match_stage LIKE '%final%')
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF FOUND THEN
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END
        WHERE id = v_next_match.id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_winner_id, status = 'scheduled'
        WHERE id = v_next_match.id;
      END IF;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_advanced', v_winner_id,
    'next_match_updated', FOUND
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Create function to repair existing tournament with correct logic
CREATE OR REPLACE FUNCTION public.repair_double_elimination_bracket_v2(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_completed_matches RECORD;
  v_repair_count INTEGER := 0;
BEGIN
  -- Clear all player placements in future rounds first
  UPDATE tournament_matches 
  SET player1_id = NULL, player2_id = NULL, status = 'pending'
  WHERE tournament_id = p_tournament_id
    AND status != 'completed';
  
  -- Re-advance all completed matches in correct order
  FOR v_completed_matches IN
    SELECT id, round_number, bracket_type, match_stage
    FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
      AND status = 'completed'
      AND winner_id IS NOT NULL
    ORDER BY 
      CASE 
        WHEN bracket_type = 'winner' THEN 1
        WHEN bracket_type = 'loser' OR match_stage LIKE '%branch_a%' THEN 2
        WHEN match_stage LIKE '%branch_b%' THEN 3
        WHEN bracket_type = 'semifinal' THEN 4
        WHEN bracket_type = 'final' THEN 5
        ELSE 6
      END,
      round_number,
      match_number
  LOOP
    PERFORM public.advance_double_elimination_winner_comprehensive_v2(v_completed_matches.id);
    v_repair_count := v_repair_count + 1;
  END LOOP;
  
  -- Update statuses for matches with both players
  UPDATE tournament_matches 
  SET status = 'scheduled'
  WHERE tournament_id = p_tournament_id
    AND status = 'pending'
    AND player1_id IS NOT NULL 
    AND player2_id IS NOT NULL;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'matches_processed', v_repair_count,
    'repair_completed_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;