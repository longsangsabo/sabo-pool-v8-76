-- Drop existing function if it exists and create the complete score submission system
DROP FUNCTION IF EXISTS public.submit_match_score(uuid,integer,integer,uuid);

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