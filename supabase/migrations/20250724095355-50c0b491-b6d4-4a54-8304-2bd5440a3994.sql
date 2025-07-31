-- Fix branch type logic in double elimination functions
CREATE OR REPLACE FUNCTION public.fix_double_elimination_comprehensive(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_match RECORD;
  v_fixed_count INTEGER := 0;
  v_created_count INTEGER := 0;
  v_deleted_duplicates INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF v_tournament IS NULL THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Step 1: Remove duplicate players in same match
  DELETE FROM tournament_matches
  WHERE tournament_id = p_tournament_id
    AND player1_id = player2_id
    AND player1_id IS NOT NULL;
  
  GET DIAGNOSTICS v_deleted_duplicates = ROW_COUNT;
  
  -- Step 2: Fix completed Winner's Bracket matches - advance losers to Loser's Bracket
  FOR v_match IN
    SELECT tm.*, 
           CASE WHEN tm.player1_id = tm.winner_id THEN tm.player2_id ELSE tm.player1_id END as loser_id
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND tm.bracket_type = 'winner'
      AND tm.status = 'completed'
      AND tm.winner_id IS NOT NULL
  LOOP
    -- Find appropriate loser bracket match for this loser
    UPDATE tournament_matches
    SET player1_id = COALESCE(player1_id, v_match.loser_id),
        player2_id = CASE 
          WHEN player1_id IS NULL THEN player2_id
          WHEN player2_id IS NULL THEN v_match.loser_id
          ELSE player2_id
        END,
        updated_at = NOW()
    WHERE tournament_id = p_tournament_id
      AND bracket_type = 'loser'
      AND round_number = 1
      AND branch_type IN ('branch_a', 'A')  -- Accept both formats
      AND (player1_id IS NULL OR player2_id IS NULL)
      AND id IN (
        SELECT id FROM tournament_matches
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'loser'
          AND round_number = 1
          AND branch_type IN ('branch_a', 'A')
          AND (player1_id IS NULL OR player2_id IS NULL)
        ORDER BY match_number
        LIMIT 1
      );
    
    IF FOUND THEN
      v_fixed_count := v_fixed_count + 1;
    END IF;
  END LOOP;
  
  -- Step 3: Fix completed Winner's Bracket matches - advance winners to next round
  FOR v_match IN
    SELECT tm.*
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND tm.bracket_type = 'winner'
      AND tm.status = 'completed'
      AND tm.winner_id IS NOT NULL
  LOOP
    -- Find next round winner bracket match
    UPDATE tournament_matches
    SET player1_id = COALESCE(player1_id, v_match.winner_id),
        player2_id = CASE 
          WHEN player1_id IS NULL THEN player2_id
          WHEN player2_id IS NULL THEN v_match.winner_id
          ELSE player2_id
        END,
        updated_at = NOW()
    WHERE tournament_id = p_tournament_id
      AND bracket_type = 'winner'
      AND round_number = v_match.round_number + 1
      AND (player1_id IS NULL OR player2_id IS NULL)
      AND id IN (
        SELECT id FROM tournament_matches
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'winner'
          AND round_number = v_match.round_number + 1
          AND (player1_id IS NULL OR player2_id IS NULL)
        ORDER BY match_number
        LIMIT 1
      );
  END LOOP;
  
  -- Step 4: Standardize branch_type to use consistent format
  UPDATE tournament_matches
  SET branch_type = 'branch_a',
      updated_at = NOW()
  WHERE tournament_id = p_tournament_id
    AND bracket_type = 'loser'
    AND branch_type = 'A';
    
  UPDATE tournament_matches
  SET branch_type = 'branch_b',
      updated_at = NOW()
  WHERE tournament_id = p_tournament_id
    AND bracket_type = 'loser'
    AND branch_type = 'B';
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'tournament_name', v_tournament.name,
    'deleted_duplicates', v_deleted_duplicates,
    'fixed_advancements', v_fixed_count,
    'repair_summary', format('Deleted %s duplicates, fixed %s advancements', v_deleted_duplicates, v_fixed_count)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Comprehensive fix failed: %s', SQLERRM),
      'tournament_id', p_tournament_id
    );
END;
$function$;

-- Update advance_winner_simplified to use consistent branch_type
CREATE OR REPLACE FUNCTION public.advance_winner_simplified(p_match_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_match RECORD;
  v_loser_id UUID;
  v_winner_advanced BOOLEAN := FALSE;
  v_loser_placed BOOLEAN := FALSE;
  v_next_match_id UUID;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  IF v_match.status != 'completed' OR v_match.winner_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Match must be completed with a winner');
  END IF;
  
  -- Determine loser
  v_loser_id := CASE 
    WHEN v_match.player1_id = v_match.winner_id THEN v_match.player2_id 
    ELSE v_match.player1_id 
  END;
  
  -- WINNER ADVANCEMENT
  IF v_match.bracket_type = 'winner' THEN
    -- Advance winner to next winner bracket round
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'winner'
      AND round_number = v_match.round_number + 1
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      UPDATE tournament_matches
      SET player1_id = COALESCE(player1_id, v_match.winner_id),
          player2_id = CASE 
            WHEN player1_id IS NULL THEN player2_id
            WHEN player2_id IS NULL THEN v_match.winner_id
            ELSE player2_id
          END,
          updated_at = NOW()
      WHERE id = v_next_match_id;
      
      v_winner_advanced := TRUE;
    END IF;
    
    -- LOSER PLACEMENT - place loser in loser bracket
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'loser'
      AND round_number = 1
      AND branch_type IN ('branch_a', 'A')  -- Accept both formats
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      UPDATE tournament_matches
      SET player1_id = COALESCE(player1_id, v_loser_id),
          player2_id = CASE 
            WHEN player1_id IS NULL THEN player2_id
            WHEN player2_id IS NULL THEN v_loser_id
            ELSE player2_id
          END,
          updated_at = NOW()
      WHERE id = v_next_match_id;
      
      v_loser_placed := TRUE;
    END IF;
    
  ELSIF v_match.bracket_type = 'loser' THEN
    -- Advance winner to next loser bracket round
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'loser'
      AND round_number = v_match.round_number + 1
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      UPDATE tournament_matches
      SET player1_id = COALESCE(player1_id, v_match.winner_id),
          player2_id = CASE 
            WHEN player1_id IS NULL THEN player2_id
            WHEN player2_id IS NULL THEN v_match.winner_id
            ELSE player2_id
          END,
          updated_at = NOW()
      WHERE id = v_next_match_id;
      
      v_winner_advanced := TRUE;
    END IF;
    
    -- Loser is eliminated in loser bracket
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'bracket_type', v_match.bracket_type,
    'winner_id', v_match.winner_id,
    'loser_id', v_loser_id,
    'winner_advanced', v_winner_advanced,
    'loser_placed', v_loser_placed
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Advancement failed: %s', SQLERRM),
      'match_id', p_match_id
    );
END;
$function$;

-- Now run the comprehensive fix on giai4 tournament
SELECT public.fix_double_elimination_comprehensive(
  (SELECT id FROM tournaments WHERE name ILIKE '%giai4%' ORDER BY created_at DESC LIMIT 1)
) as fix_result;