-- Fix spa_points_log table schema and create complete tournament processing
-- The spa_points_log table uses player_id instead of user_id for consistency

-- First ensure the trigger function exists for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create comprehensive tournament completion processor
CREATE OR REPLACE FUNCTION public.process_tournament_completion(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_participant RECORD;
  v_points INTEGER;
  v_multiplier NUMERIC := 1.0;
  v_final_match RECORD;
  v_third_place_match RECORD;
  v_position_map JSONB := '{}';
  result_count INTEGER := 0;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament 
  FROM public.tournaments 
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Check if already processed
  IF EXISTS (
    SELECT 1 FROM public.spa_points_log 
    WHERE source_id = p_tournament_id AND source_type = 'tournament'
  ) THEN
    RETURN jsonb_build_object('message', 'Tournament already processed');
  END IF;
  
  -- Get tournament type multiplier
  v_multiplier := CASE 
    WHEN v_tournament.tournament_type = 'season' THEN 1.5
    WHEN v_tournament.tournament_type = 'open' THEN 2.0
    ELSE 1.0
  END;
  
  -- Find key matches to determine positions
  SELECT * INTO v_final_match
  FROM public.tournament_matches
  WHERE tournament_id = p_tournament_id 
    AND (bracket_type = 'final' OR round_number = (
      SELECT MAX(round_number) FROM public.tournament_matches 
      WHERE tournament_id = p_tournament_id AND status = 'completed'
    ))
    AND status = 'completed'
    AND winner_id IS NOT NULL
  ORDER BY round_number DESC, match_number ASC
  LIMIT 1;
  
  -- Find third place match
  SELECT * INTO v_third_place_match
  FROM public.tournament_matches
  WHERE tournament_id = p_tournament_id 
    AND is_third_place_match = true
    AND status = 'completed'
    AND winner_id IS NOT NULL;
  
  -- Build position mapping
  v_position_map := '{}';
  
  -- Assign champion and runner-up
  IF v_final_match.winner_id IS NOT NULL THEN
    v_position_map := jsonb_set(v_position_map, ARRAY[v_final_match.winner_id::text], '1');
    IF v_final_match.player1_id = v_final_match.winner_id THEN
      v_position_map := jsonb_set(v_position_map, ARRAY[v_final_match.player2_id::text], '2');
    ELSE
      v_position_map := jsonb_set(v_position_map, ARRAY[v_final_match.player1_id::text], '2');
    END IF;
  END IF;
  
  -- Assign third and fourth place
  IF v_third_place_match.winner_id IS NOT NULL THEN
    v_position_map := jsonb_set(v_position_map, ARRAY[v_third_place_match.winner_id::text], '3');
    IF v_third_place_match.player1_id = v_third_place_match.winner_id THEN
      v_position_map := jsonb_set(v_position_map, ARRAY[v_third_place_match.player2_id::text], '4');
    ELSE
      v_position_map := jsonb_set(v_position_map, ARRAY[v_third_place_match.player1_id::text], '4');
    END IF;
  END IF;
  
  -- Process all tournament participants
  FOR v_participant IN 
    SELECT DISTINCT
      COALESCE(tm.player1_id, tm.player2_id) as player_id,
      p.full_name,
      p.display_name
    FROM public.tournament_matches tm
    LEFT JOIN public.profiles p ON (p.user_id = tm.player1_id OR p.user_id = tm.player2_id)
    WHERE tm.tournament_id = p_tournament_id
      AND (tm.player1_id IS NOT NULL OR tm.player2_id IS NOT NULL)
    
    UNION
    
    SELECT DISTINCT
      tm.player2_id as player_id,
      p.full_name,
      p.display_name
    FROM public.tournament_matches tm
    LEFT JOIN public.profiles p ON p.user_id = tm.player2_id
    WHERE tm.tournament_id = p_tournament_id
      AND tm.player2_id IS NOT NULL
      AND tm.player2_id NOT IN (
        SELECT COALESCE(tm2.player1_id, tm2.player2_id)
        FROM public.tournament_matches tm2
        WHERE tm2.tournament_id = p_tournament_id
      )
  LOOP
    IF v_participant.player_id IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Get position from position map or calculate based on performance
    DECLARE
      player_position INTEGER;
      player_wins INTEGER;
      player_matches INTEGER;
    BEGIN
      -- Try to get position from position map first
      player_position := (v_position_map->>v_participant.player_id::text)::integer;
      
      -- If not in position map, calculate based on performance
      IF player_position IS NULL THEN
        -- Count wins and total matches for this player
        SELECT 
          COUNT(CASE WHEN winner_id = v_participant.player_id THEN 1 END),
          COUNT(*)
        INTO player_wins, player_matches
        FROM public.tournament_matches
        WHERE tournament_id = p_tournament_id
          AND (player1_id = v_participant.player_id OR player2_id = v_participant.player_id)
          AND status = 'completed';
        
        -- Estimate position based on performance (simplified)
        player_position := GREATEST(5, 20 - player_wins);
      END IF;
      
      -- Calculate base points based on position
      v_points := CASE 
        WHEN player_position = 1 THEN 1000  -- Champion
        WHEN player_position = 2 THEN 700   -- Runner-up  
        WHEN player_position = 3 THEN 500   -- Third place
        WHEN player_position = 4 THEN 400   -- Fourth place
        WHEN player_position <= 8 THEN 300  -- Quarter-finals
        WHEN player_position <= 16 THEN 200 -- Round of 16
        ELSE 100  -- Participation
      END;
      
      -- Apply multiplier
      v_points := ROUND(v_points * v_multiplier);
      
      -- Award SPA points
      INSERT INTO public.spa_points_log (
        player_id, 
        source_type, 
        source_id, 
        points_earned,
        description,
        created_at,
        updated_at
      ) VALUES (
        v_participant.player_id,
        'tournament',
        p_tournament_id,
        v_points,
        format('Vị trí %s trong %s', player_position, v_tournament.name),
        now(),
        now()
      );
      
      -- Update player rankings
      INSERT INTO public.player_rankings (player_id, spa_points, total_matches, updated_at)
      VALUES (v_participant.player_id, v_points, 1, now())
      ON CONFLICT (player_id) DO UPDATE SET
        spa_points = COALESCE(player_rankings.spa_points, 0) + v_points,
        total_matches = COALESCE(player_rankings.total_matches, 0) + 1,
        updated_at = now();
      
      result_count := result_count + 1;
    END;
  END LOOP;
  
  -- Update tournament status
  UPDATE public.tournaments 
  SET 
    status = 'completed',
    updated_at = now()
  WHERE id = p_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'players_processed', result_count,
    'message', format('Tournament completion processed for %s players', result_count)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to process tournament completion: ' || SQLERRM
    );
END;
$function$;