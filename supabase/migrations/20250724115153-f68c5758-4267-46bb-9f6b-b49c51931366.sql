-- Fix variable scope issue in generate_double_elimination_bracket_complete
CREATE OR REPLACE FUNCTION public.generate_double_elimination_bracket_complete(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_participants UUID[];
  v_participant_count INTEGER;
  v_bracket_size INTEGER;
  v_wb_rounds INTEGER;
  v_lb_rounds INTEGER;
  v_match_number INTEGER;
  v_total_matches INTEGER := 0;
  v_round INTEGER;
  v_wb_r1_losers INTEGER;
  v_wb_r2_losers INTEGER;
  j INTEGER;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Get participants as UUID array
  SELECT array_agg(user_id ORDER BY registration_date) 
  INTO v_participants
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id AND registration_status = 'confirmed';
  
  v_participant_count := COALESCE(array_length(v_participants, 1), 0);
  
  IF v_participant_count < 2 THEN
    RETURN jsonb_build_object('error', 'Need at least 2 participants');
  END IF;
  
  -- Calculate bracket size (next power of 2)
  v_bracket_size := 1;
  WHILE v_bracket_size < v_participant_count LOOP
    v_bracket_size := v_bracket_size * 2;
  END LOOP;
  
  v_wb_rounds := CASE 
    WHEN v_bracket_size = 2 THEN 1
    WHEN v_bracket_size = 4 THEN 2  
    WHEN v_bracket_size = 8 THEN 3
    WHEN v_bracket_size = 16 THEN 4
    WHEN v_bracket_size = 32 THEN 5
    ELSE CEIL(LOG(2, v_bracket_size))
  END;
  
  v_lb_rounds := CASE
    WHEN v_bracket_size <= 4 THEN 1
    ELSE (v_wb_rounds - 1) * 2 - 1
  END;
  
  -- Calculate branch sizes
  v_wb_r1_losers := v_bracket_size / 2;
  v_wb_r2_losers := v_bracket_size / 4;
  
  RAISE NOTICE 'Creating double elimination: % participants, % bracket size, % WB rounds, % LB rounds', 
    v_participant_count, v_bracket_size, v_wb_rounds, v_lb_rounds;
  
  -- ========== WINNER'S BRACKET ==========
  v_match_number := 1;
  FOR v_round IN 1..v_wb_rounds LOOP
    DECLARE
      v_matches_in_round INTEGER := v_bracket_size / POWER(2, v_round);
    BEGIN
      FOR j IN 1..v_matches_in_round LOOP
        INSERT INTO tournament_matches (
          id, tournament_id, round_number, match_number,
          bracket_type, branch_type, 
          player1_id, player2_id,
          status, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), p_tournament_id, v_round, v_match_number,
          'winners', NULL,
          CASE 
            WHEN v_round = 1 AND (j * 2 - 1) <= v_participant_count 
            THEN v_participants[j * 2 - 1]
          END,
          CASE 
            WHEN v_round = 1 AND (j * 2) <= v_participant_count 
            THEN v_participants[j * 2]
          END,
          'pending', NOW(), NOW()
        );
        
        v_match_number := v_match_number + 1;
        v_total_matches := v_total_matches + 1;
      END LOOP;
    END;
  END LOOP;
  
  -- ========== LOSER'S BRACKET - BRANCHED STRUCTURE ==========
  
  -- Branch A: Losers from WB Round 1 (8→4→2→1)
  IF v_wb_rounds >= 1 THEN
    DECLARE
      v_branch_a_rounds INTEGER := CASE 
        WHEN v_wb_r1_losers <= 2 THEN 1
        ELSE CEIL(LOG(2, v_wb_r1_losers))
      END;
    BEGIN
      FOR v_round IN 1..v_branch_a_rounds LOOP
        DECLARE
          v_matches_in_round INTEGER := v_wb_r1_losers / POWER(2, v_round);
        BEGIN
          FOR j IN 1..v_matches_in_round LOOP
            INSERT INTO tournament_matches (
              id, tournament_id, round_number, match_number,
              bracket_type, branch_type,
              status, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), p_tournament_id, v_round, v_match_number,
              'losers', 'branch_a',
              'pending', NOW(), NOW()
            );
            
            v_match_number := v_match_number + 1;
            v_total_matches := v_total_matches + 1;
          END LOOP;
        END;
      END LOOP;
    END;
  END IF;
  
  -- Branch B: Losers from WB Round 2 (4→2→1)
  IF v_wb_rounds >= 2 THEN
    DECLARE
      v_branch_b_rounds INTEGER := CASE 
        WHEN v_wb_r2_losers <= 2 THEN 1
        ELSE CEIL(LOG(2, v_wb_r2_losers))
      END;
    BEGIN
      FOR v_round IN 1..v_branch_b_rounds LOOP
        DECLARE
          v_matches_in_round INTEGER := v_wb_r2_losers / POWER(2, v_round);
        BEGIN
          FOR j IN 1..v_matches_in_round LOOP
            INSERT INTO tournament_matches (
              id, tournament_id, round_number, match_number,
              bracket_type, branch_type,
              status, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), p_tournament_id, v_round, v_match_number,
              'losers', 'branch_b',
              'pending', NOW(), NOW()
            );
            
            v_match_number := v_match_number + 1;
            v_total_matches := v_total_matches + 1;
          END LOOP;
        END;
      END LOOP;
    END;
  END IF;
  
  -- ========== SEMIFINAL STAGE (4 người: 2 từ WB + 2 từ LB) ==========
  FOR j IN 1..2 LOOP
    INSERT INTO tournament_matches (
      id, tournament_id, round_number, match_number,
      bracket_type, branch_type,
      status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), p_tournament_id, v_wb_rounds + v_lb_rounds + 1, v_match_number,
      'semifinal', NULL,
      'pending', NOW(), NOW()
    );
    
    v_match_number := v_match_number + 1;
    v_total_matches := v_total_matches + 1;
  END LOOP;
  
  -- ========== GRAND FINAL ==========
  INSERT INTO tournament_matches (
    id, tournament_id, round_number, match_number,
    bracket_type, branch_type,
    status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_tournament_id, v_wb_rounds + v_lb_rounds + 2, v_match_number,
    'grand_final', NULL,
    'pending', NOW(), NOW()
  );
  
  v_total_matches := v_total_matches + 1;
  
  -- ========== GRAND FINAL RESET (if needed) ==========
  INSERT INTO tournament_matches (
    id, tournament_id, round_number, match_number,
    bracket_type, branch_type,
    status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_tournament_id, v_wb_rounds + v_lb_rounds + 3, v_match_number + 1,
    'grand_final_reset', NULL,
    'pending', NOW(), NOW()
  );
  
  v_total_matches := v_total_matches + 1;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'participant_count', v_participant_count,
    'bracket_size', v_bracket_size,
    'total_matches', v_total_matches,
    'winners_bracket_rounds', v_wb_rounds,
    'losers_bracket_rounds', v_lb_rounds,
    'bracket_structure', jsonb_build_object(
      'winners_bracket', v_bracket_size / 2,
      'losers_branch_a', v_wb_r1_losers,
      'losers_branch_b', v_wb_r2_losers,
      'semifinal', 2,
      'grand_final', 1,
      'grand_final_reset', 1
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Failed to generate bracket: %s', SQLERRM)
    );
END;
$function$;