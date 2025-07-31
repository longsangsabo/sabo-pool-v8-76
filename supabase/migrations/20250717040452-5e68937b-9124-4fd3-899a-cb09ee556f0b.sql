-- Fix partial automation update - ensure all loser bracket matches have proper branch_type

-- First, let's check the current state and fix any missing branch_type for existing tournaments
UPDATE tournament_matches 
SET branch_type = 'branch_a'
WHERE bracket_type = 'loser' 
AND round_number IN (4, 5, 6)
AND branch_type IS NULL;

UPDATE tournament_matches 
SET branch_type = 'branch_b'
WHERE bracket_type = 'loser' 
AND round_number IN (7, 8)
AND branch_type IS NULL;

-- Create a comprehensive function to fix all automation gaps for a tournament
CREATE OR REPLACE FUNCTION fix_tournament_automation_gaps(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_completed_winner_matches RECORD;
  v_fixed_count INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Get all completed winner bracket matches that might need automation
  FOR v_completed_winner_matches IN
    SELECT 
      id,
      round_number,
      match_number,
      winner_id,
      player1_id,
      player2_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
    AND bracket_type = 'winner'
    AND status = 'completed'
    AND winner_id IS NOT NULL
    ORDER BY round_number, match_number
  LOOP
    -- Run automation for each completed match to ensure no gaps
    PERFORM advance_double_elimination_winner_v2(
      v_completed_winner_matches.id,
      v_completed_winner_matches.winner_id
    );
    
    v_fixed_count := v_fixed_count + 1;
  END LOOP;
  
  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'fixed_matches', v_fixed_count,
    'message', 'Tournament automation gaps fixed'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'fixed_matches', v_fixed_count
  );
END;
$$;

-- Create a function to force complete data refresh for UI
CREATE OR REPLACE FUNCTION refresh_tournament_bracket_data(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_total_matches INTEGER;
  v_completed_matches INTEGER;
  v_loser_matches INTEGER;
BEGIN
  -- Count matches for verification
  SELECT COUNT(*) INTO v_total_matches
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id;
  
  SELECT COUNT(*) INTO v_completed_matches
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id
  AND status = 'completed';
  
  SELECT COUNT(*) INTO v_loser_matches
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id
  AND bracket_type = 'loser'
  AND (player1_id IS NOT NULL OR player2_id IS NOT NULL);
  
  -- Trigger a notification for real-time updates
  PERFORM pg_notify('tournament_bracket_updated', 
    json_build_object(
      'tournament_id', p_tournament_id,
      'total_matches', v_total_matches,
      'completed_matches', v_completed_matches,
      'loser_matches', v_loser_matches,
      'timestamp', extract(epoch from now())
    )::text
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'total_matches', v_total_matches,
    'completed_matches', v_completed_matches,
    'loser_matches', v_loser_matches
  );
END;
$$;