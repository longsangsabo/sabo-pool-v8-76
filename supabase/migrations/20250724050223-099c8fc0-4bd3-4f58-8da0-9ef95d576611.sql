-- Fix the SQL error in create_double_elimination_bracket_v2 function
CREATE OR REPLACE FUNCTION public.create_double_elimination_bracket_v2(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_participant_ids UUID[];
  v_participant_count INTEGER;
  v_rounds_winner INTEGER;
  v_rounds_loser INTEGER;
  v_total_rounds INTEGER;
  v_matches_created INTEGER := 0;
  v_current_round INTEGER;
  v_matches_in_round INTEGER;
  i INTEGER;
  j INTEGER;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Get confirmed participants ordered by registration time
  SELECT ARRAY_AGG(tr.user_id ORDER BY tr.created_at)
  INTO v_participant_ids
  FROM tournament_registrations tr
  WHERE tr.tournament_id = p_tournament_id
    AND tr.registration_status = 'confirmed';
  
  v_participant_count := array_length(v_participant_ids, 1);
  
  IF v_participant_count IS NULL OR v_participant_count < 2 THEN
    RETURN jsonb_build_object('error', 'Not enough participants');
  END IF;
  
  -- Calculate rounds needed for double elimination
  v_rounds_winner := CEIL(LOG(2, v_participant_count)); -- Winner bracket rounds
  v_rounds_loser := (v_rounds_winner - 1) * 2; -- Loser bracket rounds
  v_total_rounds := v_rounds_winner + v_rounds_loser + 1; -- +1 for grand final
  
  -- 1. Create Winner Bracket (Rounds 1 to v_rounds_winner)
  v_matches_in_round := v_participant_count / 2;
  
  FOR v_current_round IN 1..v_rounds_winner LOOP
    FOR i IN 1..v_matches_in_round LOOP
      INSERT INTO tournament_matches (
        tournament_id, round_number, match_number, bracket_type,
        status, created_at, updated_at
      ) VALUES (
        p_tournament_id, v_current_round, i, 'winner',
        'pending', NOW(), NOW()
      );
      v_matches_created := v_matches_created + 1;
    END LOOP;
    
    v_matches_in_round := v_matches_in_round / 2;
    EXIT WHEN v_matches_in_round < 1;
  END LOOP;
  
  -- 2. Create Loser Bracket (Rounds v_rounds_winner+1 to v_total_rounds-1)
  v_matches_in_round := v_participant_count / 4; -- Start with quarter of original participants
  
  FOR v_current_round IN (v_rounds_winner + 1)..(v_total_rounds - 1) LOOP
    FOR i IN 1..GREATEST(v_matches_in_round, 1) LOOP
      INSERT INTO tournament_matches (
        tournament_id, round_number, match_number, bracket_type,
        status, created_at, updated_at
      ) VALUES (
        p_tournament_id, v_current_round, i, 'loser',
        'pending', NOW(), NOW()
      );
      v_matches_created := v_matches_created + 1;
    END LOOP;
    
    -- Loser bracket progression pattern
    IF v_current_round % 2 = 0 THEN
      v_matches_in_round := v_matches_in_round / 2;
    END IF;
    
    EXIT WHEN v_matches_in_round < 1;
  END LOOP;
  
  -- 3. Create Grand Final (last round)
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type,
    status, created_at, updated_at
  ) VALUES (
    p_tournament_id, v_total_rounds, 1, 'final',
    'pending', NOW(), NOW()
  );
  v_matches_created := v_matches_created + 1;
  
  -- 4. Assign participants to first round winner bracket matches
  FOR i IN 1..(v_participant_count / 2) LOOP
    UPDATE tournament_matches
    SET 
      player1_id = v_participant_ids[i * 2 - 1],
      player2_id = v_participant_ids[i * 2],
      status = 'scheduled'
    WHERE tournament_id = p_tournament_id
      AND round_number = 1
      AND match_number = i
      AND bracket_type = 'winner';
  END LOOP;
  
  -- Log the bracket creation
  INSERT INTO automation_performance_log (
    automation_type, success, details
  ) VALUES (
    'double_elimination_bracket_creation',
    true,
    jsonb_build_object(
      'tournament_id', p_tournament_id,
      'participant_count', v_participant_count,
      'total_rounds', v_total_rounds,
      'matches_created', v_matches_created,
      'winner_rounds', v_rounds_winner,
      'loser_rounds', v_rounds_loser
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'participant_count', v_participant_count,
    'total_rounds', v_total_rounds,
    'matches_created', v_matches_created,
    'winner_rounds', v_rounds_winner,
    'loser_rounds', v_rounds_loser,
    'message', 'Double elimination bracket created successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to create double elimination bracket: ' || SQLERRM
    );
END;
$$;