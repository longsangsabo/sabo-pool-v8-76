-- Create function to populate SABO tournament with players
CREATE OR REPLACE FUNCTION populate_sabo_tournament_players(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_registered_players UUID[];
  v_result JSONB;
  v_updated_count INTEGER := 0;
BEGIN
  -- Get registered players in order
  SELECT array_agg(tr.user_id ORDER BY tr.created_at)
  INTO v_registered_players
  FROM tournament_registrations tr 
  WHERE tr.tournament_id = p_tournament_id
    AND tr.registration_status = 'confirmed'
  LIMIT 16;
  
  IF array_length(v_registered_players, 1) < 16 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Need exactly 16 players, found: ' || COALESCE(array_length(v_registered_players, 1), 0)
    );
  END IF;
  
  -- Populate first round winners bracket matches (1v2, 3v4, 5v6, etc.)
  UPDATE tournament_matches 
  SET 
    player1_id = v_registered_players[(match_number * 2) - 1],
    player2_id = v_registered_players[match_number * 2],
    status = 'scheduled',
    updated_at = NOW()
  WHERE tournament_id = p_tournament_id
    AND round_number = 1 
    AND bracket_type = 'winners';
    
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'players_assigned', array_length(v_registered_players, 1),
    'matches_populated', v_updated_count,
    'message', 'Successfully populated SABO tournament first round'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;