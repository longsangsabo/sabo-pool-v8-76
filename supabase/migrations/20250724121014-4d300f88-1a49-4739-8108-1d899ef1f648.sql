-- Comprehensive Double Elimination Fix
-- This migration completely overhauls the double elimination system to fix all identified issues

-- Step 1: Drop existing problematic functions and triggers
DROP FUNCTION IF EXISTS public.advance_double_elimination_winner_branched(UUID);
DROP FUNCTION IF EXISTS public.advance_double_elimination_winner_comprehensive(UUID);
DROP FUNCTION IF EXISTS public.generate_double_elimination_bracket_complete(UUID);
DROP TRIGGER IF EXISTS trigger_auto_advance_winner ON public.tournament_matches;
DROP TRIGGER IF EXISTS notify_winner_advancement_trigger ON public.tournament_matches;

-- Step 2: Create comprehensive double elimination bracket generator
CREATE OR REPLACE FUNCTION public.generate_double_elimination_bracket_complete(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_participants UUID[];
  v_participant_count INTEGER;
  v_bracket_size INTEGER;
  v_winners_rounds INTEGER;
  v_losers_rounds INTEGER;
  v_match_counter INTEGER := 1;
  v_round INTEGER;
  v_match_in_round INTEGER;
  v_player1_id UUID;
  v_player2_id UUID;
BEGIN
  -- Get confirmed participants ordered by registration
  SELECT array_agg(tr.user_id ORDER BY tr.created_at)
  INTO v_participants
  FROM tournament_registrations tr
  WHERE tr.tournament_id = p_tournament_id 
    AND tr.registration_status = 'confirmed';

  v_participant_count := array_length(v_participants, 1);
  
  IF v_participant_count < 2 THEN
    RETURN jsonb_build_object('error', 'Need at least 2 participants');
  END IF;

  -- Calculate bracket structure
  v_bracket_size := 2;
  WHILE v_bracket_size < v_participant_count LOOP
    v_bracket_size := v_bracket_size * 2;
  END LOOP;

  v_winners_rounds := CEIL(LOG(2, v_bracket_size));
  v_losers_rounds := (v_winners_rounds - 1) * 2;

  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;

  -- Generate Winners Bracket matches
  FOR v_round IN 1..v_winners_rounds LOOP
    FOR v_match_in_round IN 1..(v_bracket_size / (2^v_round)) LOOP
      v_player1_id := NULL;
      v_player2_id := NULL;
      
      -- First round gets actual participants
      IF v_round = 1 THEN
        v_player1_id := v_participants[(v_match_in_round - 1) * 2 + 1];
        IF (v_match_in_round - 1) * 2 + 2 <= v_participant_count THEN
          v_player2_id := v_participants[(v_match_in_round - 1) * 2 + 2];
        END IF;
      END IF;

      INSERT INTO tournament_matches (
        id, tournament_id, round_number, match_number, 
        player1_id, player2_id, bracket_type, 
        status, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), p_tournament_id, v_round, v_match_counter,
        v_player1_id, v_player2_id, 'winners',
        CASE WHEN v_round = 1 AND v_player2_id IS NOT NULL THEN 'scheduled' ELSE 'waiting' END,
        NOW(), NOW()
      );
      
      v_match_counter := v_match_counter + 1;
    END LOOP;
  END LOOP;

  -- Generate Losers Bracket matches (ALL EMPTY initially)
  FOR v_round IN 1..v_losers_rounds LOOP
    FOR v_match_in_round IN 1..(
      CASE 
        WHEN v_round % 2 = 1 THEN v_bracket_size / (2^((v_round + 1) / 2 + 1))
        ELSE v_bracket_size / (2^(v_round / 2 + 1))
      END
    ) LOOP
      INSERT INTO tournament_matches (
        id, tournament_id, round_number, match_number, 
        player1_id, player2_id, bracket_type, 
        status, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), p_tournament_id, v_round, v_match_counter,
        NULL, NULL, 'losers',
        'waiting', NOW(), NOW()
      );
      
      v_match_counter := v_match_counter + 1;
    END LOOP;
  END LOOP;

  -- Generate Grand Final
  INSERT INTO tournament_matches (
    id, tournament_id, round_number, match_number, 
    player1_id, player2_id, bracket_type, 
    status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_tournament_id, v_winners_rounds + 1, v_match_counter,
    NULL, NULL, 'grand_final',
    'waiting', NOW(), NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'participant_count', v_participant_count,
    'total_matches', v_match_counter,
    'winners_rounds', v_winners_rounds,
    'losers_rounds', v_losers_rounds
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Step 3: Create comprehensive advancement function
CREATE OR REPLACE FUNCTION public.advance_double_elimination_winner_comprehensive(p_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_match RECORD;
  v_winner_id UUID;
  v_loser_id UUID;
  v_next_match_id UUID;
  v_losers_match_id UUID;
  v_winner_advanced BOOLEAN := FALSE;
  v_loser_placed BOOLEAN := FALSE;
  v_tournament_structure RECORD;
BEGIN
  -- Get match details
  SELECT * INTO v_match
  FROM tournament_matches 
  WHERE id = p_match_id AND status = 'completed' AND winner_id IS NOT NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found or not completed');
  END IF;

  v_winner_id := v_match.winner_id;
  v_loser_id := CASE WHEN v_match.player1_id = v_winner_id THEN v_match.player2_id ELSE v_match.player1_id END;

  -- Get tournament structure info
  SELECT 
    MAX(CASE WHEN bracket_type = 'winners' THEN round_number END) as max_winners_round,
    MAX(CASE WHEN bracket_type = 'losers' THEN round_number END) as max_losers_round
  INTO v_tournament_structure
  FROM tournament_matches 
  WHERE tournament_id = v_match.tournament_id;

  -- Handle Winners Bracket advancement
  IF v_match.bracket_type = 'winners' THEN
    -- Advance winner to next winners round (if not final)
    IF v_match.round_number < v_tournament_structure.max_winners_round THEN
      SELECT tm.id INTO v_next_match_id
      FROM tournament_matches tm
      WHERE tm.tournament_id = v_match.tournament_id
        AND tm.bracket_type = 'winners'
        AND tm.round_number = v_match.round_number + 1
        AND tm.match_number = CEIL(v_match.match_number::NUMERIC / 2)
        AND (tm.player1_id IS NULL OR tm.player2_id IS NULL);

      IF v_next_match_id IS NOT NULL THEN
        -- Determine position based on match number
        IF v_match.match_number % 2 = 1 THEN
          UPDATE tournament_matches 
          SET player1_id = v_winner_id, 
              status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'waiting' END,
              updated_at = NOW()
          WHERE id = v_next_match_id AND player1_id IS NULL;
        ELSE
          UPDATE tournament_matches 
          SET player2_id = v_winner_id,
              status = CASE WHEN player1_id IS NOT NULL THEN 'scheduled' ELSE 'waiting' END,
              updated_at = NOW()
          WHERE id = v_next_match_id AND player2_id IS NULL;
        END IF;
        
        v_winner_advanced := TRUE;
      END IF;
    ELSE
      -- Winner goes to Grand Final
      SELECT tm.id INTO v_next_match_id
      FROM tournament_matches tm
      WHERE tm.tournament_id = v_match.tournament_id
        AND tm.bracket_type = 'grand_final'
        AND tm.player1_id IS NULL;
        
      IF v_next_match_id IS NOT NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, updated_at = NOW()
        WHERE id = v_next_match_id;
        v_winner_advanced := TRUE;
      END IF;
    END IF;

    -- Place loser in Losers Bracket
    IF v_loser_id IS NOT NULL THEN
      -- Losers from winners round N go to losers round (2*N - 1)
      SELECT tm.id INTO v_losers_match_id
      FROM tournament_matches tm
      WHERE tm.tournament_id = v_match.tournament_id
        AND tm.bracket_type = 'losers'
        AND tm.round_number = (2 * v_match.round_number - 1)
        AND (tm.player1_id IS NULL OR tm.player2_id IS NULL)
        AND NOT (tm.player1_id = v_loser_id OR tm.player2_id = v_loser_id)
      ORDER BY tm.match_number
      LIMIT 1;

      IF v_losers_match_id IS NOT NULL THEN
        IF (SELECT player1_id FROM tournament_matches WHERE id = v_losers_match_id) IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = v_loser_id,
              status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'waiting' END,
              updated_at = NOW()
          WHERE id = v_losers_match_id;
        ELSE
          UPDATE tournament_matches 
          SET player2_id = v_loser_id,
              status = 'scheduled',
              updated_at = NOW()
          WHERE id = v_losers_match_id AND player2_id IS NULL;
        END IF;
        
        v_loser_placed := TRUE;
      END IF;
    END IF;

  -- Handle Losers Bracket advancement
  ELSIF v_match.bracket_type = 'losers' THEN
    -- Check if this is the final losers match
    IF v_match.round_number = v_tournament_structure.max_losers_round THEN
      -- Winner goes to Grand Final as player2
      SELECT tm.id INTO v_next_match_id
      FROM tournament_matches tm
      WHERE tm.tournament_id = v_match.tournament_id
        AND tm.bracket_type = 'grand_final'
        AND tm.player2_id IS NULL;
        
      IF v_next_match_id IS NOT NULL THEN
        UPDATE tournament_matches 
        SET player2_id = v_winner_id,
            status = CASE WHEN player1_id IS NOT NULL THEN 'scheduled' ELSE 'waiting' END,
            updated_at = NOW()
        WHERE id = v_next_match_id;
        v_winner_advanced := TRUE;
      END IF;
    ELSE
      -- Advance to next losers round
      SELECT tm.id INTO v_next_match_id
      FROM tournament_matches tm
      WHERE tm.tournament_id = v_match.tournament_id
        AND tm.bracket_type = 'losers'
        AND tm.round_number = v_match.round_number + 1
        AND (tm.player1_id IS NULL OR tm.player2_id IS NULL)
      ORDER BY tm.match_number
      LIMIT 1;

      IF v_next_match_id IS NOT NULL THEN
        IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = v_winner_id,
              status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'waiting' END,
              updated_at = NOW()
          WHERE id = v_next_match_id;
        ELSE
          UPDATE tournament_matches 
          SET player2_id = v_winner_id,
              status = 'scheduled',
              updated_at = NOW()
          WHERE id = v_next_match_id AND player2_id IS NULL;
        END IF;
        
        v_winner_advanced := TRUE;
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'match_id', p_match_id,
    'bracket_type', v_match.bracket_type,
    'winner_id', v_winner_id,
    'loser_id', v_loser_id,
    'winner_advanced', v_winner_advanced,
    'loser_placed', v_loser_placed,
    'next_match', v_next_match_id,
    'losers_match', v_losers_match_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Step 4: Create repair function for existing tournaments
CREATE OR REPLACE FUNCTION public.repair_double_elimination_tournament(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_completed_matches RECORD;
  v_repair_result JSONB;
  v_advancement_result JSONB;
  v_fixed_count INTEGER := 0;
BEGIN
  -- Clear all duplicate players from Losers Bracket
  UPDATE tournament_matches 
  SET player1_id = NULL, player2_id = NULL, status = 'waiting', updated_at = NOW()
  WHERE tournament_id = p_tournament_id 
    AND bracket_type = 'losers';
    
  -- Clear Grand Final
  UPDATE tournament_matches 
  SET player1_id = NULL, player2_id = NULL, status = 'waiting', updated_at = NOW()
  WHERE tournament_id = p_tournament_id 
    AND bracket_type = 'grand_final';

  -- Process all completed matches in order
  FOR v_completed_matches IN
    SELECT id, bracket_type, round_number, match_number
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND status = 'completed'
      AND winner_id IS NOT NULL
    ORDER BY bracket_type DESC, round_number ASC, match_number ASC
  LOOP
    -- Re-advance each completed match
    SELECT public.advance_double_elimination_winner_comprehensive(v_completed_matches.id) INTO v_advancement_result;
    
    IF (v_advancement_result->>'success')::boolean THEN
      v_fixed_count := v_fixed_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'matches_reprocessed', v_fixed_count,
    'message', 'Tournament repaired successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Step 5: Recreate auto-advancement triggers
CREATE OR REPLACE FUNCTION public.trigger_auto_advance_winner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Only trigger when a winner is set and match is completed
  IF NEW.status = 'completed' 
     AND NEW.winner_id IS NOT NULL 
     AND (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
    
    -- Log the automatic advancement
    INSERT INTO tournament_automation_log (
      tournament_id, automation_type, status, details, created_at
    ) VALUES (
      NEW.tournament_id, 'auto_winner_advancement', 'started',
      jsonb_build_object('match_id', NEW.id, 'winner_id', NEW.winner_id),
      NOW()
    );
    
    -- Call the advancement function
    BEGIN
      SELECT public.advance_double_elimination_winner_comprehensive(NEW.id) INTO v_result;
      
      -- Log success
      INSERT INTO tournament_automation_log (
        tournament_id, automation_type, status, details, completed_at
      ) VALUES (
        NEW.tournament_id, 'auto_winner_advancement', 'completed',
        jsonb_build_object('match_id', NEW.id, 'result', v_result),
        NOW()
      );
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log failure
        INSERT INTO tournament_automation_log (
          tournament_id, automation_type, status, error_message
        ) VALUES (
          NEW.tournament_id, 'auto_winner_advancement', 'failed', SQLERRM
        );
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER trigger_auto_advance_winner
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_advance_winner();

-- Step 6: Create winner advancement notification trigger
CREATE TRIGGER notify_winner_advancement_trigger
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION notify_winner_advancement();