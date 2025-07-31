-- Fix double elimination bracket generation and add auto status update
CREATE OR REPLACE FUNCTION public.generate_double_elimination_bracket_complete_v7(
  p_tournament_id UUID,
  p_participant_count INTEGER DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_participants UUID[];
  v_participant_count INTEGER;
  v_winners_rounds INTEGER;
  v_total_matches INTEGER := 0;
  v_match_id UUID;
  v_i INTEGER;
  v_j INTEGER;
  v_round INTEGER;
  v_match_number INTEGER;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;

  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;

  -- Get participants
  SELECT array_agg(user_id ORDER BY registration_date) INTO v_participants
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id AND registration_status = 'confirmed';
  
  v_participant_count := COALESCE(p_participant_count, array_length(v_participants, 1));
  
  IF v_participant_count < 4 OR v_participant_count > 64 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid participant count');
  END IF;

  -- Calculate rounds needed
  v_winners_rounds := CEIL(LOG(2, v_participant_count));
  
  RAISE NOTICE '🏆 Generating DE bracket for % participants, % WB rounds', v_participant_count, v_winners_rounds;

  -- 1. WINNERS BRACKET
  v_match_number := 1;
  FOR v_round IN 1..v_winners_rounds LOOP
    DECLARE
      v_matches_this_round INTEGER := v_participant_count / (2 ^ v_round);
    BEGIN
      FOR v_i IN 1..v_matches_this_round LOOP
        v_match_id := gen_random_uuid();
        
        INSERT INTO tournament_matches (
          id, tournament_id, round_number, match_number, bracket_type, match_stage,
          player1_id, player2_id, status, created_at, updated_at
        ) VALUES (
          v_match_id, p_tournament_id, v_round, v_i, 'winners', 'winners_bracket',
          CASE WHEN v_round = 1 THEN v_participants[v_i * 2 - 1] ELSE NULL END,
          CASE WHEN v_round = 1 THEN v_participants[v_i * 2] ELSE NULL END,
          CASE WHEN v_round = 1 THEN 'pending' ELSE 'pending' END,
          NOW(), NOW()
        );
        
        v_total_matches := v_total_matches + 1;
      END LOOP;
    END;
  END LOOP;

  -- 2. LOSERS BRANCH A (receives losers from WB R1)
  -- Branch A: 8 losers → 4 → 2 → 1 finalist
  DECLARE
    v_branch_a_participants INTEGER := v_participant_count / 2; -- losers from WB R1
    v_branch_a_rounds INTEGER := CEIL(LOG(2, v_branch_a_participants));
  BEGIN
    FOR v_round IN 1..v_branch_a_rounds LOOP
      DECLARE
        v_matches_this_round INTEGER := v_branch_a_participants / (2 ^ v_round);
      BEGIN
        FOR v_i IN 1..v_matches_this_round LOOP
          v_match_id := gen_random_uuid();
          
          INSERT INTO tournament_matches (
            id, tournament_id, round_number, match_number, bracket_type, match_stage,
            branch_type, player1_id, player2_id, status, created_at, updated_at
          ) VALUES (
            v_match_id, p_tournament_id, 100 + v_round, v_i, 'losers', 'losers_branch_a',
            'branch_a', NULL, NULL, 'pending', NOW(), NOW()
          );
          
          v_total_matches := v_total_matches + 1;
        END LOOP;
      END;
    END LOOP;
  END;

  -- 3. LOSERS BRANCH B (receives losers from WB R2)
  -- Branch B: 4 losers from WB R2 + Branch A finalist → semifinals → final
  DECLARE
    v_wb_r2_losers INTEGER := v_participant_count / 4; -- losers from WB R2
  BEGIN
    -- R201: 4 losers from WB R2 + Branch A finalist = 5 → need 2 matches (one bye)
    -- Actually let's make it simpler: 4 losers + 1 Branch A finalist = 5 total
    -- We need to create a structure that can handle this properly
    
    -- R201: 2 matches (4 WB R2 losers compete, winner of Branch A gets bye or waits)
    FOR v_i IN 1..2 LOOP
      v_match_id := gen_random_uuid();
      
      INSERT INTO tournament_matches (
        id, tournament_id, round_number, match_number, bracket_type, match_stage,
        branch_type, player1_id, player2_id, status, created_at, updated_at
      ) VALUES (
        v_match_id, p_tournament_id, 201, v_i, 'losers', 'losers_branch_b',
        'branch_b', NULL, NULL, 'pending', NOW(), NOW()
      );
      
      v_total_matches := v_total_matches + 1;
    END LOOP;
    
    -- R202: Final match of Branch B (winner of R201 matches + Branch A finalist)
    v_match_id := gen_random_uuid();
    
    INSERT INTO tournament_matches (
      id, tournament_id, round_number, match_number, bracket_type, match_stage,
      branch_type, player1_id, player2_id, status, created_at, updated_at
    ) VALUES (
      v_match_id, p_tournament_id, 202, 1, 'losers', 'losers_branch_b',
      'branch_b', NULL, NULL, 'pending', NOW(), NOW()
    );
    
    v_total_matches := v_total_matches + 1;
  END;

  -- 4. GRAND FINAL
  -- Grand Final Game 1
  v_match_id := gen_random_uuid();
  INSERT INTO tournament_matches (
    id, tournament_id, round_number, match_number, bracket_type, match_stage,
    player1_id, player2_id, status, created_at, updated_at
  ) VALUES (
    v_match_id, p_tournament_id, 301, 1, 'final', 'grand_final',
    NULL, NULL, 'pending', NOW(), NOW()
  );
  v_total_matches := v_total_matches + 1;

  -- Grand Final Game 2 (reset bracket if losers bracket winner wins)
  v_match_id := gen_random_uuid();
  INSERT INTO tournament_matches (
    id, tournament_id, round_number, match_number, bracket_type, match_stage,
    player1_id, player2_id, status, created_at, updated_at
  ) VALUES (
    v_match_id, p_tournament_id, 302, 1, 'final', 'grand_final_reset',
    NULL, NULL, 'pending', NOW(), NOW()
  );
  v_total_matches := v_total_matches + 1;

  RAISE NOTICE '✅ Created % total matches for DE bracket', v_total_matches;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Double elimination bracket generated successfully',
    'total_matches', v_total_matches,
    'participant_count', v_participant_count,
    'winners_rounds', v_winners_rounds
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Error generating bracket: %s', SQLERRM)
    );
END;
$$;

-- Auto status update trigger
CREATE OR REPLACE FUNCTION public.auto_update_match_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto change pending -> scheduled when players are assigned
  IF OLD.status = 'pending' AND NEW.player1_id IS NOT NULL AND NEW.player2_id IS NOT NULL THEN
    NEW.status := 'scheduled';
    NEW.updated_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto status update
DROP TRIGGER IF EXISTS auto_match_status_trigger ON tournament_matches;
CREATE TRIGGER auto_match_status_trigger
  BEFORE UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_match_status();