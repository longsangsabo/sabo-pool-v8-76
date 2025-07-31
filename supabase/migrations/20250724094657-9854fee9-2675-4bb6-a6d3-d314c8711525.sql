-- Comprehensive Double Elimination Tournament Fix
-- Phase 1: Clean up duplicate players and reset invalid data

-- Function to fix double elimination tournament progression comprehensively
CREATE OR REPLACE FUNCTION public.fix_double_elimination_comprehensive(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
  v_winners_advanced INTEGER := 0;
  v_losers_advanced INTEGER := 0;
  v_fixed_matches INTEGER := 0;
  v_match RECORD;
  v_next_match RECORD;
  v_loser_match RECORD;
BEGIN
  -- Step 1: Remove duplicate players from matches (keep only first occurrence)
  WITH duplicate_players AS (
    SELECT 
      tm1.id as match_to_clear,
      tm1.round_number,
      tm1.match_number,
      tm1.bracket_type
    FROM tournament_matches tm1
    JOIN tournament_matches tm2 ON tm1.tournament_id = tm2.tournament_id
    WHERE tm1.tournament_id = p_tournament_id
      AND tm1.id != tm2.id
      AND (
        (tm1.player1_id = tm2.player1_id AND tm1.player1_id IS NOT NULL) OR
        (tm1.player1_id = tm2.player2_id AND tm1.player1_id IS NOT NULL) OR
        (tm1.player2_id = tm2.player1_id AND tm1.player2_id IS NOT NULL) OR
        (tm1.player2_id = tm2.player2_id AND tm1.player2_id IS NOT NULL)
      )
      AND tm1.status != 'completed'
      AND tm1.created_at > tm2.created_at
  )
  UPDATE tournament_matches 
  SET player1_id = NULL, player2_id = NULL, status = 'pending'
  WHERE id IN (SELECT match_to_clear FROM duplicate_players);

  GET DIAGNOSTICS v_fixed_matches = ROW_COUNT;

  -- Step 2: Advance winners from completed Winner's Round 1 matches to Winner's Round 2
  FOR v_match IN
    SELECT id, winner_id, player1_id, player2_id, match_number
    FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
      AND bracket_type = 'winners'
      AND round_number = 1
      AND status = 'completed'
      AND winner_id IS NOT NULL
  LOOP
    -- Find corresponding WR2 match
    SELECT * INTO v_next_match
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND bracket_type = 'winners'
      AND round_number = 2
      AND match_number = CEIL(v_match.match_number::numeric / 2)
      AND (player1_id IS NULL OR player2_id IS NULL);

    IF FOUND THEN
      -- Place winner in next round
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_match.winner_id, updated_at = NOW()
        WHERE id = v_next_match.id;
      ELSIF v_next_match.player2_id IS NULL THEN
        UPDATE tournament_matches 
        SET player2_id = v_match.winner_id, updated_at = NOW()
        WHERE id = v_next_match.id;
      END IF;
      
      v_winners_advanced := v_winners_advanced + 1;
    END IF;
  END LOOP;

  -- Step 3: Advance losers from completed Winner's Round 1 matches to Loser's Branch A
  FOR v_match IN
    SELECT id, winner_id, player1_id, player2_id, match_number
    FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
      AND bracket_type = 'winners'
      AND round_number = 1
      AND status = 'completed'
      AND winner_id IS NOT NULL
  LOOP
    -- Determine loser
    DECLARE
      v_loser_id UUID;
    BEGIN
      v_loser_id := CASE 
        WHEN v_match.winner_id = v_match.player1_id THEN v_match.player2_id
        ELSE v_match.player1_id
      END;

      -- Find corresponding Loser's Branch A match
      SELECT * INTO v_loser_match
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
        AND bracket_type = 'losers'
        AND branch_type = 'A'
        AND round_number = 1
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number ASC
      LIMIT 1;

      IF FOUND AND v_loser_id IS NOT NULL THEN
        -- Place loser in loser bracket
        IF v_loser_match.player1_id IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = v_loser_id, updated_at = NOW()
          WHERE id = v_loser_match.id;
        ELSIF v_loser_match.player2_id IS NULL THEN
          UPDATE tournament_matches 
          SET player2_id = v_loser_id, updated_at = NOW()
          WHERE id = v_loser_match.id;
        END IF;
        
        v_losers_advanced := v_losers_advanced + 1;
      END IF;
    END;
  END LOOP;

  -- Step 4: Enable matches that now have both players
  UPDATE tournament_matches 
  SET status = 'scheduled'
  WHERE tournament_id = p_tournament_id
    AND player1_id IS NOT NULL 
    AND player2_id IS NOT NULL
    AND status = 'pending';

  -- Return comprehensive result
  v_result := jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'duplicate_matches_fixed', v_fixed_matches,
    'winners_advanced', v_winners_advanced,
    'losers_advanced', v_losers_advanced,
    'message', format('Fixed %s duplicate matches, advanced %s winners and %s losers', 
                      v_fixed_matches, v_winners_advanced, v_losers_advanced),
    'timestamp', NOW()
  );

  -- Log the comprehensive fix
  INSERT INTO tournament_automation_log (
    tournament_id, automation_type, status, details, completed_at
  ) VALUES (
    p_tournament_id, 'comprehensive_fix', 'completed', v_result, NOW()
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournament_id', p_tournament_id
    );
END;
$$;

-- Enhanced auto-advancement function for double elimination
CREATE OR REPLACE FUNCTION public.advance_winner_simplified(p_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_tournament RECORD;
  v_winner_advanced BOOLEAN := FALSE;
  v_loser_placed BOOLEAN := FALSE;
  v_next_match RECORD;
  v_loser_match RECORD;
  v_loser_id UUID;
  v_result JSONB;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF NOT FOUND OR v_match.winner_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Match not found or no winner set');
  END IF;

  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = v_match.tournament_id;

  -- Determine loser
  v_loser_id := CASE 
    WHEN v_match.winner_id = v_match.player1_id THEN v_match.player2_id
    ELSE v_match.player1_id
  END;

  -- WINNER ADVANCEMENT LOGIC
  IF v_match.bracket_type = 'winners' THEN
    -- Find next winner's bracket match
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
        SET player1_id = v_match.winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match.id;
        v_winner_advanced := TRUE;
      ELSIF v_next_match.player2_id IS NULL THEN
        UPDATE tournament_matches 
        SET player2_id = v_match.winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match.id;
        v_winner_advanced := TRUE;
      END IF;
    END IF;

    -- LOSER PLACEMENT LOGIC for Winner's Bracket
    IF v_loser_id IS NOT NULL THEN
      -- Determine which loser bracket to place into
      IF v_match.round_number = 1 THEN
        -- WR1 losers go to Loser's Branch A Round 1
        SELECT * INTO v_loser_match
        FROM tournament_matches
        WHERE tournament_id = v_match.tournament_id
          AND bracket_type = 'losers'
          AND branch_type = 'A'
          AND round_number = 1
          AND (player1_id IS NULL OR player2_id IS NULL)
        ORDER BY match_number ASC
        LIMIT 1;
      ELSE
        -- WR2+ losers go to appropriate Loser's Branch B positions
        SELECT * INTO v_loser_match
        FROM tournament_matches
        WHERE tournament_id = v_match.tournament_id
          AND bracket_type = 'losers'
          AND branch_type = 'B'
          AND (player1_id IS NULL OR player2_id IS NULL)
        ORDER BY round_number ASC, match_number ASC
        LIMIT 1;
      END IF;

      IF FOUND THEN
        -- Place loser
        IF v_loser_match.player1_id IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = v_loser_id, status = 'scheduled', updated_at = NOW()
          WHERE id = v_loser_match.id;
          v_loser_placed := TRUE;
        ELSIF v_loser_match.player2_id IS NULL THEN
          UPDATE tournament_matches 
          SET player2_id = v_loser_id, status = 'scheduled', updated_at = NOW()
          WHERE id = v_loser_match.id;
          v_loser_placed := TRUE;
        END IF;
      END IF;
    END IF;

  ELSIF v_match.bracket_type = 'losers' THEN
    -- Loser's bracket advancement
    SELECT * INTO v_next_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'losers'
      AND round_number = v_match.round_number + 1
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number ASC
    LIMIT 1;

    IF FOUND THEN
      -- Place winner in next loser match
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_match.winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match.id;
        v_winner_advanced := TRUE;
      ELSIF v_next_match.player2_id IS NULL THEN
        UPDATE tournament_matches 
        SET player2_id = v_match.winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match.id;
        v_winner_advanced := TRUE;
      END IF;
    ELSE
      -- Check if this is loser bracket final and winner should go to grand final
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'final'
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY round_number ASC
      LIMIT 1;

      IF FOUND THEN
        IF v_next_match.player1_id IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = v_match.winner_id, status = 'scheduled', updated_at = NOW()
          WHERE id = v_next_match.id;
          v_winner_advanced := TRUE;
        ELSIF v_next_match.player2_id IS NULL THEN
          UPDATE tournament_matches 
          SET player2_id = v_match.winner_id, status = 'scheduled', updated_at = NOW()
          WHERE id = v_next_match.id;
          v_winner_advanced := TRUE;
        END IF;
      END IF;
    END IF;
  END IF;

  v_result := jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'bracket_type', v_match.bracket_type,
    'winner_id', v_match.winner_id,
    'loser_id', v_loser_id,
    'winner_advanced', v_winner_advanced,
    'loser_placed', v_loser_placed,
    'timestamp', NOW()
  );

  -- Log the advancement
  INSERT INTO tournament_automation_log (
    tournament_id, automation_type, status, details, completed_at
  ) VALUES (
    v_match.tournament_id, 'auto_winner_advancement', 'completed', v_result, NOW()
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'match_id', p_match_id
    );
END;
$$;

-- Create enhanced trigger for auto-advancement
DROP TRIGGER IF EXISTS trigger_auto_advance_winner_enhanced ON tournament_matches;

CREATE OR REPLACE FUNCTION public.trigger_auto_advance_winner_enhanced()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Only trigger when a winner is set and match completed
  IF NEW.status = 'completed' 
     AND NEW.winner_id IS NOT NULL 
     AND (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
    
    -- Call simplified advancement function
    BEGIN
      SELECT public.advance_winner_simplified(NEW.id) INTO v_result;
      RAISE NOTICE 'Auto-advancement result for match %: %', NEW.id, v_result;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to auto-advance for match %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_advance_winner_enhanced
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_advance_winner_enhanced();

-- Apply comprehensive fix to tournament giai4
SELECT public.fix_double_elimination_comprehensive('452d1608-2024-4bdf-9d05-c7e347ba289f');