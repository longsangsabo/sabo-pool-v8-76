-- Complete fix for remaining player_id references causing "NEW record has no field player_id" errors

-- Find and display all functions that might still reference player_id
DO $$ 
DECLARE
    func_record RECORD;
    sql_text TEXT;
BEGIN
    -- Log any functions that might still reference player_id
    FOR func_record IN 
        SELECT proname as function_name, prosrc as source_code
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
          AND prosrc LIKE '%player_id%'
    LOOP
        RAISE NOTICE 'Found function with player_id reference: %', func_record.function_name;
    END LOOP;
    
    -- Check for any triggers that might reference player_id
    FOR func_record IN
        SELECT trigger_name, action_statement
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
          AND action_statement LIKE '%player_id%'
    LOOP
        RAISE NOTICE 'Found trigger with player_id reference: %', func_record.trigger_name;
    END LOOP;
END $$;

-- Fix any remaining triggers that might reference player_id in the notify_tournament_registration function
DROP TRIGGER IF EXISTS notify_tournament_registration_trigger ON tournament_registrations;

-- Update the function to use user_id instead of player_id
CREATE OR REPLACE FUNCTION public.notify_tournament_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  tournament_name TEXT;
  player_name TEXT;
  organizer_id UUID;
BEGIN
  -- Get tournament and player names using user_id instead of player_id
  SELECT name, created_by INTO tournament_name, organizer_id 
  FROM public.tournaments 
  WHERE id = NEW.tournament_id;
  
  SELECT full_name INTO player_name 
  FROM public.profiles 
  WHERE user_id = NEW.user_id;  -- Changed from player_id to user_id
  
  -- Only send notification if we have an organizer
  IF organizer_id IS NOT NULL THEN
    -- Notify tournament organizer about new registration
    PERFORM public.create_notification(
      organizer_id,
      'tournament_registration',
      'Đăng ký giải đấu mới',
      format('%s đã đăng ký tham gia giải đấu "%s"', 
             COALESCE(player_name, 'Người chơi'), 
             COALESCE(tournament_name, 'Giải đấu')),
      format('/tournaments/%s', NEW.tournament_id),
      jsonb_build_object(
        'tournament_id', NEW.tournament_id,
        'user_id', NEW.user_id,  -- Changed from player_id to user_id
        'registration_id', NEW.id
      ),
      'normal'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER notify_tournament_registration_trigger
    AFTER INSERT ON tournament_registrations
    FOR EACH ROW
    EXECUTE FUNCTION notify_tournament_registration();

-- Also check and fix any other functions that might reference player_id fields
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
        tr.user_id,  -- Changed from player_id to user_id
        COUNT(CASE WHEN tm.winner_id = tr.user_id THEN 1 END) as wins,
        COUNT(tm.id) as total_matches
      FROM public.tournament_registrations tr
      LEFT JOIN public.tournament_matches tm ON 
        (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id)  -- Changed from player_id to user_id
        AND tm.tournament_id = NEW.id
        AND tm.status = 'completed'
      WHERE tr.tournament_id = NEW.id 
        AND tr.registration_status = 'confirmed'
        AND tr.user_id IS NOT NULL  -- Changed from player_id to user_id
      GROUP BY tr.user_id  -- Changed from player_id to user_id
    ),
    player_positions AS (
      SELECT 
        user_id,  -- Changed from player_id to user_id
        CASE 
          WHEN user_id = v_final_match_winner THEN 1
          WHEN user_id = v_final_match_loser THEN 2
          ELSE ROW_NUMBER() OVER (ORDER BY wins DESC, total_matches DESC) + 2
        END as position
      FROM player_stats
    )
    SELECT jsonb_object_agg(user_id::text, position)  -- Changed from player_id to user_id
    INTO v_position_map
    FROM player_positions;
    
    -- Process all tournament participants
    FOR v_participant IN 
      SELECT 
        tr.user_id,  -- Changed from player_id to user_id
        p.full_name,
        -- Get position from position map
        COALESCE((v_position_map->>tr.user_id::text)::integer, 99) as position  -- Changed from player_id to user_id
      FROM public.tournament_registrations tr
      LEFT JOIN public.profiles p ON tr.user_id = p.user_id  -- Changed from player_id to user_id
      WHERE tr.tournament_id = NEW.id 
        AND tr.registration_status = 'confirmed'
        AND tr.user_id IS NOT NULL  -- Changed from player_id to user_id
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
          user_id,  -- Changed from player_id to user_id
          source_type, 
          source_id, 
          points_earned,
          description
        ) VALUES (
          v_participant.user_id,  -- Changed from player_id to user_id
          'tournament',
          NEW.id,
          v_points,
          format('Vị trí %s trong %s', v_participant.position, NEW.name)
        );
      EXCEPTION 
        WHEN undefined_table THEN
          RAISE NOTICE 'spa_points_log table does not exist, skipping SPA points';
        WHEN OTHERS THEN
          RAISE NOTICE 'Error inserting SPA points for player %: %', v_participant.user_id, SQLERRM;  -- Changed from player_id to user_id
      END;
      
      -- Update player rankings (skip if table doesn't exist)
      BEGIN
        INSERT INTO public.player_rankings (user_id, spa_points, total_matches)  -- Changed from player_id to user_id
        VALUES (v_participant.user_id, v_points, 1)  -- Changed from player_id to user_id
        ON CONFLICT (user_id) DO UPDATE SET  -- Changed from player_id to user_id
          spa_points = COALESCE(player_rankings.spa_points, 0) + v_points,
          total_matches = COALESCE(player_rankings.total_matches, 0) + 1,
          updated_at = NOW();
      EXCEPTION 
        WHEN undefined_table THEN
          RAISE NOTICE 'player_rankings table does not exist, skipping ranking update';
        WHEN OTHERS THEN
          RAISE NOTICE 'Error updating player rankings for player %: %', v_participant.user_id, SQLERRM;  -- Changed from player_id to user_id
      END;
      
      -- Create match results for ELO calculation if match data exists
      BEGIN
        WITH player_matches AS (
          SELECT 
            tm.*,
            CASE WHEN tm.winner_id = v_participant.user_id THEN 'win'  -- Changed from player_id to user_id
                 WHEN tm.winner_id IS NOT NULL THEN 'loss'
                 ELSE 'draw' END as result,
            CASE WHEN tm.player1_id = v_participant.user_id THEN tm.player2_id  -- Changed from player_id to user_id
                 ELSE tm.player1_id END as opponent_id
          FROM public.tournament_matches tm
          WHERE tm.tournament_id = NEW.id
            AND (tm.player1_id = v_participant.user_id OR tm.player2_id = v_participant.user_id)  -- Changed from player_id to user_id
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
          1000 + CASE WHEN pm.winner_id = v_participant.user_id THEN 25 ELSE -25 END, -- Simple ELO change  -- Changed from player_id to user_id
          CASE WHEN pm.winner_id = v_participant.user_id THEN 25 ELSE -25 END,  -- Changed from player_id to user_id
          1000, -- Opponent ELO before  
          1000 + CASE WHEN pm.winner_id = v_participant.user_id THEN -25 ELSE 25 END,  -- Changed from player_id to user_id
          CASE WHEN pm.winner_id = v_participant.user_id THEN -25 ELSE 25 END  -- Changed from player_id to user_id
        FROM player_matches pm
        ON CONFLICT (tournament_id, match_id) DO NOTHING;
      EXCEPTION 
        WHEN undefined_table THEN
          RAISE NOTICE 'match_results table does not exist, skipping match results';
        WHEN OTHERS THEN
          RAISE NOTICE 'Error creating match results for player %: %', v_participant.user_id, SQLERRM;  -- Changed from player_id to user_id
      END;
    END LOOP;
    
    RAISE NOTICE 'Tournament % completed processing with % participants', NEW.name, 
      (SELECT COUNT(*) FROM public.tournament_registrations WHERE tournament_id = NEW.id);
  END IF;
  
  RETURN NEW;
END;
$function$;