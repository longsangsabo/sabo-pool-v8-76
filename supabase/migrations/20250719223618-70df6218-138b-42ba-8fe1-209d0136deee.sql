-- Drop existing conflicting functions
DROP FUNCTION IF EXISTS public.advance_double_elimination_winner(uuid);
DROP FUNCTION IF EXISTS public.advance_double_elimination_winner(uuid, uuid);
DROP FUNCTION IF EXISTS public.advance_double_elimination_winner(uuid, uuid, uuid);

-- Create improved double elimination advancement function
CREATE OR REPLACE FUNCTION public.advance_double_elimination_winner(p_match_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_match RECORD;
  v_tournament RECORD;
  v_winner_id uuid;
  v_loser_id uuid;
  v_next_winner_match_id uuid;
  v_next_loser_match_id uuid;
BEGIN
  -- Get current match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;
  
  IF v_match.status != 'completed' OR v_match.winner_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not completed or no winner');
  END IF;
  
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = v_match.tournament_id;
  
  -- Determine winner and loser
  v_winner_id := v_match.winner_id;
  v_loser_id := CASE 
    WHEN v_match.winner_id = v_match.player1_id THEN v_match.player2_id
    ELSE v_match.player1_id
  END;
  
  -- Winner Bracket Logic
  IF v_match.bracket_type = 'winner' THEN
    
    -- Advance winner to next winner bracket round
    SELECT id INTO v_next_winner_match_id
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'winner'
      AND round_number = v_match.round_number + 1
      AND match_number = CEIL(v_match.match_number::numeric / 2);
    
    IF v_next_winner_match_id IS NOT NULL THEN
      -- Determine which player slot to fill
      IF v_match.match_number % 2 = 1 THEN
        -- Odd match numbers go to player1
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, 
            status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
            updated_at = NOW()
        WHERE id = v_next_winner_match_id;
      ELSE
        -- Even match numbers go to player2
        UPDATE tournament_matches 
        SET player2_id = v_winner_id,
            status = CASE WHEN player1_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
            updated_at = NOW()
        WHERE id = v_next_winner_match_id;
      END IF;
    END IF;
    
    -- Send loser to appropriate loser bracket position
    IF v_match.round_number = 1 THEN
      -- WB Round 1 losers go directly to Loser Round 1
      SELECT id INTO v_next_loser_match_id
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'loser'
        AND round_number = 1
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
      
      IF v_next_loser_match_id IS NOT NULL THEN
        UPDATE tournament_matches 
        SET player1_id = COALESCE(player1_id, v_loser_id),
            player2_id = CASE WHEN player1_id IS NOT NULL THEN v_loser_id ELSE player2_id END,
            status = CASE WHEN player1_id IS NOT NULL AND player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
            updated_at = NOW()
        WHERE id = v_next_loser_match_id;
      END IF;
      
    ELSIF v_match.round_number = 2 THEN
      -- WB Round 2 losers go to Loser Round 3 (after LB Round 2 completes)
      SELECT id INTO v_next_loser_match_id
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'loser'
        AND round_number = 3
        AND match_number = CEIL(v_match.match_number::numeric / 2)
        AND (player1_id IS NULL OR player2_id IS NULL);
      
      IF v_next_loser_match_id IS NOT NULL THEN
        UPDATE tournament_matches 
        SET player2_id = v_loser_id,  -- WB losers always go to player2 slot in LB
            status = CASE WHEN player1_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
            updated_at = NOW()
        WHERE id = v_next_loser_match_id;
      END IF;
      
    ELSIF v_match.round_number = 3 THEN
      -- WB Round 3 (semifinal) losers go to Grand Final as player2
      SELECT id INTO v_next_loser_match_id
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'final'
        AND round_number = 1;
      
      IF v_next_loser_match_id IS NOT NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id,  -- WB winner goes to player1
            status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
            updated_at = NOW()
        WHERE id = v_next_loser_match_id;
      END IF;
    END IF;
    
  -- Loser Bracket Logic
  ELSIF v_match.bracket_type = 'loser' THEN
    
    -- Advance winner within loser bracket
    SELECT id INTO v_next_loser_match_id
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'loser'
      AND round_number = v_match.round_number + 1
      AND match_number = CEIL(v_match.match_number::numeric / 2);
    
    -- If no next loser match, advance to Grand Final
    IF v_next_loser_match_id IS NULL THEN
      SELECT id INTO v_next_loser_match_id
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'final'
        AND round_number = 1;
      
      IF v_next_loser_match_id IS NOT NULL THEN
        UPDATE tournament_matches 
        SET player2_id = v_winner_id,  -- LB winner goes to player2
            status = CASE WHEN player1_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
            updated_at = NOW()
        WHERE id = v_next_loser_match_id;
      END IF;
    ELSE
      -- Advance to next loser bracket match
      UPDATE tournament_matches 
      SET player1_id = COALESCE(player1_id, v_winner_id),
          player2_id = CASE WHEN player1_id IS NOT NULL THEN v_winner_id ELSE player2_id END,
          status = CASE WHEN player1_id IS NOT NULL AND player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
          updated_at = NOW()
      WHERE id = v_next_loser_match_id;
    END IF;
    
    -- Loser is eliminated (no further action needed)
    
  -- Grand Final Logic  
  ELSIF v_match.bracket_type = 'final' THEN
    
    -- Check if loser bracket winner won the first grand final
    IF v_match.round_number = 1 AND v_winner_id = v_match.player2_id THEN
      -- LB winner won, need Grand Final Reset
      INSERT INTO tournament_matches (
        tournament_id, round_number, match_number, bracket_type,
        player1_id, player2_id, status,
        created_at, updated_at
      ) VALUES (
        v_match.tournament_id, 2, 1, 'final',
        v_match.player1_id, v_match.player2_id, 'scheduled',
        NOW(), NOW()
      );
    ELSE
      -- Tournament is complete
      UPDATE tournaments 
      SET status = 'completed',
          completed_at = NOW(),
          updated_at = NOW()
      WHERE id = v_match.tournament_id;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Double elimination advancement completed successfully',
    'winner_advanced_to', v_next_winner_match_id,
    'loser_advanced_to', v_next_loser_match_id,
    'winner_id', v_winner_id,
    'loser_id', v_loser_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to advance double elimination: ' || SQLERRM
    );
END;
$function$;