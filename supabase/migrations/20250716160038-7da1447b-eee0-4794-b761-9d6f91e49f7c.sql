-- Fix the SABO OPEN tournament to use double elimination and create proper bracket generation

-- 1. Update the tournament type to double_elimination
UPDATE tournaments 
SET tournament_type = 'double_elimination',
    current_phase = 'double_elimination'
WHERE id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07';

-- 2. Update the main bracket generation function to handle double elimination
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
    -- Use single elimination (existing logic)
    SELECT public.generate_single_elimination_bracket(p_tournament_id, v_participants) INTO v_result;
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

-- 3. Create helper function for single elimination (existing logic)
CREATE OR REPLACE FUNCTION public.generate_single_elimination_bracket(
  p_tournament_id UUID,
  p_participants UUID[]
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_participant_count INTEGER;
  v_total_rounds INTEGER;
  v_round INTEGER;
  v_match_number INTEGER;
  v_matches_in_round INTEGER;
  i INTEGER;
  v_bracket_data JSONB;
BEGIN
  v_participant_count := array_length(p_participants, 1);
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
      CASE WHEN (i-1)*2+1 <= v_participant_count THEN p_participants[(i-1)*2+1] ELSE NULL END,
      CASE WHEN (i-1)*2+2 <= v_participant_count THEN p_participants[(i-1)*2+2] ELSE NULL END,
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
  
  -- Update tournament status
  UPDATE public.tournaments
  SET status = 'in_progress',
      has_bracket = true,
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
  
  RETURN jsonb_build_object(
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
$$;