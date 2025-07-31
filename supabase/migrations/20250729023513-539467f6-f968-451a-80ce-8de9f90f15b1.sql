-- Fix Double Elimination match status logic
-- Create function to properly update match status from pending to scheduled

CREATE OR REPLACE FUNCTION update_double_elimination_match_status(
  p_tournament_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_match RECORD;
BEGIN
  -- Update Round 1 matches - they should always be scheduled if they have both players
  UPDATE tournament_matches 
  SET status = 'scheduled'
  WHERE tournament_id = p_tournament_id 
    AND round_number = 1
    AND status = 'pending'
    AND player1_id IS NOT NULL 
    AND player2_id IS NOT NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- For subsequent rounds, check if prerequisites are met
  FOR v_match IN
    SELECT id, round_number, match_number, bracket_type, player1_id, player2_id
    FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
      AND status = 'pending'
      AND round_number > 1
    ORDER BY round_number, match_number
  LOOP
    -- Check if this match can be made available
    -- For winners bracket: previous round matches feeding into this match should be completed
    -- For losers bracket: more complex logic based on bracket structure
    
    IF v_match.bracket_type IN ('winner', 'winners') THEN
      -- For winners bracket, check if feeding matches are completed
      IF EXISTS (
        SELECT 1 FROM tournament_matches tm
        WHERE tm.tournament_id = p_tournament_id
          AND tm.bracket_type IN ('winner', 'winners')
          AND tm.round_number = v_match.round_number - 1
          AND tm.status = 'completed'
          AND tm.winner_id IS NOT NULL
          AND (
            -- This match feeds into our target match
            (tm.match_number * 2 - 1 = v_match.match_number) OR
            (tm.match_number * 2 = v_match.match_number)
          )
      ) THEN
        -- Check if we have both players assigned
        IF v_match.player1_id IS NOT NULL AND v_match.player2_id IS NOT NULL THEN
          UPDATE tournament_matches 
          SET status = 'scheduled'
          WHERE id = v_match.id;
          v_updated_count := v_updated_count + 1;
        END IF;
      END IF;
      
    ELSIF v_match.bracket_type IN ('loser', 'losers') THEN
      -- For losers bracket, if both players are assigned, make it scheduled
      IF v_match.player1_id IS NOT NULL AND v_match.player2_id IS NOT NULL THEN
        UPDATE tournament_matches 
        SET status = 'scheduled'
        WHERE id = v_match.id;
        v_updated_count := v_updated_count + 1;
      END IF;
      
    ELSE
      -- For final/semifinal matches, if both players assigned, make scheduled
      IF v_match.player1_id IS NOT NULL AND v_match.player2_id IS NOT NULL THEN
        UPDATE tournament_matches 
        SET status = 'scheduled'
        WHERE id = v_match.id;
        v_updated_count := v_updated_count + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'updated_matches', v_updated_count,
    'message', format('Updated %s matches from pending to scheduled', v_updated_count)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'updated_matches', v_updated_count
    );
END;
$$;