-- Fix advance_tournament_winner function to handle match advancement correctly
CREATE OR REPLACE FUNCTION public.advance_tournament_winner(
  p_match_id UUID,
  p_winner_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_tournament RECORD;
  v_next_round INTEGER;
  v_max_round INTEGER;
  v_next_match_number INTEGER;
  v_next_match_id UUID;
  v_next_match_record RECORD;
  v_advancement_result JSONB;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = v_match.tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Update current match
  UPDATE tournament_matches 
  SET winner_id = p_winner_id, 
      status = 'completed',
      updated_at = NOW()
  WHERE id = p_match_id;
  
  -- For single elimination, advance to next round
  IF v_tournament.tournament_type = 'single_elimination' THEN
    v_next_round := v_match.round_number + 1;
    
    -- Get max round for tournament type
    SELECT CASE 
      WHEN v_tournament.max_participants <= 2 THEN 1
      WHEN v_tournament.max_participants <= 4 THEN 2  
      WHEN v_tournament.max_participants <= 8 THEN 3
      WHEN v_tournament.max_participants <= 16 THEN 4
      WHEN v_tournament.max_participants <= 32 THEN 5
      ELSE CEIL(LOG(2, v_tournament.max_participants))
    END INTO v_max_round;
    
    -- Only advance if not final round
    IF v_next_round <= v_max_round THEN
      -- Calculate next match number
      v_next_match_number := CEIL(v_match.match_number::NUMERIC / 2);
      
      -- Check if next round match exists
      SELECT * INTO v_next_match_record
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
      AND round_number = v_next_round 
      AND match_number = v_next_match_number;
      
      -- Create next match if it doesn't exist
      IF NOT FOUND THEN
        INSERT INTO tournament_matches (
          tournament_id, round_number, match_number,
          bracket_type, status, created_at, updated_at
        ) VALUES (
          v_match.tournament_id, v_next_round, v_next_match_number,
          'single', 'scheduled', NOW(), NOW()
        ) RETURNING id INTO v_next_match_id;
        
        -- Set winner as player1
        UPDATE tournament_matches 
        SET player1_id = p_winner_id, updated_at = NOW()
        WHERE id = v_next_match_id;
        
      ELSE
        v_next_match_id := v_next_match_record.id;
        -- Add winner to existing match
        IF v_next_match_record.player1_id IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = p_winner_id, updated_at = NOW()
          WHERE id = v_next_match_id;
        ELSIF v_next_match_record.player2_id IS NULL THEN
          UPDATE tournament_matches 
          SET player2_id = p_winner_id, updated_at = NOW()
          WHERE id = v_next_match_id;
        END IF;
      END IF;
    ELSE
      -- This was the final match, check if tournament is complete
      UPDATE tournaments 
      SET status = 'completed',
          completed_at = NOW(),
          updated_at = NOW()
      WHERE id = v_match.tournament_id;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'winner_id', p_winner_id,
    'next_round', v_next_round,
    'next_match_id', v_next_match_id,
    'tournament_completed', v_next_round > v_max_round
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to advance winner: ' || SQLERRM
    );
END;
$$;