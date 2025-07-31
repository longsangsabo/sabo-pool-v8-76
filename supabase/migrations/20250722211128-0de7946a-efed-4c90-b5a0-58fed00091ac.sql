-- Phase 2 Fixed: Create Missing Functions for Tournament Management (Fixed PostgreSQL syntax)

-- Double elimination bracket functions
CREATE OR REPLACE FUNCTION public.create_double_elimination_bracket_v2(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_participants UUID[];
  v_participant_count INTEGER;
  v_winners_rounds INTEGER;
  v_losers_rounds INTEGER;
  v_match_counter INTEGER := 0;
  v_winners_match_counter INTEGER := 0;
  v_losers_match_counter INTEGER := 0;
  i INTEGER;
  j INTEGER;
BEGIN
  -- Get participants
  SELECT array_agg(user_id) INTO v_participants
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id 
  AND registration_status = 'confirmed'
  AND payment_status = 'paid';
  
  v_participant_count := array_length(v_participants, 1);
  
  IF v_participant_count < 2 THEN
    RETURN jsonb_build_object('error', 'Need at least 2 participants');
  END IF;
  
  -- Calculate rounds needed
  v_winners_rounds := CEIL(LOG(2, v_participant_count));
  v_losers_rounds := (v_winners_rounds - 1) * 2;
  
  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Create Winners Bracket Round 1
  FOR i IN 1..v_participant_count BY 2 LOOP
    v_winners_match_counter := v_winners_match_counter + 1;
    
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, branch_type,
      player1_id, player2_id, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, v_winners_match_counter, 'winners', NULL,
      v_participants[i],
      CASE WHEN i + 1 <= v_participant_count THEN v_participants[i + 1] ELSE NULL END,
      'scheduled', NOW(), NOW()
    );
  END LOOP;
  
  -- Create placeholder matches for subsequent winners rounds
  FOR i IN 2..v_winners_rounds LOOP
    FOR j IN 1..(POWER(2, v_winners_rounds - i))::INTEGER LOOP
      INSERT INTO tournament_matches (
        tournament_id, round_number, match_number, bracket_type, status
      ) VALUES (
        p_tournament_id, i, j, 'winners', 'pending'
      );
    END LOOP;
  END LOOP;
  
  -- Create losers bracket structure (simplified)
  FOR i IN 1..v_losers_rounds LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, status
    ) VALUES (
      p_tournament_id, i, 1, 'losers', 'pending'
    );
  END LOOP;
  
  -- Create final match
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type, status
  ) VALUES (
    p_tournament_id, v_winners_rounds + 1, 1, 'final', 'pending'
  );
  
  -- Update tournament
  UPDATE tournaments 
  SET has_bracket = true, updated_at = NOW()
  WHERE id = p_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'bracket_type', 'double_elimination',
    'participants', v_participant_count,
    'winners_rounds', v_winners_rounds,
    'losers_rounds', v_losers_rounds
  );
END;
$$;

-- Advanced tournament bracket generation
CREATE OR REPLACE FUNCTION public.generate_advanced_tournament_bracket(
  p_tournament_id uuid,
  p_seeding_method text DEFAULT 'registration_order',
  p_force_regenerate boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament RECORD;
  v_result JSONB;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF v_tournament IS NULL THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Check if bracket already exists
  IF v_tournament.has_bracket = true AND p_force_regenerate = false THEN
    RETURN jsonb_build_object('error', 'Bracket already exists. Use force_regenerate=true to recreate.');
  END IF;
  
  -- Generate based on tournament type
  CASE v_tournament.tournament_type
    WHEN 'double_elimination' THEN
      SELECT public.create_double_elimination_bracket_v2(p_tournament_id) INTO v_result;
    ELSE
      SELECT public.generate_complete_tournament_bracket(p_tournament_id) INTO v_result;
  END CASE;
  
  RETURN v_result;
END;
$$;

-- Force complete tournament status
CREATE OR REPLACE FUNCTION public.force_complete_tournament_status(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Force tournament to completed status
  UPDATE tournaments 
  SET status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_tournament_id;
  
  -- Process tournament completion
  PERFORM public.process_tournament_completion(p_tournament_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'status', 'completed',
    'completed_at', NOW()
  );
END;
$$;

-- Calculate tournament results (Fixed PostgreSQL syntax)
CREATE OR REPLACE FUNCTION public.calculate_tournament_results(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament RECORD;
  v_final_match RECORD;
  v_third_place_match RECORD;
  v_results_created INTEGER := 0;
  v_runner_up_id UUID;
  v_fourth_place_id UUID;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF v_tournament IS NULL THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Clear existing results
  DELETE FROM tournament_results WHERE tournament_id = p_tournament_id;
  
  -- Get final match to determine winner (1st place)
  SELECT * INTO v_final_match
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id
  AND round_number = (SELECT MAX(round_number) FROM tournament_matches WHERE tournament_id = p_tournament_id)
  AND match_number = 1
  AND (is_third_place_match IS NULL OR is_third_place_match = false)
  AND status = 'completed'
  AND winner_id IS NOT NULL;
  
  -- Calculate runner-up ID
  IF v_final_match.winner_id IS NOT NULL THEN
    v_runner_up_id := CASE 
      WHEN v_final_match.player1_id = v_final_match.winner_id 
      THEN v_final_match.player2_id 
      ELSE v_final_match.player1_id 
    END;
  END IF;
  
  -- Insert 1st place (champion)
  IF v_final_match.winner_id IS NOT NULL THEN
    INSERT INTO tournament_results (
      tournament_id, user_id, position, spa_points_earned, elo_points_earned,
      matches_played, matches_won, matches_lost, created_at
    ) VALUES (
      p_tournament_id, v_final_match.winner_id, 1, 100, 50, 
      (SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = p_tournament_id AND (player1_id = v_final_match.winner_id OR player2_id = v_final_match.winner_id) AND status = 'completed'),
      (SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = p_tournament_id AND winner_id = v_final_match.winner_id),
      (SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = p_tournament_id AND (player1_id = v_final_match.winner_id OR player2_id = v_final_match.winner_id) AND status = 'completed' AND winner_id != v_final_match.winner_id),
      NOW()
    );
    v_results_created := v_results_created + 1;
    
    -- Insert 2nd place (runner-up)
    INSERT INTO tournament_results (
      tournament_id, user_id, position, spa_points_earned, elo_points_earned,
      matches_played, matches_won, matches_lost, created_at
    ) VALUES (
      p_tournament_id, v_runner_up_id, 2, 80, 30,
      (SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = p_tournament_id AND (player1_id = v_runner_up_id OR player2_id = v_runner_up_id) AND status = 'completed'),
      (SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = p_tournament_id AND winner_id = v_runner_up_id),
      (SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = p_tournament_id AND (player1_id = v_runner_up_id OR player2_id = v_runner_up_id) AND status = 'completed' AND winner_id != v_runner_up_id),
      NOW()
    );
    v_results_created := v_results_created + 1;
  END IF;
  
  -- Get third place match result
  SELECT * INTO v_third_place_match
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id
  AND is_third_place_match = true
  AND status = 'completed'
  AND winner_id IS NOT NULL;
  
  -- Calculate fourth place ID
  IF v_third_place_match.winner_id IS NOT NULL THEN
    v_fourth_place_id := CASE 
      WHEN v_third_place_match.player1_id = v_third_place_match.winner_id 
      THEN v_third_place_match.player2_id 
      ELSE v_third_place_match.player1_id 
    END;
  END IF;
  
  -- Insert 3rd place
  IF v_third_place_match.winner_id IS NOT NULL THEN
    INSERT INTO tournament_results (
      tournament_id, user_id, position, spa_points_earned, elo_points_earned,
      matches_played, matches_won, matches_lost, created_at
    ) VALUES (
      p_tournament_id, v_third_place_match.winner_id, 3, 60, 20,
      (SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = p_tournament_id AND (player1_id = v_third_place_match.winner_id OR player2_id = v_third_place_match.winner_id) AND status = 'completed'),
      (SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = p_tournament_id AND winner_id = v_third_place_match.winner_id),
      (SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = p_tournament_id AND (player1_id = v_third_place_match.winner_id OR player2_id = v_third_place_match.winner_id) AND status = 'completed' AND winner_id != v_third_place_match.winner_id),
      NOW()
    );
    v_results_created := v_results_created + 1;
    
    -- Insert 4th place (3rd place match loser)
    INSERT INTO tournament_results (
      tournament_id, user_id, position, spa_points_earned, elo_points_earned,
      matches_played, matches_won, matches_lost, created_at
    ) VALUES (
      p_tournament_id, v_fourth_place_id, 4, 40, 10,
      (SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = p_tournament_id AND (player1_id = v_fourth_place_id OR player2_id = v_fourth_place_id) AND status = 'completed'),
      (SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = p_tournament_id AND winner_id = v_fourth_place_id),
      (SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = p_tournament_id AND (player1_id = v_fourth_place_id OR player2_id = v_fourth_place_id) AND status = 'completed' AND winner_id != v_fourth_place_id),
      NOW()
    );
    v_results_created := v_results_created + 1;
  END IF;
  
  -- Award SPA points to winners
  UPDATE player_rankings 
  SET spa_points = spa_points + (SELECT spa_points_earned FROM tournament_results WHERE tournament_id = p_tournament_id AND user_id = player_rankings.user_id),
      updated_at = NOW()
  WHERE user_id IN (SELECT user_id FROM tournament_results WHERE tournament_id = p_tournament_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'results_created', v_results_created,
    'calculated_at', NOW()
  );
END;
$$;

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION public.create_double_elimination_bracket_v2(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_advanced_tournament_bracket(UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.force_complete_tournament_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_tournament_results(UUID) TO authenticated;