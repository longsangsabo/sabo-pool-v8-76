-- Fix bracket generation to create all rounds
CREATE OR REPLACE FUNCTION public.generate_complete_tournament_bracket(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_participants UUID[];
  v_participant_count INTEGER;
  v_rounds_needed INTEGER;
  v_matches_created INTEGER := 0;
  v_current_round_matches INTEGER;
  i INTEGER;
  j INTEGER;
BEGIN
  -- Get confirmed participants
  SELECT array_agg(user_id) INTO v_participants
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id 
  AND registration_status = 'confirmed'
  AND payment_status = 'paid';
  
  v_participant_count := array_length(v_participants, 1);
  
  IF v_participant_count < 2 THEN
    RETURN jsonb_build_object('error', 'Need at least 2 participants');
  END IF;
  
  -- Calculate rounds needed (for power of 2, or next power of 2)
  v_rounds_needed := CEIL(LOG(2, v_participant_count));
  
  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Create first round matches with actual participants
  FOR i IN 1..v_participant_count BY 2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, (i + 1) / 2,
      v_participants[i],
      CASE WHEN i + 1 <= v_participant_count THEN v_participants[i + 1] ELSE NULL END,
      'scheduled', NOW(), NOW()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- Create placeholder matches for subsequent rounds
  v_current_round_matches := CEIL(v_participant_count::DECIMAL / 2);
  
  FOR i IN 2..v_rounds_needed LOOP
    v_current_round_matches := CEIL(v_current_round_matches::DECIMAL / 2);
    
    FOR j IN 1..v_current_round_matches LOOP
      INSERT INTO tournament_matches (
        tournament_id, round_number, match_number, 
        status, created_at, updated_at
      ) VALUES (
        p_tournament_id, i, j, 'pending', NOW(), NOW()
      );
      v_matches_created := v_matches_created + 1;
    END LOOP;
  END LOOP;
  
  -- Update tournament
  UPDATE tournaments 
  SET has_bracket = true, updated_at = NOW()
  WHERE id = p_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'matches_created', v_matches_created,
    'rounds', v_rounds_needed,
    'participants', v_participant_count
  );
END;
$function$;