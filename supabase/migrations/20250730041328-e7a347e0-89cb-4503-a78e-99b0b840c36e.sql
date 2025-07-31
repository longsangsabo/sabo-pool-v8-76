-- Comprehensive fix for loser bracket advancement issues
-- This will properly set up the bracket structure and prevent duplicate players

CREATE OR REPLACE FUNCTION public.fix_complete_bracket_structure()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament_id UUID;
  v_fix_result JSONB;
  v_count INTEGER;
BEGIN
  -- Get tournament ID
  SELECT id INTO v_tournament_id 
  FROM tournaments 
  WHERE name ILIKE '%test%' 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF v_tournament_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- 1. First clear all problematic loser bracket matches
  UPDATE tournament_matches 
  SET player1_id = NULL, player2_id = NULL, status = 'pending'
  WHERE tournament_id = v_tournament_id 
  AND bracket_type = 'losers'
  AND round_number IN (103, 202); -- Clear only finals for now
  
  -- 2. Check if we have any completed matches in round 102 and 201
  SELECT COUNT(*) INTO v_count
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id 
  AND bracket_type = 'losers'
  AND round_number = 102
  AND status = 'completed'
  AND winner_id IS NOT NULL;
  
  -- 3. If we have 2 winners from Branch A semifinal (102), advance them to final (103)
  IF v_count = 2 THEN
    UPDATE tournament_matches 
    SET player1_id = (
      SELECT winner_id 
      FROM tournament_matches 
      WHERE tournament_id = v_tournament_id 
      AND bracket_type = 'losers' 
      AND round_number = 102 
      AND match_number = 1
      AND status = 'completed'
    ),
    player2_id = (
      SELECT winner_id 
      FROM tournament_matches 
      WHERE tournament_id = v_tournament_id 
      AND bracket_type = 'losers' 
      AND round_number = 102 
      AND match_number = 2
      AND status = 'completed'
    ),
    status = 'scheduled'
    WHERE tournament_id = v_tournament_id 
    AND bracket_type = 'losers' 
    AND round_number = 103 
    AND match_number = 1;
  END IF;
  
  -- 4. Check Branch B semifinals
  SELECT COUNT(*) INTO v_count
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id 
  AND bracket_type = 'losers'
  AND round_number = 201
  AND status = 'completed'
  AND winner_id IS NOT NULL;
  
  -- 5. If we have 2 winners from Branch B semifinal (201), advance them to final (202)
  IF v_count = 2 THEN
    UPDATE tournament_matches 
    SET player1_id = (
      SELECT winner_id 
      FROM tournament_matches 
      WHERE tournament_id = v_tournament_id 
      AND bracket_type = 'losers' 
      AND round_number = 201 
      AND match_number = 1
      AND status = 'completed'
    ),
    player2_id = (
      SELECT winner_id 
      FROM tournament_matches 
      WHERE tournament_id = v_tournament_id 
      AND bracket_type = 'losers' 
      AND round_number = 201 
      AND match_number = 2
      AND status = 'completed'
    ),
    status = 'scheduled'
    WHERE tournament_id = v_tournament_id 
    AND bracket_type = 'losers' 
    AND round_number = 202 
    AND match_number = 1;
  END IF;
  
  -- 6. Verify no duplicates exist
  UPDATE tournament_matches 
  SET player2_id = NULL, status = 'pending'
  WHERE tournament_id = v_tournament_id 
  AND bracket_type = 'losers'
  AND player1_id = player2_id 
  AND player1_id IS NOT NULL;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', v_tournament_id,
    'fixed_at', NOW(),
    'message', 'Bracket structure fixed and duplicates removed'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Execute the comprehensive fix
SELECT fix_complete_bracket_structure();