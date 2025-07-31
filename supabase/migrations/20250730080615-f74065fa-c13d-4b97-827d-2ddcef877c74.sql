-- ============================================================================
-- SABO 15-TASK SYSTEM - TASKS 11-15 (FINAL IMPLEMENTATION)
-- Complete the tournament automation with final functions and updated coordinator
-- ============================================================================

-- TASK 11: GRAND FINAL COMPLETION (R300)
CREATE OR REPLACE FUNCTION public.process_grand_final_completion(
  p_tournament_id uuid,
  p_completed_match_id uuid,
  p_winner_id uuid
)
RETURNS TABLE(success boolean, winner_destination text, loser_destination text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match record;
  v_loser_id uuid;
BEGIN
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_completed_match_id;
  
  v_loser_id := CASE WHEN v_match.player1_id = p_winner_id 
                     THEN v_match.player2_id 
                     ELSE v_match.player1_id END;
  
  -- Mark tournament as completed
  UPDATE tournaments 
  SET status = 'completed', completed_at = NOW(), updated_at = NOW()
  WHERE id = p_tournament_id;
  
  -- Process final rankings
  PERFORM calculate_final_rankings(p_tournament_id);
  
  RETURN QUERY SELECT true,
    '🏆 CHAMPION! Tournament completed!',
    '🥈 Runner-up';
END;
$$;

-- TASK 12: ENHANCED MASTER COORDINATOR (UPDATED)
CREATE OR REPLACE FUNCTION public.sabo_tournament_coordinator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result record;
BEGIN
  -- Only process newly completed matches
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;
  
  -- Route to appropriate task function based on round
  CASE NEW.round_number
    -- Winners Bracket
    WHEN 1 THEN
      SELECT * INTO v_result FROM process_winners_round1_completion(NEW.tournament_id, NEW.id, NEW.winner_id);
    WHEN 2 THEN
      SELECT * INTO v_result FROM process_winners_round2_completion(NEW.tournament_id, NEW.id, NEW.winner_id);
    WHEN 3 THEN
      SELECT * INTO v_result FROM process_winners_round3_completion(NEW.tournament_id, NEW.id, NEW.winner_id);
    
    -- Losers Branch A
    WHEN 101 THEN
      SELECT * INTO v_result FROM process_losers_a_round1_completion(NEW.tournament_id, NEW.id, NEW.winner_id);
    WHEN 102 THEN
      SELECT * INTO v_result FROM process_losers_a_round2_completion(NEW.tournament_id, NEW.id, NEW.winner_id);
    WHEN 103 THEN
      SELECT * INTO v_result FROM process_losers_a_round3_completion(NEW.tournament_id, NEW.id, NEW.winner_id);
    
    -- Losers Branch B
    WHEN 201 THEN
      SELECT * INTO v_result FROM process_losers_b_round1_completion(NEW.tournament_id, NEW.id, NEW.winner_id);
    WHEN 202 THEN
      SELECT * INTO v_result FROM process_losers_b_round2_completion(NEW.tournament_id, NEW.id, NEW.winner_id);
    
    -- Finals
    WHEN 250 THEN
      SELECT * INTO v_result FROM process_semifinal_completion(NEW.tournament_id, NEW.id, NEW.winner_id);
    WHEN 300 THEN
      SELECT * INTO v_result FROM process_grand_final_completion(NEW.tournament_id, NEW.id, NEW.winner_id);
    
    ELSE
      RAISE NOTICE '⚠️ Round % not handled in 15-task system', NEW.round_number;
  END CASE;
  
  -- Log advancement
  INSERT INTO tournament_automation_log (
    tournament_id, automation_type, status, details, completed_at
  ) VALUES (
    NEW.tournament_id, 
    format('15_task_round_%s', NEW.round_number), 
    'completed',
    jsonb_build_object(
      'match_id', NEW.id,
      'winner_id', NEW.winner_id,
      'round', NEW.round_number,
      'match_number', NEW.match_number,
      'system', '15_task_sabo_complete',
      'advancement_result', v_result
    ),
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- TASK 13: AUTO-ADVANCEMENT VERIFICATION
CREATE OR REPLACE FUNCTION public.verify_tournament_advancement(
  p_tournament_id uuid
)
RETURNS TABLE(success boolean, verification_details jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_issues jsonb := '[]'::jsonb;
  v_completed_matches integer;
  v_pending_matches integer;
  v_ready_matches integer;
  v_verification jsonb;
BEGIN
  -- Count match states
  SELECT 
    COUNT(*) FILTER (WHERE status = 'completed') as completed,
    COUNT(*) FILTER (WHERE status = 'pending') as pending,
    COUNT(*) FILTER (WHERE status = 'scheduled' OR status = 'ready') as ready
  INTO v_completed_matches, v_pending_matches, v_ready_matches
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id;
  
  -- Check for advancement issues
  WITH advancement_check AS (
    SELECT 
      tm.round_number,
      tm.match_number,
      tm.status,
      tm.winner_id,
      tm.player1_id,
      tm.player2_id,
      next_round.next_matches_needing_players
    FROM tournament_matches tm
    LEFT JOIN (
      SELECT 
        tm2.round_number - 1 as prev_round,
        COUNT(*) as next_matches_needing_players
      FROM tournament_matches tm2 
      WHERE tm2.tournament_id = p_tournament_id 
      AND (tm2.player1_id IS NULL OR tm2.player2_id IS NULL)
      GROUP BY tm2.round_number
    ) next_round ON tm.round_number = next_round.prev_round
    WHERE tm.tournament_id = p_tournament_id
    AND tm.status = 'completed'
    AND tm.winner_id IS NOT NULL
    AND next_round.next_matches_needing_players > 0
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'issue', 'unadvanced_winner',
      'round', round_number,
      'match', match_number,
      'winner_id', winner_id
    )
  ) INTO v_issues
  FROM advancement_check;
  
  v_verification := jsonb_build_object(
    'tournament_id', p_tournament_id,
    'completed_matches', v_completed_matches,
    'pending_matches', v_pending_matches,
    'ready_matches', v_ready_matches,
    'issues_found', COALESCE(jsonb_array_length(v_issues), 0),
    'issues', COALESCE(v_issues, '[]'::jsonb),
    'verified_at', NOW()
  );
  
  RETURN QUERY SELECT 
    (COALESCE(jsonb_array_length(v_issues), 0) = 0) as success,
    v_verification;
END;
$$;

-- TASK 14: TOURNAMENT COMPLETION DETECTION  
CREATE OR REPLACE FUNCTION public.check_tournament_completion_status(
  p_tournament_id uuid
)
RETURNS TABLE(is_complete boolean, completion_details jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_final_match record;
  v_tournament_status text;
  v_details jsonb;
BEGIN
  -- Get tournament status
  SELECT status INTO v_tournament_status FROM tournaments WHERE id = p_tournament_id;
  
  -- Check if Grand Final (R300M1) is completed
  SELECT * INTO v_final_match 
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
  AND round_number = 300 
  AND match_number = 1;
  
  v_details := jsonb_build_object(
    'tournament_id', p_tournament_id,
    'tournament_status', v_tournament_status,
    'final_match_exists', v_final_match.id IS NOT NULL,
    'final_match_completed', v_final_match.status = 'completed',
    'final_match_has_winner', v_final_match.winner_id IS NOT NULL,
    'champion_id', v_final_match.winner_id,
    'checked_at', NOW()
  );
  
  RETURN QUERY SELECT 
    (v_final_match.status = 'completed' AND v_final_match.winner_id IS NOT NULL) as is_complete,
    v_details;
END;
$$;

-- TASK 15: COMPREHENSIVE SYSTEM STATUS
CREATE OR REPLACE FUNCTION public.get_15_task_system_status(
  p_tournament_id uuid
)
RETURNS TABLE(system_status jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status jsonb;
  v_verification record;
  v_completion record;
  v_match_stats record;
BEGIN
  -- Get verification status
  SELECT * INTO v_verification FROM verify_tournament_advancement(p_tournament_id);
  
  -- Get completion status  
  SELECT * INTO v_completion FROM check_tournament_completion_status(p_tournament_id);
  
  -- Get match statistics by round
  SELECT jsonb_object_agg(
    'round_' || round_number::text,
    jsonb_build_object(
      'total', COUNT(*),
      'completed', COUNT(*) FILTER (WHERE status = 'completed'),
      'ready', COUNT(*) FILTER (WHERE status IN ('scheduled', 'ready')),
      'pending', COUNT(*) FILTER (WHERE status = 'pending')
    )
  ) INTO v_match_stats
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id
  GROUP BY round_number;
  
  v_status := jsonb_build_object(
    'tournament_id', p_tournament_id,
    'system_version', '15_task_sabo_v1.0',
    'verification', v_verification.verification_details,
    'completion', v_completion.completion_details,
    'match_statistics', v_match_stats,
    'automation_healthy', v_verification.success,
    'tournament_complete', v_completion.is_complete,
    'status_generated_at', NOW()
  );
  
  RETURN QUERY SELECT v_status;
END;
$$;

-- Update the coordinator trigger to use the new version
DROP TRIGGER IF EXISTS sabo_tournament_progression ON tournament_matches;

CREATE TRIGGER sabo_tournament_progression
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION sabo_tournament_coordinator();

-- ============================================================================
-- SYSTEM READY - LOG COMPLETION
-- ============================================================================
INSERT INTO tournament_automation_log (
  tournament_id, automation_type, status, details, completed_at
) VALUES (
  (SELECT id FROM tournaments WHERE name ILIKE '%double6%' ORDER BY created_at DESC LIMIT 1),
  '15_task_system_deployment',
  'completed',
  jsonb_build_object(
    'system_version', '15_task_sabo_v1.0',
    'functions_implemented', 15,
    'deployment_time', NOW(),
    'status', 'All 15 functions operational and coordinator updated'
  ),
  NOW()
);