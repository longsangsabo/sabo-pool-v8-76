-- Fix generate_double_elimination_bracket_complete_v8 to NOT create Round 302
CREATE OR REPLACE FUNCTION public.generate_double_elimination_bracket_complete_v8(p_tournament_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_participants UUID[];
  v_participant_count INTEGER;
  v_matches_created INTEGER := 0;
  v_wb_rounds INTEGER;
  v_lb_rounds INTEGER;
  v_current_match_number INTEGER := 1;
  v_current_round INTEGER;
  v_match_number INTEGER;
  v_pairs_in_round INTEGER;
  v_i INTEGER;
  v_j INTEGER;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF v_tournament IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  -- Get confirmed participants in registration order
  SELECT array_agg(user_id ORDER BY created_at) INTO v_participants
  FROM tournament_registrations
  WHERE tournament_id = p_tournament_id 
    AND registration_status = 'confirmed';
  
  v_participant_count := array_length(v_participants, 1);
  
  IF v_participant_count IS NULL OR v_participant_count < 4 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Need at least 4 confirmed participants');
  END IF;
  
  -- Validate power of 2
  IF (v_participant_count & (v_participant_count - 1)) != 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Participant count must be a power of 2 (4, 8, 16, etc.)');
  END IF;
  
  -- Clear existing matches for this tournament
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Calculate rounds
  v_wb_rounds := CEIL(LOG(2, v_participant_count));  -- Winner's Bracket rounds
  v_lb_rounds := 2 * v_wb_rounds - 2;                -- Loser's Bracket rounds
  
  ----------------------------------------
  -- 1. WINNER'S BRACKET
  ----------------------------------------
  v_current_round := 1;
  v_pairs_in_round := v_participant_count / 2;
  
  WHILE v_current_round <= v_wb_rounds LOOP
    v_match_number := 1;
    
    FOR v_i IN 1..v_pairs_in_round LOOP
      IF v_current_round = 1 THEN
        -- First round with actual participants
        INSERT INTO tournament_matches (
          tournament_id, round_number, match_number,
          player1_id, player2_id, status, bracket_type, match_stage,
          created_at, updated_at
        ) VALUES (
          p_tournament_id, v_current_round, v_match_number,
          v_participants[2 * v_i - 1], v_participants[2 * v_i], 
          'scheduled', 'winners', 'winners_bracket',
          NOW(), NOW()
        );
      ELSE
        -- Subsequent rounds with TBD players
        INSERT INTO tournament_matches (
          tournament_id, round_number, match_number,
          player1_id, player2_id, status, bracket_type, match_stage,
          created_at, updated_at
        ) VALUES (
          p_tournament_id, v_current_round, v_match_number,
          NULL, NULL, 'scheduled', 'winners', 'winners_bracket',
          NOW(), NOW()
        );
      END IF;
      
      v_match_number := v_match_number + 1;
      v_matches_created := v_matches_created + 1;
    END LOOP;
    
    v_current_round := v_current_round + 1;
    v_pairs_in_round := v_pairs_in_round / 2;
  END LOOP;
  
  ----------------------------------------
  -- 2. LOSER'S BRACKET ROUNDS 101-103 (Branch A)
  ----------------------------------------
  FOR v_current_round IN 101..103 LOOP
    CASE v_current_round
      WHEN 101 THEN v_pairs_in_round := v_participant_count / 4;
      WHEN 102 THEN v_pairs_in_round := v_participant_count / 8;
      WHEN 103 THEN v_pairs_in_round := v_participant_count / 16;
    END CASE;
    
    v_match_number := 1;
    FOR v_i IN 1..v_pairs_in_round LOOP
      INSERT INTO tournament_matches (
        tournament_id, round_number, match_number,
        player1_id, player2_id, status, bracket_type, match_stage,
        created_at, updated_at
      ) VALUES (
        p_tournament_id, v_current_round, v_match_number,
        NULL, NULL, 'scheduled', 'losers', 'losers_branch_a',
        NOW(), NOW()
      );
      
      v_match_number := v_match_number + 1;
      v_matches_created := v_matches_created + 1;
    END LOOP;
  END LOOP;
  
  ----------------------------------------
  -- 3. LOSER'S BRACKET ROUNDS 201-202 (Branch B)
  ----------------------------------------
  FOR v_current_round IN 201..202 LOOP
    CASE v_current_round
      WHEN 201 THEN v_pairs_in_round := v_participant_count / 8;
      WHEN 202 THEN v_pairs_in_round := v_participant_count / 16;
    END CASE;
    
    v_match_number := 1;
    FOR v_i IN 1..v_pairs_in_round LOOP
      INSERT INTO tournament_matches (
        tournament_id, round_number, match_number,
        player1_id, player2_id, status, bracket_type, match_stage,
        created_at, updated_at
      ) VALUES (
        p_tournament_id, v_current_round, v_match_number,
        NULL, NULL, 'scheduled', 'losers', 'losers_branch_b',
        NOW(), NOW()
      );
      
      v_match_number := v_match_number + 1;
      v_matches_created := v_matches_created + 1;
    END LOOP;
  END LOOP;
  
  ----------------------------------------
  -- 4. SEMIFINAL (Round 250) - Will be auto-generated
  ----------------------------------------
  FOR v_i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type, match_stage,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 250, v_i,
      NULL, NULL, 'scheduled', 'losers', 'semifinal',
      NOW(), NOW()
    );
    
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  ----------------------------------------
  -- 5. CHAMPIONSHIP FINAL (Round 300) - Will be auto-generated 
  ----------------------------------------
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number,
    player1_id, player2_id, status, bracket_type, match_stage,
    created_at, updated_at
  ) VALUES (
    p_tournament_id, 300, 1,
    NULL, NULL, 'scheduled', 'single_elimination', 'final',
    NOW(), NOW()
  );
  
  v_matches_created := v_matches_created + 1;
  
  -- NOTE: NO Round 302 (Grand Final Reset) is created - this is by design
  
  -- Update tournament status
  UPDATE tournaments 
  SET status = 'registration_closed'
  WHERE id = p_tournament_id;
  
  -- Log bracket generation
  INSERT INTO tournament_automation_log (
    tournament_id, automation_type, status, details, completed_at
  ) VALUES (
    p_tournament_id, 'bracket_generation', 'completed',
    jsonb_build_object(
      'participant_count', v_participant_count,
      'matches_created', v_matches_created,
      'bracket_type', 'double_elimination',
      'wb_rounds', v_wb_rounds,
      'lb_rounds', v_lb_rounds
    ),
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'participant_count', v_participant_count,
    'total_matches', v_matches_created,
    'wb_rounds', v_wb_rounds,
    'lb_rounds', v_lb_rounds,
    'message', format('Successfully created %s matches for %s participants', v_matches_created, v_participant_count)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    INSERT INTO tournament_automation_log (
      tournament_id, automation_type, status, error_message
    ) VALUES (
      p_tournament_id, 'bracket_generation', 'failed', SQLERRM
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;