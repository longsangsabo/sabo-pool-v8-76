-- Script để rebuild Double Elimination bracket cho tournament đã hoàn thành
CREATE OR REPLACE FUNCTION rebuild_double_elimination_bracket(tournament_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  completed_matches RECORD;
  advancement_result jsonb;
  total_fixed INTEGER := 0;
BEGIN
  -- Get all completed matches that need to be processed
  FOR completed_matches IN 
    SELECT id, winner_id, bracket_type, round_number, match_number
    FROM tournament_matches 
    WHERE tournament_id = tournament_uuid 
    AND status = 'completed' 
    AND winner_id IS NOT NULL
    ORDER BY bracket_type, round_number, match_number
  LOOP
    -- Use the new advancement function for each completed match
    SELECT advance_double_elimination_winner(
      completed_matches.id, 
      completed_matches.winner_id
    ) INTO advancement_result;
    
    -- Log the result
    RAISE NOTICE 'Processed match %: %', completed_matches.id, advancement_result;
    total_fixed := total_fixed + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', tournament_uuid,
    'matches_processed', total_fixed,
    'message', 'Double elimination bracket rebuilt successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'matches_processed', total_fixed
    );
END;
$$;

-- Execute the rebuild for the tournament
SELECT rebuild_double_elimination_bracket('d8f6f334-7fa0-4dc3-9804-1d25379d9d07');