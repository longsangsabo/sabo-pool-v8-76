-- Fix the has_bracket column issue in double elimination function
CREATE OR REPLACE FUNCTION public.generate_modified_double_elimination(
  p_tournament_id uuid, 
  p_participants uuid[]
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_participant_count INTEGER;
  v_match_number INTEGER;
  i INTEGER;
  v_bracket_data JSONB;
BEGIN
  v_participant_count := array_length(p_participants, 1);
  
  -- Ensure exactly 16 participants
  IF v_participant_count != 16 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Modified double elimination requires exactly 16 participants');
  END IF;
  
  -- Clear existing matches
  DELETE FROM public.tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Generate Winner Bracket - Round 1 (8 matches)
  FOR i IN 1..8 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, i,
      p_participants[(i-1)*2+1], p_participants[(i-1)*2+2],
      'scheduled', 'winner',
      now(), now()
    );
  END LOOP;
  
  -- Generate Winner Bracket - Round 2 (4 matches)
  FOR i IN 1..4 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 2, i,
      NULL, NULL, 'pending', 'winner',
      now(), now()
    );
  END LOOP;
  
  -- Generate Winner Bracket - Round 3 (2 matches)
  FOR i IN 1..2 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 3, i,
      NULL, NULL, 'pending', 'winner',
      now(), now()
    );
  END LOOP;
  
  -- Generate Winner Bracket - Round 4 (1 match - Winner Final)
  INSERT INTO public.tournament_matches (
    tournament_id, round_number, match_number,
    player1_id, player2_id, status, bracket_type,
    created_at, updated_at
  ) VALUES (
    p_tournament_id, 4, 1,
    NULL, NULL, 'pending', 'winner',
    now(), now()
  );
  
  -- Generate Loser Bracket - Round 1 (4 matches)
  FOR i IN 1..4 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, i,
      NULL, NULL, 'pending', 'loser',
      now(), now()
    );
  END LOOP;
  
  -- Generate Loser Bracket - Round 2 (2 matches)
  FOR i IN 1..2 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 2, i,
      NULL, NULL, 'pending', 'loser',
      now(), now()
    );
  END LOOP;
  
  -- Generate Loser Bracket - Round 3 (2 matches)
  FOR i IN 1..2 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 3, i,
      NULL, NULL, 'pending', 'loser',
      now(), now()
    );
  END LOOP;
  
  -- Generate Loser Bracket - Round 4 (1 match)
  INSERT INTO public.tournament_matches (
    tournament_id, round_number, match_number,
    player1_id, player2_id, status, bracket_type,
    created_at, updated_at
  ) VALUES (
    p_tournament_id, 4, 1,
    NULL, NULL, 'pending', 'loser',
    now(), now()
  );
  
  -- Generate Loser Bracket - Round 5 (1 match - Loser Final)
  INSERT INTO public.tournament_matches (
    tournament_id, round_number, match_number,
    player1_id, player2_id, status, bracket_type,
    created_at, updated_at
  ) VALUES (
    p_tournament_id, 5, 1,
    NULL, NULL, 'pending', 'loser',
    now(), now()
  );
  
  -- Generate Grand Final (1 match)
  INSERT INTO public.tournament_matches (
    tournament_id, round_number, match_number,
    player1_id, player2_id, status, bracket_type,
    created_at, updated_at
  ) VALUES (
    p_tournament_id, 1, 1,
    NULL, NULL, 'pending', 'grand_final',
    now(), now()
  );
  
  -- Update tournament status (remove has_bracket reference)
  UPDATE public.tournaments
  SET status = 'in_progress',
      updated_at = now()
  WHERE id = p_tournament_id;
  
  -- Create bracket data
  v_bracket_data := jsonb_build_object(
    'tournament_id', p_tournament_id,
    'type', 'modified_double_elimination',
    'participants_count', v_participant_count,
    'winner_bracket_rounds', 4,
    'loser_bracket_rounds', 5,
    'generated_at', now()
  );
  
  -- Store bracket in tournament_brackets table
  INSERT INTO public.tournament_brackets (tournament_id, bracket_data, created_at)
  VALUES (p_tournament_id, v_bracket_data, now())
  ON CONFLICT (tournament_id) 
  DO UPDATE SET 
    bracket_data = EXCLUDED.bracket_data,
    updated_at = now();
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'bracket_type', 'modified_double_elimination',
    'total_matches', (
      SELECT COUNT(*) FROM public.tournament_matches 
      WHERE tournament_id = p_tournament_id
    ),
    'message', 'Modified double elimination bracket generated successfully'
  );
END;
$$;

-- Also fix the main function to remove has_bracket
CREATE OR REPLACE FUNCTION public.generate_advanced_tournament_bracket(
  p_tournament_id uuid, 
  p_seeding_method text DEFAULT 'elo_ranking'::text, 
  p_force_regenerate boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tournament RECORD;
  v_participants_count INTEGER;
  v_participants UUID[];
  v_result JSONB;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament
  FROM public.tournaments
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  -- Check if bracket already exists and force regenerate is false
  IF EXISTS (
    SELECT 1 FROM public.tournament_brackets 
    WHERE tournament_id = p_tournament_id
  ) AND NOT p_force_regenerate THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bracket already exists. Use force_regenerate=true to recreate.');
  END IF;
  
  -- Get confirmed participants
  SELECT ARRAY_AGG(user_id ORDER BY 
    CASE 
      WHEN p_seeding_method = 'elo_ranking' THEN 
        COALESCE((
          SELECT pr.elo_points 
          FROM public.player_rankings pr 
          WHERE pr.user_id = tr.user_id
        ), 1000)
      ELSE extract(epoch from tr.created_at)
    END DESC
  ) INTO v_participants
  FROM public.tournament_registrations tr
  WHERE tr.tournament_id = p_tournament_id 
    AND tr.registration_status = 'confirmed';
  
  v_participants_count := COALESCE(array_length(v_participants, 1), 0);
  
  IF v_participants_count < 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough participants');
  END IF;
  
  -- Route to appropriate bracket generation based on tournament type
  IF v_tournament.tournament_type = 'double_elimination' THEN
    -- Use modified double elimination for exactly 16 players
    IF v_participants_count = 16 THEN
      SELECT public.generate_modified_double_elimination(p_tournament_id, v_participants) INTO v_result;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Modified double elimination requires exactly 16 participants. Current: ' || v_participants_count);
    END IF;
  ELSE
    -- Use single elimination (inline logic for compatibility)
    DECLARE
      v_participant_count INTEGER;
      v_total_rounds INTEGER;
      v_round INTEGER;
      v_match_number INTEGER;
      v_matches_in_round INTEGER;
      i INTEGER;
      v_bracket_data JSONB;
    BEGIN
      v_participant_count := array_length(v_participants, 1);
      v_total_rounds := CEIL(LOG(2, v_participant_count));
      
      -- Clear existing matches
      DELETE FROM public.tournament_matches WHERE tournament_id = p_tournament_id;
      
      -- Generate first round matches
      v_matches_in_round := CEIL(v_participant_count / 2.0);
      
      FOR i IN 1..v_matches_in_round LOOP
        INSERT INTO public.tournament_matches (
          tournament_id, round_number, match_number,
          player1_id, player2_id, status,
          created_at, updated_at
        ) VALUES (
          p_tournament_id, 1, i,
          CASE WHEN (i-1)*2+1 <= v_participant_count THEN v_participants[(i-1)*2+1] ELSE NULL END,
          CASE WHEN (i-1)*2+2 <= v_participant_count THEN v_participants[(i-1)*2+2] ELSE NULL END,
          CASE 
            WHEN (i-1)*2+2 > v_participant_count THEN 'bye'
            ELSE 'scheduled'
          END,
          now(), now()
        );
      END LOOP;
      
      -- Generate placeholder matches for subsequent rounds
      FOR v_round IN 2..v_total_rounds LOOP
        v_matches_in_round := CEIL(v_matches_in_round / 2.0);
        
        FOR i IN 1..v_matches_in_round LOOP
          INSERT INTO public.tournament_matches (
            tournament_id, round_number, match_number,
            player1_id, player2_id, status,
            created_at, updated_at
          ) VALUES (
            p_tournament_id, v_round, i,
            NULL, NULL, 'pending',
            now(), now()
          );
        END LOOP;
      END LOOP;
      
      -- Update tournament status (remove has_bracket reference)
      UPDATE public.tournaments
      SET status = 'in_progress',
          updated_at = now()
      WHERE id = p_tournament_id;
      
      -- Create bracket data
      v_bracket_data := jsonb_build_object(
        'tournament_id', p_tournament_id,
        'type', 'single_elimination',
        'participants_count', v_participant_count,
        'total_rounds', v_total_rounds,
        'generated_at', now()
      );
      
      -- Store bracket in tournament_brackets table
      INSERT INTO public.tournament_brackets (tournament_id, bracket_data, created_at)
      VALUES (p_tournament_id, v_bracket_data, now())
      ON CONFLICT (tournament_id) 
      DO UPDATE SET 
        bracket_data = EXCLUDED.bracket_data,
        updated_at = now();
      
      v_result := jsonb_build_object(
        'success', true,
        'tournament_id', p_tournament_id,
        'bracket_type', 'single_elimination',
        'total_matches', (
          SELECT COUNT(*) FROM public.tournament_matches 
          WHERE tournament_id = p_tournament_id
        ),
        'message', 'Single elimination bracket generated successfully'
      );
    END;
  END IF;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to generate bracket: ' || SQLERRM
    );
END;
$$;

-- Now regenerate the bracket
DELETE FROM tournament_matches WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07';
SELECT public.generate_advanced_tournament_bracket('d8f6f334-7fa0-4dc3-9804-1d25379d9d07', 'elo_ranking', true);