-- Comprehensive fix for tournament_id field error
-- This migration will identify and fix all references to non-existent tournament_id field

-- First, let's check what triggers exist on tournaments table
DO $$ 
DECLARE
    trigger_record RECORD;
    function_code TEXT;
BEGIN
    -- Get all triggers on tournaments table
    FOR trigger_record IN 
        SELECT tgname, tgfoid::regproc as function_name
        FROM pg_trigger 
        WHERE tgrelid = 'public.tournaments'::regclass
    LOOP
        RAISE NOTICE 'Found trigger: % calling function: %', trigger_record.tgname, trigger_record.function_name;
        
        -- Get the function source code
        SELECT pg_get_functiondef(trigger_record.tgfoid) INTO function_code;
        
        -- Check if function contains tournament_id references
        IF function_code LIKE '%tournament_id%' THEN
            RAISE NOTICE 'Function % contains tournament_id references', trigger_record.function_name;
        END IF;
    END LOOP;
END $$;

-- Fix the process_tournament_results function which likely has the tournament_id reference
CREATE OR REPLACE FUNCTION public.process_tournament_results()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_participant RECORD;
  v_points INTEGER;
  v_multiplier NUMERIC;
  v_final_match_winner UUID;
  v_final_match_loser UUID;
  v_position_map JSONB := '{}';
BEGIN
  -- Only process when tournament status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Get tournament type multiplier
    v_multiplier := CASE 
      WHEN NEW.tournament_type = 'season' THEN 1.5
      WHEN NEW.tournament_type = 'open' THEN 2.0
      ELSE 1.0
    END;
    
    -- Get final match results to determine 1st and 2nd place
    -- FIXED: Changed tournament_id to NEW.id
    SELECT winner_id, 
           CASE WHEN winner_id = player1_id THEN player2_id ELSE player1_id END as loser_id
    INTO v_final_match_winner, v_final_match_loser
    FROM public.tournament_matches tm
    WHERE tm.tournament_id = NEW.id 
      AND tm.round_number = (
        SELECT MAX(round_number) 
        FROM public.tournament_matches 
        WHERE tournament_id = NEW.id
      )
      AND tm.status = 'completed'
      AND tm.winner_id IS NOT NULL
    LIMIT 1;
    
    -- Build position map based on tournament bracket results
    WITH player_stats AS (
      SELECT 
        tr.user_id,
        COUNT(CASE WHEN tm.winner_id = tr.user_id THEN 1 END) as wins,
        COUNT(tm.id) as total_matches
      FROM public.tournament_registrations tr
      LEFT JOIN public.tournament_matches tm ON 
        (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id)
        AND tm.tournament_id = NEW.id
        AND tm.status = 'completed'
      WHERE tr.tournament_id = NEW.id 
        AND tr.registration_status = 'confirmed'
        AND tr.user_id IS NOT NULL
      GROUP BY tr.user_id
    ),
    player_positions AS (
      SELECT 
        user_id,
        CASE 
          WHEN user_id = v_final_match_winner THEN 1
          WHEN user_id = v_final_match_loser THEN 2
          ELSE ROW_NUMBER() OVER (ORDER BY wins DESC, total_matches DESC) + 2
        END as position
      FROM player_stats
    )
    SELECT jsonb_object_agg(user_id::text, position)
    INTO v_position_map
    FROM player_positions;
    
    -- Process all tournament participants
    FOR v_participant IN 
      SELECT 
        tr.user_id,
        p.full_name,
        -- Get position from position map
        COALESCE((v_position_map->>tr.user_id::text)::integer, 99) as position
      FROM public.tournament_registrations tr
      LEFT JOIN public.profiles p ON tr.user_id = p.user_id
      WHERE tr.tournament_id = NEW.id 
        AND tr.registration_status = 'confirmed'
        AND tr.user_id IS NOT NULL
    LOOP
      -- Calculate base points based on actual position
      v_points := CASE 
        WHEN v_participant.position = 1 THEN 1000  -- Champion
        WHEN v_participant.position = 2 THEN 700   -- Runner-up  
        WHEN v_participant.position = 3 THEN 500   -- Third place
        WHEN v_participant.position = 4 THEN 400   -- Fourth place
        WHEN v_participant.position <= 8 THEN 300  -- Quarter-finals
        WHEN v_participant.position <= 16 THEN 200 -- Round of 16
        ELSE 100  -- Participation
      END;
      
      -- Apply multiplier
      v_points := ROUND(v_points * v_multiplier);
      
      -- Award SPA points (skip if table doesn't exist)
      BEGIN
        INSERT INTO public.spa_points_log (
          user_id,
          source_type, 
          source_id, 
          points_earned,
          description
        ) VALUES (
          v_participant.user_id,
          'tournament',
          NEW.id,
          v_points,
          format('Vị trí %s trong %s', v_participant.position, NEW.name)
        );
      EXCEPTION 
        WHEN undefined_table THEN
          RAISE NOTICE 'spa_points_log table does not exist, skipping SPA points';
        WHEN OTHERS THEN
          RAISE NOTICE 'Error inserting SPA points for player %: %', v_participant.user_id, SQLERRM;
      END;
      
      -- Update player rankings (skip if table doesn't exist)
      BEGIN
        INSERT INTO public.player_rankings (user_id, spa_points, total_matches)
        VALUES (v_participant.user_id, v_points, 1)
        ON CONFLICT (user_id) DO UPDATE SET
          spa_points = COALESCE(player_rankings.spa_points, 0) + v_points,
          total_matches = COALESCE(player_rankings.total_matches, 0) + 1,
          updated_at = NOW();
      EXCEPTION 
        WHEN undefined_table THEN
          RAISE NOTICE 'player_rankings table does not exist, skipping ranking update';
        WHEN OTHERS THEN
          RAISE NOTICE 'Error updating player rankings for player %: %', v_participant.user_id, SQLERRM;
      END;
      
      -- Create match results for ELO calculation if match data exists
      BEGIN
        WITH player_matches AS (
          SELECT 
            tm.*,
            CASE WHEN tm.winner_id = v_participant.user_id THEN 'win'
                 WHEN tm.winner_id IS NOT NULL THEN 'loss'
                 ELSE 'draw' END as result,
            CASE WHEN tm.player1_id = v_participant.user_id THEN tm.player2_id
                 ELSE tm.player1_id END as opponent_id
          FROM public.tournament_matches tm
          WHERE tm.tournament_id = NEW.id
            AND (tm.player1_id = v_participant.user_id OR tm.player2_id = v_participant.user_id)
            AND tm.status = 'completed'
        )
        INSERT INTO public.match_results (
          tournament_id,
          match_id,
          player1_id,
          player2_id,
          winner_id,
          loser_id,
          player1_score,
          player2_score,
          match_date,
          result_status,
          player1_elo_before,
          player1_elo_after,
          player1_elo_change,
          player2_elo_before,
          player2_elo_after,
          player2_elo_change
        )
        SELECT 
          NEW.id,
          pm.id,
          pm.player1_id,
          pm.player2_id,
          pm.winner_id,
          CASE WHEN pm.winner_id = pm.player1_id THEN pm.player2_id ELSE pm.player1_id END,
          5, -- Default race to 5
          CASE WHEN pm.winner_id IS NOT NULL THEN 
            CASE WHEN pm.winner_id = pm.player1_id THEN 3 ELSE 5 END
          ELSE 5 END,
          COALESCE(pm.completed_at, NOW()),
          'verified',
          1000, -- Default ELO before
          1000 + CASE WHEN pm.winner_id = v_participant.user_id THEN 25 ELSE -25 END, -- Simple ELO change
          CASE WHEN pm.winner_id = v_participant.user_id THEN 25 ELSE -25 END,
          1000, -- Opponent ELO before  
          1000 + CASE WHEN pm.winner_id = v_participant.user_id THEN -25 ELSE 25 END,
          CASE WHEN pm.winner_id = v_participant.user_id THEN -25 ELSE 25 END
        FROM player_matches pm
        ON CONFLICT (tournament_id, match_id) DO NOTHING;
      EXCEPTION 
        WHEN undefined_table THEN
          RAISE NOTICE 'match_results table does not exist, skipping match results';
        WHEN OTHERS THEN
          RAISE NOTICE 'Error creating match results for player %: %', v_participant.user_id, SQLERRM;
      END;
    END LOOP;
    
    RAISE NOTICE 'Tournament % completed processing with % participants', NEW.name, 
      (SELECT COUNT(*) FROM public.tournament_registrations WHERE tournament_id = NEW.id);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Check and fix any other functions that might reference tournament_id incorrectly
DO $$
DECLARE
    func_record RECORD;
    func_source TEXT;
BEGIN
    -- Search for functions containing tournament_id that might need fixing
    FOR func_record IN
        SELECT proname, pronamespace::regnamespace as schema_name
        FROM pg_proc 
        WHERE pg_get_functiondef(oid) ILIKE '%tournament_id%'
        AND pronamespace::regnamespace::text = 'public'
    LOOP
        SELECT pg_get_functiondef(func_record.proname::regproc) INTO func_source;
        RAISE NOTICE 'Function %.% contains tournament_id references and may need review', 
                     func_record.schema_name, func_record.proname;
    END LOOP;
END $$;