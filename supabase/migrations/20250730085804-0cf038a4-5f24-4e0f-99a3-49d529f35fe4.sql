-- ========================================
-- PHASE 1: DELETE PROBLEMATIC FUNCTIONS AND TABLES
-- ========================================

-- Drop the problematic advancement function
DROP FUNCTION IF EXISTS public.advance_sabo_tournament_fixed(uuid, uuid, uuid);

-- Drop the problematic advancement rules table
DROP TABLE IF EXISTS public.double1_advancement_rules;
DROP TABLE IF EXISTS public.double1_advancement_mapping;

-- ========================================
-- PHASE 2: CREATE THE 9 MISSING SABO FUNCTIONS
-- ========================================

-- 1. Process Losers Branch A Round 1 Completion
CREATE OR REPLACE FUNCTION public.process_losers_r101_completion()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament_id UUID;
  v_advanced_count INTEGER := 0;
BEGIN
  -- Find active SABO tournament
  SELECT id INTO v_tournament_id
  FROM tournaments 
  WHERE tournament_type = 'double_elimination' 
    AND status = 'ongoing'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_tournament_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No active SABO tournament found');
  END IF;
  
  -- Process completed matches in Losers R101 and advance winners to R102
  WITH completed_r101_matches AS (
    SELECT id, winner_id, match_number
    FROM tournament_matches 
    WHERE tournament_id = v_tournament_id
      AND round_number = 101
      AND status = 'completed' 
      AND winner_id IS NOT NULL
  )
  UPDATE tournament_matches 
  SET player1_id = CASE 
    WHEN tm_target.match_number = 1 THEN 
      (SELECT winner_id FROM completed_r101_matches WHERE match_number IN (1,2) ORDER BY match_number LIMIT 1)
    WHEN tm_target.match_number = 2 THEN
      (SELECT winner_id FROM completed_r101_matches WHERE match_number IN (3,4) ORDER BY match_number LIMIT 1)
  END,
  player2_id = CASE 
    WHEN tm_target.match_number = 1 THEN 
      (SELECT winner_id FROM completed_r101_matches WHERE match_number IN (1,2) ORDER BY match_number DESC LIMIT 1)
    WHEN tm_target.match_number = 2 THEN
      (SELECT winner_id FROM completed_r101_matches WHERE match_number IN (3,4) ORDER BY match_number DESC LIMIT 1)
  END,
  status = 'ready'
  FROM tournament_matches tm_target
  WHERE tm_target.tournament_id = v_tournament_id
    AND tm_target.round_number = 102
    AND tm_target.id = tournament_matches.id
    AND EXISTS (SELECT 1 FROM completed_r101_matches);
  
  GET DIAGNOSTICS v_advanced_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', v_tournament_id,
    'round', 'Losers R101',
    'advanced_count', v_advanced_count,
    'message', 'Losers R101 completion processed'
  );
END;
$$;

-- 2. Process Losers Branch A Round 2 Completion  
CREATE OR REPLACE FUNCTION public.process_losers_r102_completion()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament_id UUID;
  v_advanced_count INTEGER := 0;
BEGIN
  SELECT id INTO v_tournament_id
  FROM tournaments 
  WHERE tournament_type = 'double_elimination' 
    AND status = 'ongoing'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_tournament_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No active SABO tournament found');
  END IF;
  
  -- Advance R102 winners to R103
  UPDATE tournament_matches 
  SET player1_id = (
    SELECT winner_id FROM tournament_matches tm_r102_1
    WHERE tm_r102_1.tournament_id = v_tournament_id
      AND tm_r102_1.round_number = 102
      AND tm_r102_1.match_number = 1
      AND tm_r102_1.status = 'completed'
  ),
  player2_id = (
    SELECT winner_id FROM tournament_matches tm_r102_2
    WHERE tm_r102_2.tournament_id = v_tournament_id
      AND tm_r102_2.round_number = 102
      AND tm_r102_2.match_number = 2
      AND tm_r102_2.status = 'completed'
  ),
  status = 'ready'
  WHERE tournament_id = v_tournament_id
    AND round_number = 103
    AND match_number = 1;
  
  GET DIAGNOSTICS v_advanced_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', v_tournament_id,
    'round', 'Losers R102',
    'advanced_count', v_advanced_count,
    'message', 'Losers R102 completion processed'
  );
END;
$$;

-- 3. Process Losers Branch A Round 3 Completion
CREATE OR REPLACE FUNCTION public.process_losers_r103_completion()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament_id UUID;
  v_la_winner_id UUID;
BEGIN
  SELECT id INTO v_tournament_id
  FROM tournaments 
  WHERE tournament_type = 'double_elimination' 
    AND status = 'ongoing'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_tournament_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No active SABO tournament found');
  END IF;
  
  -- Get Losers Branch A winner
  SELECT winner_id INTO v_la_winner_id
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id
    AND round_number = 103
    AND match_number = 1
    AND status = 'completed';
  
  IF v_la_winner_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Losers Branch A final not completed');
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', v_tournament_id,
    'round', 'Losers R103',
    'la_winner_id', v_la_winner_id,
    'message', 'Losers Branch A completed, winner ready for semifinals'
  );
END;
$$;

-- 4. Process Losers Branch B Round 1 Completion
CREATE OR REPLACE FUNCTION public.process_losers_r201_completion()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament_id UUID;
  v_advanced_count INTEGER := 0;
BEGIN
  SELECT id INTO v_tournament_id
  FROM tournaments 
  WHERE tournament_type = 'double_elimination' 
    AND status = 'ongoing'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Advance R201 winners to R202
  UPDATE tournament_matches 
  SET player1_id = (
    SELECT winner_id FROM tournament_matches tm_r201_1
    WHERE tm_r201_1.tournament_id = v_tournament_id
      AND tm_r201_1.round_number = 201
      AND tm_r201_1.match_number = 1
      AND tm_r201_1.status = 'completed'
  ),
  player2_id = (
    SELECT winner_id FROM tournament_matches tm_r201_2
    WHERE tm_r201_2.tournament_id = v_tournament_id
      AND tm_r201_2.round_number = 201
      AND tm_r201_2.match_number = 2
      AND tm_r201_2.status = 'completed'
  ),
  status = 'ready'
  WHERE tournament_id = v_tournament_id
    AND round_number = 202
    AND match_number = 1;
  
  GET DIAGNOSTICS v_advanced_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', v_tournament_id,
    'round', 'Losers R201',
    'advanced_count', v_advanced_count,
    'message', 'Losers R201 completion processed'
  );
END;
$$;

-- 5. Process Losers Branch B Round 2 Completion
CREATE OR REPLACE FUNCTION public.process_losers_r202_completion()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament_id UUID;
  v_lb_winner_id UUID;
BEGIN
  SELECT id INTO v_tournament_id
  FROM tournaments 
  WHERE tournament_type = 'double_elimination' 
    AND status = 'ongoing'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Get Losers Branch B winner
  SELECT winner_id INTO v_lb_winner_id
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id
    AND round_number = 202
    AND match_number = 1
    AND status = 'completed';
  
  IF v_lb_winner_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Losers Branch B final not completed');
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', v_tournament_id,
    'round', 'Losers R202',
    'lb_winner_id', v_lb_winner_id,
    'message', 'Losers Branch B completed, winner ready for semifinals'
  );
END;
$$;

-- 6. Setup Semifinals Pairings
CREATE OR REPLACE FUNCTION public.setup_semifinals_pairings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament_id UUID;
  v_wb_finalist_1 UUID;
  v_wb_finalist_2 UUID;
  v_la_winner UUID;
  v_lb_winner UUID;
BEGIN
  SELECT id INTO v_tournament_id
  FROM tournaments 
  WHERE tournament_type = 'double_elimination' 
    AND status = 'ongoing'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Get Winners Bracket finalists
  SELECT winner_id INTO v_wb_finalist_1
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id
    AND round_number = 3
    AND match_number = 1
    AND status = 'completed';
    
  SELECT winner_id INTO v_wb_finalist_2
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id
    AND round_number = 3
    AND match_number = 2
    AND status = 'completed';
  
  -- Get Losers Branch winners
  SELECT winner_id INTO v_la_winner
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id
    AND round_number = 103
    AND status = 'completed';
    
  SELECT winner_id INTO v_lb_winner
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id
    AND round_number = 202
    AND status = 'completed';
  
  -- Setup semifinal matches (Round 250)
  UPDATE tournament_matches 
  SET player1_id = v_wb_finalist_1,
      player2_id = v_la_winner,
      status = 'ready'
  WHERE tournament_id = v_tournament_id
    AND round_number = 250
    AND match_number = 1;
    
  UPDATE tournament_matches 
  SET player1_id = v_wb_finalist_2,
      player2_id = v_lb_winner,
      status = 'ready'
  WHERE tournament_id = v_tournament_id
    AND round_number = 250
    AND match_number = 2;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', v_tournament_id,
    'wb_finalist_1', v_wb_finalist_1,
    'wb_finalist_2', v_wb_finalist_2,
    'la_winner', v_la_winner,
    'lb_winner', v_lb_winner,
    'message', 'Semifinals pairings setup complete'
  );
END;
$$;

-- 7. Process Semifinals Completion
CREATE OR REPLACE FUNCTION public.process_semifinals_completion()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament_id UUID;
  v_finalist_1 UUID;
  v_finalist_2 UUID;
BEGIN
  SELECT id INTO v_tournament_id
  FROM tournaments 
  WHERE tournament_type = 'double_elimination' 
    AND status = 'ongoing'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Get semifinal winners
  SELECT winner_id INTO v_finalist_1
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id
    AND round_number = 250
    AND match_number = 1
    AND status = 'completed';
    
  SELECT winner_id INTO v_finalist_2
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id
    AND round_number = 250
    AND match_number = 2
    AND status = 'completed';
  
  -- Setup final match (Round 300)
  UPDATE tournament_matches 
  SET player1_id = v_finalist_1,
      player2_id = v_finalist_2,
      status = 'ready'
  WHERE tournament_id = v_tournament_id
    AND round_number = 300
    AND match_number = 1;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', v_tournament_id,
    'finalist_1', v_finalist_1,
    'finalist_2', v_finalist_2,
    'message', 'Final match setup complete'
  );
END;
$$;

-- 8. Update Tournament Status
CREATE OR REPLACE FUNCTION public.update_tournament_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament_id UUID;
  v_current_status TEXT;
  v_final_completed BOOLEAN;
BEGIN
  SELECT id, status INTO v_tournament_id, v_current_status
  FROM tournaments 
  WHERE tournament_type = 'double_elimination' 
    AND status = 'ongoing'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_tournament_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No active SABO tournament found');
  END IF;
  
  -- Check if final is completed
  SELECT EXISTS(
    SELECT 1 FROM tournament_matches 
    WHERE tournament_id = v_tournament_id
      AND round_number = 300
      AND status = 'completed'
      AND winner_id IS NOT NULL
  ) INTO v_final_completed;
  
  IF v_final_completed THEN
    UPDATE tournaments 
    SET status = 'completed',
        completed_at = NOW()
    WHERE id = v_tournament_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'tournament_id', v_tournament_id,
      'old_status', v_current_status,
      'new_status', 'completed',
      'message', 'Tournament completed'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', v_tournament_id,
    'status', v_current_status,
    'message', 'Tournament status unchanged'
  );
END;
$$;

-- 9. Finalize Tournament
CREATE OR REPLACE FUNCTION public.finalize_tournament()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament_id UUID;
  v_champion_id UUID;
  v_runner_up_id UUID;
BEGIN
  SELECT id INTO v_tournament_id
  FROM tournaments 
  WHERE tournament_type = 'double_elimination' 
    AND status = 'completed'
  ORDER BY completed_at DESC
  LIMIT 1;
  
  IF v_tournament_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No completed SABO tournament found');
  END IF;
  
  -- Get final match results
  SELECT winner_id,
         CASE WHEN player1_id = winner_id THEN player2_id ELSE player1_id END
  INTO v_champion_id, v_runner_up_id
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id
    AND round_number = 300
    AND status = 'completed';
  
  -- Update player rankings (basic example)
  UPDATE player_rankings 
  SET spa_points = spa_points + 500,
      wins = wins + 1
  WHERE user_id = v_champion_id;
  
  UPDATE player_rankings 
  SET spa_points = spa_points + 300
  WHERE user_id = v_runner_up_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', v_tournament_id,
    'champion_id', v_champion_id,
    'runner_up_id', v_runner_up_id,
    'message', 'Tournament finalized and prizes awarded'
  );
END;
$$;

-- ========================================
-- PHASE 3: CLEAN UP CURRENT TOURNAMENT STATE
-- ========================================

-- Reset duplicate player assignments in current tournament
UPDATE tournament_matches 
SET player1_id = NULL,
    player2_id = NULL,
    status = 'pending'
WHERE tournament_id IN (
  SELECT id FROM tournaments 
  WHERE tournament_type = 'double_elimination' 
    AND status = 'ongoing'
)
AND (
  -- Matches with duplicate players
  player1_id = player2_id
  OR player1_id IS NULL 
  OR player2_id IS NULL
  OR round_number > 1 -- Reset all advancement matches to clean state
);

-- Log the cleanup
INSERT INTO tournament_automation_log (
  tournament_id,
  automation_type,
  status,
  details,
  completed_at
)
SELECT 
  id,
  'tournament_cleanup',
  'completed',
  jsonb_build_object(
    'cleanup_type', 'remove_duplicate_players_and_reset_advancement',
    'reason', 'Fixed problematic advancement logic'
  ),
  NOW()
FROM tournaments 
WHERE tournament_type = 'double_elimination' 
  AND status = 'ongoing';