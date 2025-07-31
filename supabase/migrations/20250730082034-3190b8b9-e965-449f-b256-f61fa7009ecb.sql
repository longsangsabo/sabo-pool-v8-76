-- Drop and recreate the calculate_final_rankings function with correct column name

DROP FUNCTION IF EXISTS public.calculate_final_rankings(uuid);

CREATE OR REPLACE FUNCTION public.calculate_final_rankings(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_champion_id UUID;
  v_runner_up_id UUID;
  v_third_place_id UUID;
  v_fourth_place_id UUID;
  v_results_count INTEGER := 0;
  v_participant RECORD;
  v_current_position INTEGER := 5;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF v_tournament IS NULL THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;

  -- Clear existing results for this tournament
  DELETE FROM tournament_results WHERE tournament_id = p_tournament_id;

  -- Get champion (winner of Grand Final)
  SELECT winner_id INTO v_champion_id
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
  AND round_number = 300 
  AND match_number = 1
  AND status = 'completed';

  -- Get runner-up (loser of Grand Final)  
  SELECT CASE WHEN player1_id = v_champion_id THEN player2_id ELSE player1_id END
  INTO v_runner_up_id
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
  AND round_number = 300 
  AND match_number = 1
  AND status = 'completed';

  -- Get 3rd place (winner of 3rd Place Match - Semifinals Round 250 Match 2)
  SELECT winner_id INTO v_third_place_id
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
  AND round_number = 250 
  AND match_number = 2
  AND status = 'completed';

  -- Get 4th place (loser of 3rd Place Match)
  SELECT CASE WHEN player1_id = v_third_place_id THEN player2_id ELSE player1_id END
  INTO v_fourth_place_id
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
  AND round_number = 250 
  AND match_number = 2
  AND status = 'completed';

  -- Award 1st place (Champion)
  IF v_champion_id IS NOT NULL THEN
    INSERT INTO tournament_results (
      tournament_id, user_id, final_position, spa_points_earned, elo_points_awarded, 
      prize_amount, placement_type, created_at, updated_at
    ) VALUES (
      p_tournament_id, v_champion_id, 1, 500, 100, 
      COALESCE(v_tournament.prize_pool * 0.4, 0), 'champion', NOW(), NOW()
    );
    v_results_count := v_results_count + 1;
  END IF;

  -- Award 2nd place (Runner-up)
  IF v_runner_up_id IS NOT NULL THEN
    INSERT INTO tournament_results (
      tournament_id, user_id, final_position, spa_points_earned, elo_points_awarded, 
      prize_amount, placement_type, created_at, updated_at
    ) VALUES (
      p_tournament_id, v_runner_up_id, 2, 300, 75, 
      COALESCE(v_tournament.prize_pool * 0.3, 0), 'runner_up', NOW(), NOW()
    );
    v_results_count := v_results_count + 1;
  END IF;

  -- Award 3rd place
  IF v_third_place_id IS NOT NULL THEN
    INSERT INTO tournament_results (
      tournament_id, user_id, final_position, spa_points_earned, elo_points_awarded, 
      prize_amount, placement_type, created_at, updated_at
    ) VALUES (
      p_tournament_id, v_third_place_id, 3, 200, 50, 
      COALESCE(v_tournament.prize_pool * 0.2, 0), 'third_place', NOW(), NOW()
    );
    v_results_count := v_results_count + 1;
  END IF;

  -- Award 4th place
  IF v_fourth_place_id IS NOT NULL THEN
    INSERT INTO tournament_results (
      tournament_id, user_id, final_position, spa_points_earned, elo_points_awarded, 
      prize_amount, placement_type, created_at, updated_at
    ) VALUES (
      p_tournament_id, v_fourth_place_id, 4, 150, 25, 
      COALESCE(v_tournament.prize_pool * 0.1, 0), 'fourth_place', NOW(), NOW()
    );
    v_results_count := v_results_count + 1;
  END IF;

  -- Award remaining participants (5th place and below)
  FOR v_participant IN
    SELECT DISTINCT user_id 
    FROM tournament_registrations 
    WHERE tournament_id = p_tournament_id 
    AND registration_status = 'confirmed'
    AND user_id NOT IN (
      SELECT user_id FROM tournament_results WHERE tournament_id = p_tournament_id
    )
  LOOP
    INSERT INTO tournament_results (
      tournament_id, user_id, final_position, spa_points_earned, elo_points_awarded, 
      prize_amount, placement_type, created_at, updated_at
    ) VALUES (
      p_tournament_id, v_participant.user_id, v_current_position, 100, 10, 
      0, 'participation', NOW(), NOW()
    );
    v_current_position := v_current_position + 1;
    v_results_count := v_results_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'champion_id', v_champion_id,
    'runner_up_id', v_runner_up_id,
    'third_place_id', v_third_place_id,
    'fourth_place_id', v_fourth_place_id,
    'results_created', v_results_count,
    'message', format('Đã tạo %s kết quả tournament', v_results_count)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Lỗi khi tính toán kết quả: %s', SQLERRM),
      'tournament_id', p_tournament_id
    );
END;
$function$;