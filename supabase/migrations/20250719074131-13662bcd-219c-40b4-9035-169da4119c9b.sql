-- Create comprehensive double elimination advancement function and update trigger
-- This creates a separate function for double elimination while keeping single elimination logic intact

-- 1. Create the main double elimination advancement function
CREATE OR REPLACE FUNCTION public.advance_double_elimination_tournament(p_match_id uuid, p_winner_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_tournament RECORD;
  v_loser_id uuid;
  v_next_winner_match uuid;
  v_next_loser_match uuid;
  v_result jsonb := '{}';
BEGIN
  -- Get current match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Get tournament details  
  SELECT * INTO v_tournament FROM tournaments WHERE id = v_match.tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Determine loser
  IF p_winner_id = v_match.player1_id THEN
    v_loser_id := v_match.player2_id;
  ELSE
    v_loser_id := v_match.player1_id;
  END IF;
  
  -- Handle progression based on bracket type
  IF v_match.bracket_type = 'winner' THEN
    -- WINNER BRACKET: Winner advances to next winner bracket round, loser goes to loser bracket
    
    -- Find next winner bracket match
    SELECT id INTO v_next_winner_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
    AND bracket_type = 'winner'
    AND round_number = v_match.round_number + 1
    AND (
      (v_match.match_number <= 2 AND match_number = 1) OR
      (v_match.match_number > 2 AND match_number = CEIL(v_match.match_number / 2.0))
    )
    AND (player1_id IS NULL OR player2_id IS NULL)
    LIMIT 1;
    
    -- Advance winner to winner bracket
    IF v_next_winner_match IS NOT NULL THEN
      UPDATE tournament_matches 
      SET 
        player1_id = CASE WHEN player1_id IS NULL THEN p_winner_id ELSE player1_id END,
        player2_id = CASE WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN p_winner_id ELSE player2_id END,
        updated_at = now()
      WHERE id = v_next_winner_match;
      
      v_result := v_result || jsonb_build_object('winner_advanced_to', v_next_winner_match);
    END IF;
    
    -- Find appropriate loser bracket match for loser
    SELECT id INTO v_next_loser_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
    AND bracket_type = 'loser'
    AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY round_number ASC, match_number ASC
    LIMIT 1;
    
    -- Move loser to loser bracket
    IF v_next_loser_match IS NOT NULL THEN
      UPDATE tournament_matches 
      SET 
        player1_id = CASE WHEN player1_id IS NULL THEN v_loser_id ELSE player1_id END,
        player2_id = CASE WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN v_loser_id ELSE player2_id END,
        updated_at = now()
      WHERE id = v_next_loser_match;
      
      v_result := v_result || jsonb_build_object('loser_moved_to_loser_bracket', v_next_loser_match);
    END IF;
    
  ELSIF v_match.bracket_type = 'loser' THEN
    -- LOSER BRACKET: Winner advances in loser bracket, loser is eliminated
    
    -- Find next loser bracket match
    SELECT id INTO v_next_loser_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
    AND bracket_type = 'loser'
    AND round_number = v_match.round_number + 1
    AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number ASC
    LIMIT 1;
    
    -- Advance winner in loser bracket
    IF v_next_loser_match IS NOT NULL THEN
      UPDATE tournament_matches 
      SET 
        player1_id = CASE WHEN player1_id IS NULL THEN p_winner_id ELSE player1_id END,
        player2_id = CASE WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN p_winner_id ELSE player2_id END,
        updated_at = now()
      WHERE id = v_next_loser_match;
      
      v_result := v_result || jsonb_build_object('winner_advanced_in_loser_bracket', v_next_loser_match);
    ELSE
      -- Check if this creates the Grand Final situation
      DECLARE
        v_winner_bracket_champion uuid;
        v_grand_final_match uuid;
      BEGIN
        -- Get winner bracket champion
        SELECT winner_id INTO v_winner_bracket_champion
        FROM tournament_matches
        WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'winner'
        AND round_number = (
          SELECT MAX(round_number) FROM tournament_matches 
          WHERE tournament_id = v_match.tournament_id AND bracket_type = 'winner'
        )
        AND status = 'completed'
        LIMIT 1;
        
        -- Create or update grand final match
        IF v_winner_bracket_champion IS NOT NULL THEN
          SELECT id INTO v_grand_final_match
          FROM tournament_matches
          WHERE tournament_id = v_match.tournament_id
          AND bracket_type = 'final'
          LIMIT 1;
          
          IF v_grand_final_match IS NOT NULL THEN
            UPDATE tournament_matches
            SET 
              player1_id = v_winner_bracket_champion,
              player2_id = p_winner_id,
              status = 'scheduled',
              updated_at = now()
            WHERE id = v_grand_final_match;
            
            v_result := v_result || jsonb_build_object('grand_final_created', v_grand_final_match);
          END IF;
        END IF;
      END;
    END IF;
    
    -- Loser is eliminated (no further action needed)
    v_result := v_result || jsonb_build_object('player_eliminated', v_loser_id);
    
  ELSIF v_match.bracket_type = 'final' THEN
    -- GRAND FINAL: Tournament is complete
    UPDATE tournaments 
    SET 
      status = 'completed',
      completed_at = now(),
      updated_at = now()
    WHERE id = v_match.tournament_id;
    
    v_result := v_result || jsonb_build_object('tournament_completed', true, 'champion', p_winner_id);
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_id', p_winner_id,
    'bracket_type', v_match.bracket_type,
    'round_number', v_match.round_number,
    'advancement_details', v_result
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to advance double elimination: ' || SQLERRM,
      'match_id', p_match_id
    );
END;
$$;

-- 2. Update the trigger function to handle both tournament types
CREATE OR REPLACE FUNCTION public.trigger_advance_tournament_winner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSONB;
  v_tournament_type TEXT;
BEGIN
  -- Only trigger on matches that have been completed with a winner
  -- And the winner was just set (changed from NULL or different winner)
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND 
     (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
    
    -- Get tournament type to determine which function to call
    SELECT tournament_type INTO v_tournament_type
    FROM public.tournaments
    WHERE id = NEW.tournament_id;
    
    -- Log the trigger execution
    RAISE NOTICE 'Auto-advancing winner % for match % in tournament % (type: %)', 
      NEW.winner_id, NEW.id, NEW.tournament_id, v_tournament_type;
    
    -- Call appropriate advancement function based on tournament type
    IF v_tournament_type = 'double_elimination' THEN
      -- Call double elimination function
      SELECT public.advance_double_elimination_tournament(NEW.id, NEW.winner_id) INTO v_result;
    ELSE
      -- Call single elimination function (default for all other types)
      SELECT public.advance_tournament_winner(NEW.id, NEW.winner_id) INTO v_result;
    END IF;
    
    -- Log the result for debugging
    RAISE NOTICE 'Advancement result: %', v_result;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Recreate the triggers to use the updated function
DROP TRIGGER IF EXISTS trigger_auto_advance_winner ON public.tournament_matches;
CREATE TRIGGER trigger_auto_advance_winner
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_advance_tournament_winner();

DROP TRIGGER IF EXISTS trigger_auto_advance_on_score_update ON public.tournament_matches;
CREATE TRIGGER trigger_auto_advance_on_score_update
  AFTER UPDATE OF score_player1, score_player2, winner_id, status ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_advance_tournament_winner();