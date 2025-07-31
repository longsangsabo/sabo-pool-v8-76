-- Simple function to fix duplicate players in loser brackets
CREATE OR REPLACE FUNCTION public.fix_duplicate_players_in_losers(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER  
SET search_path TO 'public'
AS $$
DECLARE
  v_participants uuid[];
  v_result jsonb;
BEGIN
  -- Get all confirmed participants
  SELECT array_agg(user_id ORDER BY created_at)
  INTO v_participants
  FROM tournament_registrations
  WHERE tournament_id = p_tournament_id 
    AND registration_status = 'confirmed';

  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Create Winners Bracket Round 1 with proper pairing
  INSERT INTO tournament_matches (tournament_id, bracket_type, round_number, match_number, player1_id, player2_id, status)
  VALUES 
    (p_tournament_id, 'winners', 1, 1, v_participants[1], v_participants[2], 'scheduled'),
    (p_tournament_id, 'winners', 1, 2, v_participants[3], v_participants[4], 'scheduled'),
    (p_tournament_id, 'winners', 1, 3, v_participants[5], v_participants[6], 'scheduled'),
    (p_tournament_id, 'winners', 1, 4, v_participants[7], v_participants[8], 'scheduled'),
    (p_tournament_id, 'winners', 1, 5, v_participants[9], v_participants[10], 'scheduled'),
    (p_tournament_id, 'winners', 1, 6, v_participants[11], v_participants[12], 'scheduled'),
    (p_tournament_id, 'winners', 1, 7, v_participants[13], v_participants[14], 'scheduled'),
    (p_tournament_id, 'winners', 1, 8, v_participants[15], v_participants[16], 'scheduled');

  -- Winners Bracket Round 2 (4 matches, empty for now)
  INSERT INTO tournament_matches (tournament_id, bracket_type, round_number, match_number, status)
  VALUES 
    (p_tournament_id, 'winners', 2, 1, 'scheduled'),
    (p_tournament_id, 'winners', 2, 2, 'scheduled'),
    (p_tournament_id, 'winners', 2, 3, 'scheduled'),
    (p_tournament_id, 'winners', 2, 4, 'scheduled');

  -- Winners Bracket Round 3 (2 matches, empty for now)
  INSERT INTO tournament_matches (tournament_id, bracket_type, round_number, match_number, status)
  VALUES 
    (p_tournament_id, 'winners', 3, 1, 'scheduled'),
    (p_tournament_id, 'winners', 3, 2, 'scheduled');

  -- Losers Branch A (empty for now, will be filled by advancement logic)
  INSERT INTO tournament_matches (tournament_id, bracket_type, round_number, match_number, status)
  VALUES 
    (p_tournament_id, 'losers_branch_a', 1, 1, 'scheduled'),
    (p_tournament_id, 'losers_branch_a', 1, 2, 'scheduled'),
    (p_tournament_id, 'losers_branch_a', 1, 3, 'scheduled'),
    (p_tournament_id, 'losers_branch_a', 1, 4, 'scheduled'),
    (p_tournament_id, 'losers_branch_a', 2, 1, 'scheduled'),
    (p_tournament_id, 'losers_branch_a', 2, 2, 'scheduled'),
    (p_tournament_id, 'losers_branch_a', 3, 1, 'scheduled');

  -- Losers Branch B (empty for now, will be filled by advancement logic)
  INSERT INTO tournament_matches (tournament_id, bracket_type, round_number, match_number, status)
  VALUES 
    (p_tournament_id, 'losers_branch_b', 1, 1, 'scheduled'),
    (p_tournament_id, 'losers_branch_b', 1, 2, 'scheduled'),
    (p_tournament_id, 'losers_branch_b', 2, 1, 'scheduled');

  -- Semifinals (2 matches)
  INSERT INTO tournament_matches (tournament_id, bracket_type, round_number, match_number, status)
  VALUES 
    (p_tournament_id, 'semifinal', 1, 1, 'scheduled'),
    (p_tournament_id, 'semifinal', 1, 2, 'scheduled');

  -- Final (1 match)
  INSERT INTO tournament_matches (tournament_id, bracket_type, round_number, match_number, status)
  VALUES 
    (p_tournament_id, 'final', 1, 1, 'scheduled');

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Tournament bracket recreated successfully with proper player pairing',
    'total_matches', 27
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;