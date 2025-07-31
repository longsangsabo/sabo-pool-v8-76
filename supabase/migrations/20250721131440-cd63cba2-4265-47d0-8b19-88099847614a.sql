-- Stage 3: Add missing database functions and update existing ones

-- Create submit_double_elimination_score function
CREATE OR REPLACE FUNCTION public.submit_double_elimination_score(
  p_match_id UUID,
  p_player1_score INTEGER,
  p_player2_score INTEGER,
  p_submitted_by UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_winner_id UUID;
  v_match RECORD;
  v_tournament RECORD;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM public.tournament_matches WHERE id = p_match_id;
  
  IF v_match IS NULL THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Get tournament details
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = v_match.tournament_id;
  
  -- Determine winner
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
  ELSE
    v_winner_id := v_match.player2_id;
  END IF;
  
  -- Update match
  UPDATE public.tournament_matches
  SET score_player1 = p_player1_score,
      score_player2 = p_player2_score,
      winner_id = v_winner_id,
      score_input_by = p_submitted_by,
      score_submitted_at = NOW(),
      score_status = 'pending_confirmation',
      status = 'completed',
      actual_end_time = NOW(),
      updated_at = NOW()
  WHERE id = p_match_id;
  
  -- For double elimination, handle loser bracket logic
  IF v_tournament.tournament_type = 'double_elimination' THEN
    -- Additional logic for double elimination would go here
    -- This is a simplified version
    NULL;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'winner_id', v_winner_id,
    'match_id', p_match_id,
    'tournament_type', v_tournament.tournament_type
  );
END;
$$;

-- Update generate_single_elimination_bracket function to remove unused parameters
CREATE OR REPLACE FUNCTION public.generate_single_elimination_bracket(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_participants UUID[];
  v_bracket_data JSONB;
  v_rounds INTEGER;
  v_match_count INTEGER;
BEGIN
  -- Get all registered participants
  SELECT array_agg(user_id) INTO v_participants
  FROM public.tournament_registrations 
  WHERE tournament_id = p_tournament_id AND payment_status = 'paid';
  
  IF array_length(v_participants, 1) IS NULL THEN
    RETURN jsonb_build_object('error', 'No participants found');
  END IF;
  
  v_rounds := CEIL(LOG(2, array_length(v_participants, 1)));
  v_match_count := 0;
  
  -- Delete existing matches for this tournament
  DELETE FROM public.tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Create matches for round 1
  FOR i IN 1..array_length(v_participants, 1) BY 2 LOOP
    v_match_count := v_match_count + 1;
    
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number, 
      player1_id, player2_id, status
    ) VALUES (
      p_tournament_id, 1, v_match_count,
      v_participants[i], 
      CASE WHEN i + 1 <= array_length(v_participants, 1) 
           THEN v_participants[i + 1] 
           ELSE NULL END,
      'scheduled'
    );
  END LOOP;
  
  -- Store bracket data
  INSERT INTO public.tournament_brackets (tournament_id, bracket_data, total_rounds)
  VALUES (p_tournament_id, jsonb_build_object('matches_created', v_match_count), v_rounds)
  ON CONFLICT (tournament_id) DO UPDATE SET 
    bracket_data = EXCLUDED.bracket_data,
    total_rounds = EXCLUDED.total_rounds,
    updated_at = NOW();
  
  RETURN jsonb_build_object(
    'success', true,
    'matches_created', v_match_count,
    'total_rounds', v_rounds
  );
END;
$$;