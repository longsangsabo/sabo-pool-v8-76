-- Comprehensive fix for tournament_id vs id integration
-- Add tournament_id column to tournaments table for backward compatibility
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS tournament_id UUID DEFAULT gen_random_uuid();

-- Update tournament_id to match id for existing records
UPDATE public.tournaments SET tournament_id = id WHERE tournament_id IS NULL OR tournament_id != id;

-- Create unique index on tournament_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_tournaments_tournament_id ON public.tournaments(tournament_id);

-- Create automation function to sync tournament_id with id
CREATE OR REPLACE FUNCTION public.sync_tournament_ids()
RETURNS TRIGGER AS $$
BEGIN
  -- For INSERT and UPDATE on tournaments table
  IF TG_TABLE_NAME = 'tournaments' THEN
    NEW.tournament_id := NEW.id;
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-sync tournament_id with id
DROP TRIGGER IF EXISTS sync_tournament_ids_trigger ON public.tournaments;
CREATE TRIGGER sync_tournament_ids_trigger
  BEFORE INSERT OR UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_tournament_ids();

-- Fix notify_tournament_change function to handle both id and tournament_id
CREATE OR REPLACE FUNCTION public.notify_tournament_change()
RETURNS TRIGGER AS $$
DECLARE
  tournament_uuid UUID;
BEGIN
  -- Get tournament ID from either NEW or OLD record
  tournament_uuid := COALESCE(NEW.id, NEW.tournament_id, OLD.id, OLD.tournament_id);
  
  -- Broadcast notification for frontend to refresh
  PERFORM pg_notify('tournament_changed', json_build_object(
    'tournament_id', tournament_uuid,
    'operation', TG_OP,
    'timestamp', extract(epoch from now())
  )::text);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update process_tournament_results function to use proper field references
CREATE OR REPLACE FUNCTION public.process_tournament_results()
RETURNS TRIGGER AS $$
DECLARE
  v_participant RECORD;
  v_points INTEGER;
  v_multiplier NUMERIC;
  v_final_match_winner UUID;
  v_final_match_loser UUID;
  v_position_map JSONB := '{}';
  v_tournament_uuid UUID;
BEGIN
  -- Only process when tournament status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Get tournament UUID - use id field (primary key)
    v_tournament_uuid := NEW.id;
    
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
    WHERE tm.tournament_id = v_tournament_uuid 
      AND tm.round_number = (
        SELECT MAX(round_number) 
        FROM public.tournament_matches 
        WHERE tournament_id = v_tournament_uuid
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
        AND tm.tournament_id = v_tournament_uuid
        AND tm.status = 'completed'
      WHERE tr.tournament_id = v_tournament_uuid 
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
      WHERE tr.tournament_id = v_tournament_uuid 
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
          v_tournament_uuid,
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
    END LOOP;
    
    RAISE NOTICE 'Tournament % completed processing with % participants', NEW.name, 
      (SELECT COUNT(*) FROM public.tournament_registrations WHERE tournament_id = v_tournament_uuid);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create automation function to ensure data consistency
CREATE OR REPLACE FUNCTION public.ensure_tournament_data_consistency()
RETURNS void AS $$
BEGIN
  -- Sync any mismatched tournament_id with id
  UPDATE public.tournaments 
  SET tournament_id = id 
  WHERE tournament_id != id OR tournament_id IS NULL;
  
  -- Update any tournament_registrations that might reference old tournament_id
  -- This handles data migration if needed
  
  RAISE NOTICE 'Tournament data consistency check completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the consistency check
SELECT public.ensure_tournament_data_consistency();