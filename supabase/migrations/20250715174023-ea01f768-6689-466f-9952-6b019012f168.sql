-- Drop and recreate advance_tournament_winner function with proper tournament completion logic
DROP FUNCTION IF EXISTS public.advance_tournament_winner(uuid, uuid);

CREATE OR REPLACE FUNCTION public.advance_tournament_winner(
  p_match_id uuid,
  p_winner_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_match RECORD;
  v_tournament RECORD;
  v_next_round INTEGER;
  v_next_match_number INTEGER;
  v_max_round INTEGER;
  v_next_match_id UUID;
  v_third_place_match_id UUID;
  v_final_round INTEGER;
  v_semifinal_losers UUID[];
  v_tournament_complete BOOLEAN := false;
  v_final_match_complete BOOLEAN := false;
  v_third_place_match_complete BOOLEAN := false;
BEGIN
  -- Get current match details
  SELECT * INTO v_match
  FROM public.tournament_matches
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Get tournament details
  SELECT * INTO v_tournament
  FROM public.tournaments
  WHERE id = v_match.tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Validate winner is one of the players
  IF p_winner_id != v_match.player1_id AND p_winner_id != v_match.player2_id THEN
    RETURN jsonb_build_object('error', 'Winner must be one of the match players');
  END IF;
  
  -- Get max round number
  SELECT MAX(round_number) INTO v_max_round
  FROM public.tournament_matches
  WHERE tournament_id = v_match.tournament_id;
  
  -- Determine final round (considering third place match)
  v_final_round := v_max_round;
  IF v_tournament.tournament_type = 'single_elimination' AND COALESCE(v_tournament.has_third_place_match, true) THEN
    v_final_round := v_max_round - 1;
  END IF;
  
  -- Update current match first
  UPDATE public.tournament_matches
  SET winner_id = p_winner_id,
      status = 'completed',
      actual_end_time = now(),
      updated_at = now()
  WHERE id = p_match_id;
  
  -- Check if tournament is complete after this match
  -- Check if final match is complete
  SELECT COUNT(*) > 0 INTO v_final_match_complete
  FROM public.tournament_matches
  WHERE tournament_id = v_match.tournament_id
  AND round_number = v_final_round
  AND match_number = 1
  AND (is_third_place_match = false OR is_third_place_match IS NULL)
  AND status = 'completed'
  AND winner_id IS NOT NULL;
  
  -- Check if third place match is complete (if it exists)
  IF v_tournament.tournament_type = 'single_elimination' AND COALESCE(v_tournament.has_third_place_match, true) THEN
    SELECT COUNT(*) > 0 INTO v_third_place_match_complete
    FROM public.tournament_matches
    WHERE tournament_id = v_match.tournament_id
    AND round_number = v_max_round
    AND is_third_place_match = true
    AND status = 'completed'
    AND winner_id IS NOT NULL;
    
    -- Tournament is complete when both final and third place matches are done
    v_tournament_complete := v_final_match_complete AND v_third_place_match_complete;
  ELSE
    -- Tournament is complete when final match is done (no third place match)
    v_tournament_complete := v_final_match_complete;
  END IF;
  
  -- If tournament is complete, mark it as completed and return
  IF v_tournament_complete THEN
    UPDATE public.tournaments
    SET status = 'completed',
        updated_at = now()
    WHERE id = v_match.tournament_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Tournament completed',
      'tournament_complete', true
    );
  END IF;
  
  -- If this is the final match, don't create more matches
  IF v_match.round_number = v_final_round AND v_match.match_number = 1 THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Tournament final completed - waiting for third place match',
      'final_complete', true
    );
  END IF;
  
  -- If this is the third place match, don't create more matches
  IF v_match.is_third_place_match = true THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Third place match completed',
      'third_place_complete', true
    );
  END IF;
  
  -- Check if this completes the semi-finals and we need to create third place match
  IF v_match.round_number = (v_final_round - 1) AND v_tournament.tournament_type = 'single_elimination' 
     AND COALESCE(v_tournament.has_third_place_match, true) THEN
    
    -- Get semi-final losers
    SELECT ARRAY_AGG(
      CASE 
        WHEN winner_id = player1_id THEN player2_id
        WHEN winner_id = player2_id THEN player1_id
        ELSE NULL
      END
    ) INTO v_semifinal_losers
    FROM public.tournament_matches
    WHERE tournament_id = v_match.tournament_id
    AND round_number = (v_final_round - 1)
    AND winner_id IS NOT NULL;
    
    -- If we have both semi-final losers, create third place match
    IF array_length(v_semifinal_losers, 1) = 2 AND v_semifinal_losers[1] IS NOT NULL AND v_semifinal_losers[2] IS NOT NULL THEN
      -- Check if third place match doesn't already exist
      IF NOT EXISTS (
        SELECT 1 FROM public.tournament_matches 
        WHERE tournament_id = v_match.tournament_id 
        AND round_number = v_max_round 
        AND match_number = 2
        AND is_third_place_match = true
      ) THEN
        INSERT INTO public.tournament_matches (
          tournament_id,
          round_number,
          match_number,
          player1_id,
          player2_id,
          status,
          is_third_place_match,
          scheduled_time,
          created_at,
          updated_at
        ) VALUES (
          v_match.tournament_id,
          v_max_round,
          2,
          v_semifinal_losers[1],
          v_semifinal_losers[2],
          'scheduled',
          true,
          v_tournament.tournament_start,
          now(),
          now()
        ) RETURNING id INTO v_third_place_match_id;
      END IF;
    END IF;
  END IF;
  
  -- Only create next round matches if we're not in the final rounds
  IF v_match.round_number < v_final_round THEN
    -- Calculate next round for winner advancement
    v_next_round := v_match.round_number + 1;
    v_next_match_number := CEIL(v_match.match_number / 2.0);
    
    -- Find or create next match
    SELECT id INTO v_next_match_id
    FROM public.tournament_matches
    WHERE tournament_id = v_match.tournament_id
    AND round_number = v_next_round
    AND match_number = v_next_match_number
    AND (is_third_place_match = false OR is_third_place_match IS NULL);
    
    IF v_next_match_id IS NULL THEN
      -- Create next round match
      INSERT INTO public.tournament_matches (
        tournament_id,
        round_number,
        match_number,
        player1_id,
        player2_id,
        status,
        scheduled_time,
        created_at,
        updated_at
      ) VALUES (
        v_match.tournament_id,
        v_next_round,
        v_next_match_number,
        CASE WHEN v_match.match_number % 2 = 1 THEN p_winner_id ELSE NULL END,
        CASE WHEN v_match.match_number % 2 = 0 THEN p_winner_id ELSE NULL END,
        'scheduled',
        v_tournament.tournament_start,
        now(),
        now()
      ) RETURNING id INTO v_next_match_id;
    ELSE
      -- Update existing next match with winner
      UPDATE public.tournament_matches
      SET 
        player1_id = CASE 
          WHEN player1_id IS NULL AND v_match.match_number % 2 = 1 THEN p_winner_id
          ELSE player1_id
        END,
        player2_id = CASE 
          WHEN player2_id IS NULL AND v_match.match_number % 2 = 0 THEN p_winner_id
          ELSE player2_id
        END,
        updated_at = now()
      WHERE id = v_next_match_id;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'current_match_id', p_match_id,
    'next_match_id', v_next_match_id,
    'winner_id', p_winner_id,
    'third_place_match_id', v_third_place_match_id,
    'message', 'Winner advanced successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to advance winner: ' || SQLERRM,
      'details', SQLSTATE
    );
END;
$function$;