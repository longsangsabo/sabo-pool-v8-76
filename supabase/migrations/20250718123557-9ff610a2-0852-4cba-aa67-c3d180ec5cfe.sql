-- Create submit_match_score RPC function and fix tournament progression
CREATE OR REPLACE FUNCTION public.submit_match_score(
  p_match_id UUID,
  p_player1_score INTEGER,
  p_player2_score INTEGER,
  p_submitted_by UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_winner_id UUID;
  v_advancement_result JSONB;
BEGIN
  -- Get match details
  SELECT * INTO v_match
  FROM tournament_matches 
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Validate scores
  IF p_player1_score < 0 OR p_player2_score < 0 THEN
    RETURN jsonb_build_object('error', 'Scores cannot be negative');
  END IF;
  
  IF p_player1_score = p_player2_score THEN
    RETURN jsonb_build_object('error', 'Ties not allowed in single elimination');
  END IF;
  
  -- Determine winner
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
  ELSE
    v_winner_id := v_match.player2_id;
  END IF;
  
  -- Update match with scores and winner
  UPDATE tournament_matches
  SET 
    score_player1 = p_player1_score,
    score_player2 = p_player2_score,
    winner_id = v_winner_id,
    status = 'completed',
    score_status = 'confirmed',
    score_confirmed_by = p_submitted_by,
    score_confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- Auto-advance winner to next round using existing function
  SELECT public.advance_winner_to_next_round(p_match_id) INTO v_advancement_result;
  
  -- Check if tournament is complete (no more rounds)
  IF (v_advancement_result->>'tournament_complete')::boolean = true THEN
    -- Create final result and complete tournament
    UPDATE tournaments
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_match.tournament_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'tournament_complete', true,
      'champion_id', v_winner_id,
      'message', 'Tournament completed! Champion determined.'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'winner_id', v_winner_id,
    'advancement', v_advancement_result,
    'message', 'Match score submitted and winner advanced successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to submit score: ' || SQLERRM
    );
END;
$$;

-- Create function to generate final round (and 3rd place if needed)
CREATE OR REPLACE FUNCTION public.create_final_round_matches(
  p_tournament_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_semifinal_winners UUID[];
  v_semifinal_losers UUID[];
  v_final_match_id UUID;
  v_third_place_match_id UUID;
  v_max_round INTEGER;
BEGIN
  -- Get current max round
  SELECT MAX(round_number) INTO v_max_round
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id;
  
  -- Get semifinal winners (from previous round)
  SELECT ARRAY_AGG(winner_id) INTO v_semifinal_winners
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id
    AND round_number = v_max_round
    AND status = 'completed'
    AND winner_id IS NOT NULL;
  
  -- Get semifinal losers for 3rd place match
  SELECT ARRAY_AGG(
    CASE 
      WHEN winner_id = player1_id THEN player2_id 
      ELSE player1_id 
    END
  ) INTO v_semifinal_losers
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id
    AND round_number = v_max_round
    AND status = 'completed'
    AND winner_id IS NOT NULL;
  
  IF array_length(v_semifinal_winners, 1) < 2 THEN
    RETURN jsonb_build_object('error', 'Not enough semifinal winners to create final');
  END IF;
  
  -- Create Final Match
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type,
    player1_id, player2_id, status, created_at, updated_at
  ) VALUES (
    p_tournament_id, v_max_round + 1, 1, 'single',
    v_semifinal_winners[1], v_semifinal_winners[2], 'scheduled',
    NOW(), NOW()
  ) RETURNING id INTO v_final_match_id;
  
  -- Create 3rd Place Match if we have losers
  IF array_length(v_semifinal_losers, 1) = 2 THEN
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      player1_id, player2_id, status, is_third_place_match,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, v_max_round + 1, 2, 'single',
      v_semifinal_losers[1], v_semifinal_losers[2], 'scheduled', true,
      NOW(), NOW()
    ) RETURNING id INTO v_third_place_match_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'final_match_id', v_final_match_id,
    'third_place_match_id', v_third_place_match_id,
    'message', 'Final round created successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to create final round: ' || SQLERRM
    );
END;
$$;

-- Update advance_winner_to_next_round to handle final round creation
CREATE OR REPLACE FUNCTION public.advance_winner_to_next_round(
  p_match_id UUID,
  p_force_advance BOOLEAN DEFAULT FALSE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_next_match RECORD;
  v_next_round INTEGER;
  v_next_match_number INTEGER;
  v_is_player1_slot BOOLEAN;
  v_max_rounds INTEGER;
  v_completed_matches_in_current_round INTEGER;
  v_total_matches_in_current_round INTEGER;
  v_final_creation_result JSONB;
BEGIN
  -- Get completed match details
  SELECT * INTO v_match
  FROM tournament_matches 
  WHERE id = p_match_id 
    AND (status = 'completed' OR p_force_advance = TRUE)
    AND winner_id IS NOT NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found or not completed');
  END IF;
  
  -- Calculate next round and match position
  v_next_round := v_match.round_number + 1;
  v_next_match_number := CEIL(v_match.match_number::NUMERIC / 2);
  
  -- Get max rounds for this tournament
  SELECT MAX(round_number) INTO v_max_rounds
  FROM tournament_matches 
  WHERE tournament_id = v_match.tournament_id;
  
  -- Check if this was the final match
  IF v_match.round_number >= v_max_rounds THEN
    -- This was the final match
    UPDATE tournaments 
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_match.tournament_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'tournament_complete', true,
      'champion_id', v_match.winner_id,
      'message', 'Tournament completed successfully'
    );
  END IF;
  
  -- Find next round match
  SELECT * INTO v_next_match
  FROM tournament_matches 
  WHERE tournament_id = v_match.tournament_id 
    AND round_number = v_next_round 
    AND match_number = v_next_match_number;
  
  -- If next round doesn't exist, check if we need to create final round
  IF NOT FOUND THEN
    -- Count completed matches in current round
    SELECT 
      COUNT(*) FILTER (WHERE status = 'completed' AND winner_id IS NOT NULL),
      COUNT(*)
    INTO v_completed_matches_in_current_round, v_total_matches_in_current_round
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND round_number = v_match.round_number;
    
    -- If all matches in this round are complete and we're at semifinals, create final
    IF v_completed_matches_in_current_round = v_total_matches_in_current_round 
       AND v_total_matches_in_current_round = 2 THEN
      
      SELECT public.create_final_round_matches(v_match.tournament_id) INTO v_final_creation_result;
      
      RETURN jsonb_build_object(
        'success', true,
        'final_round_created', true,
        'result', v_final_creation_result,
        'message', 'Semifinals complete, final round created'
      );
    END IF;
    
    RETURN jsonb_build_object('error', 'Next round match not found');
  END IF;
  
  -- Fixed logic: for single elimination bracket progression
  -- Match 1,2 -> Match 1 (winners from matches 1,2 meet in semifinals match 1)
  -- Match 3,4 -> Match 2 (winners from matches 3,4 meet in semifinals match 2)
  v_is_player1_slot := (v_match.match_number % 2 = 1);
  
  -- Clear any duplicate assignments first
  IF v_is_player1_slot THEN
    -- Winner from odd numbered matches goes to player1 slot
    UPDATE tournament_matches 
    SET player1_id = v_match.winner_id,
        player2_id = CASE 
          WHEN player2_id = v_match.winner_id THEN NULL 
          ELSE player2_id 
        END,
        status = CASE 
          WHEN player2_id IS NOT NULL AND player2_id != v_match.winner_id THEN 'scheduled'
          ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = v_next_match.id;
  ELSE
    -- Winner from even numbered matches goes to player2 slot
    UPDATE tournament_matches 
    SET player2_id = v_match.winner_id,
        player1_id = CASE 
          WHEN player1_id = v_match.winner_id THEN NULL 
          ELSE player1_id 
        END,
        status = CASE 
          WHEN player1_id IS NOT NULL AND player1_id != v_match.winner_id THEN 'scheduled'
          ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = v_next_match.id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'advanced_to_round', v_next_round,
    'advanced_to_match', v_next_match_number,
    'winner_id', v_match.winner_id,
    'slot', CASE WHEN v_is_player1_slot THEN 'player1' ELSE 'player2' END,
    'message', 'Winner advanced to next round successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to advance winner: ' || SQLERRM
    );
END;
$$;