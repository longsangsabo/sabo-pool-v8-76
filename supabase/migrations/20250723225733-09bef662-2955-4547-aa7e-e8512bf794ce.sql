-- Create a comprehensive repair function for tournaments with advancement issues
CREATE OR REPLACE FUNCTION public.repair_tournament_advancement(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_participants INTEGER;
  v_expected_rounds INTEGER;
  v_current_max_round INTEGER;
  v_repaired_matches INTEGER := 0;
  v_created_matches INTEGER := 0;
  v_round INTEGER;
  v_winners uuid[];
  v_next_matches INTEGER;
  v_match_id uuid;
  i INTEGER;
BEGIN
  -- Get tournament info and participant count
  SELECT t.*, COUNT(tr.user_id) as participant_count INTO v_tournament
  FROM tournaments t
  LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id AND tr.registration_status = 'confirmed'
  WHERE t.id = p_tournament_id
  GROUP BY t.id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  v_participants := v_tournament.participant_count;
  v_expected_rounds := CEIL(LOG(2, v_participants));
  
  -- Get current max round
  SELECT COALESCE(MAX(round_number), 0) INTO v_current_max_round
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id;
  
  RAISE NOTICE 'Repairing tournament % with % participants, expected % rounds, current max round %',
    p_tournament_id, v_participants, v_expected_rounds, v_current_max_round;
  
  -- Process each round to fix progression
  FOR v_round IN 1..v_expected_rounds LOOP
    -- Get winners from current round
    SELECT array_agg(winner_id ORDER BY match_number) INTO v_winners
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
    AND round_number = v_round
    AND winner_id IS NOT NULL
    AND status = 'completed';
    
    -- If this round has completed matches but next round doesn't exist, create it
    IF array_length(v_winners, 1) > 0 AND v_round < v_expected_rounds THEN
      -- Check if next round exists
      SELECT COUNT(*) INTO v_next_matches
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
      AND round_number = v_round + 1;
      
      -- If next round doesn't exist, create it
      IF v_next_matches = 0 THEN
        v_next_matches := CEIL(array_length(v_winners, 1)::DECIMAL / 2);
        
        RAISE NOTICE 'Creating % matches for round %', v_next_matches, v_round + 1;
        
        FOR i IN 1..v_next_matches LOOP
          INSERT INTO tournament_matches (
            tournament_id,
            round_number,
            match_number,
            player1_id,
            player2_id,
            status,
            created_at,
            updated_at
          ) VALUES (
            p_tournament_id,
            v_round + 1,
            i,
            CASE WHEN (i-1)*2+1 <= array_length(v_winners, 1) THEN v_winners[(i-1)*2+1] ELSE NULL END,
            CASE WHEN (i-1)*2+2 <= array_length(v_winners, 1) THEN v_winners[(i-1)*2+2] ELSE NULL END,
            CASE WHEN (i-1)*2+2 <= array_length(v_winners, 1) THEN 'scheduled' ELSE 'pending' END,
            NOW(),
            NOW()
          );
          
          v_created_matches := v_created_matches + 1;
        END LOOP;
      ELSE
        -- Next round exists, fix any missing players
        FOR i IN 1..CEIL(array_length(v_winners, 1)::DECIMAL / 2) LOOP
          -- Get the match that should contain these winners
          SELECT id INTO v_match_id
          FROM tournament_matches
          WHERE tournament_id = p_tournament_id
          AND round_number = v_round + 1
          AND match_number = i;
          
          IF v_match_id IS NOT NULL THEN
            -- Update match with correct players
            UPDATE tournament_matches
            SET 
              player1_id = CASE WHEN (i-1)*2+1 <= array_length(v_winners, 1) THEN v_winners[(i-1)*2+1] ELSE player1_id END,
              player2_id = CASE WHEN (i-1)*2+2 <= array_length(v_winners, 1) THEN v_winners[(i-1)*2+2] ELSE player2_id END,
              status = CASE 
                WHEN (i-1)*2+2 <= array_length(v_winners, 1) THEN 'scheduled'
                WHEN (i-1)*2+1 <= array_length(v_winners, 1) THEN 'pending'
                ELSE status
              END,
              updated_at = NOW()
            WHERE id = v_match_id
            AND (player1_id IS NULL OR player2_id IS NULL);
            
            IF FOUND THEN
              v_repaired_matches := v_repaired_matches + 1;
            END IF;
          END IF;
        END LOOP;
      END IF;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'participants', v_participants,
    'expected_rounds', v_expected_rounds,
    'current_max_round', v_current_max_round,
    'repaired_matches', v_repaired_matches,
    'created_matches', v_created_matches,
    'message', format('Repaired %s matches and created %s new matches', v_repaired_matches, v_created_matches)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Repair failed: %s', SQLERRM),
      'tournament_id', p_tournament_id
    );
END;
$function$;