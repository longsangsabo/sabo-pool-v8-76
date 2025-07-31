
-- Automatically generate 3rd/4th place matches for single elimination tournaments
-- Update the generate_advanced_tournament_bracket function to include third place matches

CREATE OR REPLACE FUNCTION public.generate_advanced_tournament_bracket(
  p_tournament_id uuid,
  p_ordering_method text DEFAULT 'elo_ranking',
  p_seeded boolean DEFAULT true
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tournament RECORD;
  v_participants uuid[];
  v_participant_count INTEGER;
  v_max_round INTEGER;
  v_result jsonb;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  -- Get participants based on ordering method
  IF p_ordering_method = 'elo_ranking' THEN
    SELECT array_agg(tr.user_id ORDER BY COALESCE(pr.elo_points, 1000) DESC) INTO v_participants
    FROM public.tournament_registrations tr
    LEFT JOIN public.player_rankings pr ON pr.user_id = tr.user_id
    WHERE tr.tournament_id = p_tournament_id 
    AND tr.registration_status = 'confirmed';
  ELSE
    SELECT array_agg(tr.user_id ORDER BY tr.created_at) INTO v_participants
    FROM public.tournament_registrations tr
    WHERE tr.tournament_id = p_tournament_id 
    AND tr.registration_status = 'confirmed';
  END IF;
  
  v_participant_count := array_length(v_participants, 1);
  
  IF v_participant_count < 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough participants');
  END IF;
  
  -- Calculate max rounds for single elimination
  v_max_round := CEIL(LOG(2, v_participant_count));
  
  -- Clear existing matches
  DELETE FROM public.tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Generate bracket based on tournament type
  IF v_tournament.tournament_type = 'single_elimination' THEN
    -- Generate single elimination bracket
    DECLARE
      v_current_round INTEGER := 1;
      v_matches_in_round INTEGER;
      v_match_number INTEGER;
      i INTEGER;
    BEGIN
      -- Round 1: Pair up all participants
      v_matches_in_round := v_participant_count / 2;
      
      FOR i IN 1..v_matches_in_round LOOP
        INSERT INTO public.tournament_matches (
          tournament_id, round_number, match_number, bracket_type,
          player1_id, player2_id, status, created_at, updated_at
        ) VALUES (
          p_tournament_id, v_current_round, i, 'single',
          v_participants[(i-1)*2+1], v_participants[(i-1)*2+2],
          'scheduled', now(), now()
        );
      END LOOP;
      
      -- Generate subsequent rounds with empty matches
      FOR v_current_round IN 2..v_max_round LOOP
        v_matches_in_round := POWER(2, v_max_round - v_current_round);
        
        FOR v_match_number IN 1..v_matches_in_round LOOP
          INSERT INTO public.tournament_matches (
            tournament_id, round_number, match_number, bracket_type,
            status, created_at, updated_at
          ) VALUES (
            p_tournament_id, v_current_round, v_match_number, 'single',
            'pending', now(), now()
          );
        END LOOP;
      END LOOP;
      
      -- Auto-generate third place match if tournament has this setting
      IF v_tournament.has_third_place_match = true AND v_max_round >= 2 THEN
        INSERT INTO public.tournament_matches (
          tournament_id, round_number, match_number, bracket_type,
          is_third_place_match, status, created_at, updated_at
        ) VALUES (
          p_tournament_id, v_max_round, 99, 'third_place',
          true, 'pending', now(), now()
        );
        
        RAISE NOTICE 'Third place match automatically created for tournament %', p_tournament_id;
      END IF;
    END;
    
  ELSIF v_tournament.tournament_type = 'double_elimination' THEN
    -- Call the specialized double elimination function
    SELECT public.generate_modified_double_elimination(p_tournament_id, v_participants) INTO v_result;
    RETURN v_result;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Unsupported tournament type');
  END IF;
  
  -- Update tournament status
  UPDATE public.tournaments 
  SET status = 'in_progress', updated_at = now()
  WHERE id = p_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'bracket_type', v_tournament.tournament_type,
    'participants_count', v_participant_count,
    'max_rounds', v_max_round,
    'third_place_match_created', v_tournament.has_third_place_match,
    'message', 'Tournament bracket generated successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to generate bracket: ' || SQLERRM
    );
END;
$$;

-- Improved trigger function to automatically populate third place match participants
CREATE OR REPLACE FUNCTION public.auto_populate_third_place_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tournament RECORD;
  v_semifinal_losers uuid[];
  v_third_place_match_id uuid;
BEGIN
  -- Only trigger when a semifinal match is completed
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND 
     (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Get tournament details
    SELECT * INTO v_tournament FROM public.tournaments WHERE id = NEW.tournament_id;
    
    -- Only process single elimination tournaments with third place matches
    IF v_tournament.tournament_type = 'single_elimination' AND 
       v_tournament.has_third_place_match = true THEN
      
      -- Check if this is a semifinal (second-to-last round)
      DECLARE
        v_max_round INTEGER;
      BEGIN
        SELECT MAX(round_number) INTO v_max_round
        FROM public.tournament_matches 
        WHERE tournament_id = NEW.tournament_id AND NOT is_third_place_match;
        
        -- If this is a semifinal match (max_round - 1)
        IF NEW.round_number = (v_max_round - 1) THEN
          
          -- Check if both semifinals are completed
          IF (SELECT COUNT(*) FROM public.tournament_matches 
              WHERE tournament_id = NEW.tournament_id 
              AND round_number = (v_max_round - 1)
              AND status = 'completed' 
              AND winner_id IS NOT NULL) = 2 THEN
            
            -- Get both semifinal losers
            SELECT array_agg(
              CASE 
                WHEN winner_id = player1_id THEN player2_id 
                ELSE player1_id 
              END
            ) INTO v_semifinal_losers
            FROM public.tournament_matches
            WHERE tournament_id = NEW.tournament_id 
            AND round_number = (v_max_round - 1)
            AND status = 'completed' 
            AND winner_id IS NOT NULL;
            
            -- Find the third place match
            SELECT id INTO v_third_place_match_id
            FROM public.tournament_matches
            WHERE tournament_id = NEW.tournament_id 
            AND is_third_place_match = true
            LIMIT 1;
            
            -- Update third place match with semifinal losers
            IF v_third_place_match_id IS NOT NULL AND array_length(v_semifinal_losers, 1) = 2 THEN
              UPDATE public.tournament_matches
              SET player1_id = v_semifinal_losers[1],
                  player2_id = v_semifinal_losers[2],
                  status = 'scheduled',
                  updated_at = now()
              WHERE id = v_third_place_match_id;
              
              RAISE NOTICE 'Third place match populated for tournament % with players % and %', 
                NEW.tournament_id, v_semifinal_losers[1], v_semifinal_losers[2];
            END IF;
          END IF;
        END IF;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS auto_populate_third_place_match_trigger ON public.tournament_matches;
CREATE TRIGGER auto_populate_third_place_match_trigger
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_populate_third_place_match();

-- Add validation function for third place match creation
CREATE OR REPLACE FUNCTION public.validate_third_place_match_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tournament RECORD;
  v_existing_count INTEGER;
BEGIN
  -- Only validate third place matches
  IF NEW.is_third_place_match = true THEN
    
    -- Get tournament details
    SELECT * INTO v_tournament FROM public.tournaments WHERE id = NEW.tournament_id;
    
    -- Check if tournament supports third place matches
    IF v_tournament.has_third_place_match != true THEN
      RAISE EXCEPTION 'Tournament does not allow third place matches';
    END IF;
    
    -- Check if tournament is single elimination
    IF v_tournament.tournament_type != 'single_elimination' THEN
      RAISE EXCEPTION 'Third place matches only supported for single elimination tournaments';
    END IF;
    
    -- Check for existing third place match
    SELECT COUNT(*) INTO v_existing_count
    FROM public.tournament_matches
    WHERE tournament_id = NEW.tournament_id 
    AND is_third_place_match = true
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    
    IF v_existing_count > 0 THEN
      RAISE EXCEPTION 'Tournament already has a third place match';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create validation trigger
DROP TRIGGER IF EXISTS validate_third_place_match_trigger ON public.tournament_matches;
CREATE TRIGGER validate_third_place_match_trigger
  BEFORE INSERT OR UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_third_place_match_creation();
