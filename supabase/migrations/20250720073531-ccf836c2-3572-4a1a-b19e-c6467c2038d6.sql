
-- Fix tournament completion algorithm and add comprehensive reward system
DROP FUNCTION IF EXISTS public.process_tournament_results();

-- Create enhanced tournament completion function with correct ranking
CREATE OR REPLACE FUNCTION public.process_tournament_results()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_participant RECORD;
  v_spa_points INTEGER;
  v_elo_points INTEGER;
  v_prize_money INTEGER;
  v_physical_rewards TEXT[];
  v_multiplier NUMERIC;
  v_position INTEGER;
BEGIN
  -- Only process when tournament status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Get tournament type multiplier for SPA points
    v_multiplier := CASE 
      WHEN NEW.tournament_type = 'season' THEN 1.5
      WHEN NEW.tournament_type = 'open' THEN 2.0
      ELSE 1.0
    END;
    
    -- Calculate proper rankings for ALL participants
    WITH participant_stats AS (
      SELECT 
        tr.user_id,
        p.full_name,
        COALESCE(pr.verified_rank, 'K') as player_rank,
        -- Count wins for this participant
        (SELECT COUNT(*) FROM tournament_matches tm 
         WHERE tm.tournament_id = NEW.id 
         AND tm.winner_id = tr.user_id 
         AND tm.status = 'completed') as wins,
        -- Count losses for this participant
        (SELECT COUNT(*) FROM tournament_matches tm 
         WHERE tm.tournament_id = NEW.id 
         AND (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id)
         AND tm.status = 'completed' 
         AND tm.winner_id IS NOT NULL
         AND tm.winner_id != tr.user_id) as losses,
        -- Count total matches
        (SELECT COUNT(*) FROM tournament_matches tm 
         WHERE tm.tournament_id = NEW.id 
         AND (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id)
         AND tm.status = 'completed') as total_matches
      FROM tournament_registrations tr
      LEFT JOIN profiles p ON tr.user_id = p.user_id
      LEFT JOIN player_rankings pr ON pr.user_id = tr.user_id
      WHERE tr.tournament_id = NEW.id 
        AND tr.registration_status = 'confirmed'
        AND tr.user_id IS NOT NULL
    ),
    ranked_participants AS (
      SELECT 
        *,
        -- Assign sequential positions based on performance
        ROW_NUMBER() OVER (
          ORDER BY 
            wins DESC, 
            total_matches DESC,
            losses ASC,
            user_id  -- Tie breaker to ensure deterministic ordering
        ) as final_position
      FROM participant_stats
    )
    -- Insert/Update tournament results with correct sequential positions
    INSERT INTO tournament_results (
      tournament_id,
      user_id,
      final_position,
      matches_played,
      matches_won,
      matches_lost,
      spa_points_earned,
      elo_points_earned,
      prize_money,
      physical_rewards,
      created_at
    )
    SELECT 
      NEW.id,
      rp.user_id,
      rp.final_position,
      rp.total_matches,
      rp.wins,
      rp.losses,
      -- Calculate SPA points based on position and player rank
      CASE 
        WHEN rp.final_position = 1 THEN 
          CASE rp.player_rank
            WHEN 'E+' THEN 2000
            WHEN 'E' THEN 1800
            WHEN 'F+' THEN 1600
            WHEN 'F' THEN 1400
            WHEN 'G+' THEN 1200
            WHEN 'G' THEN 1000
            WHEN 'H+' THEN 800
            WHEN 'H' THEN 600
            WHEN 'I+' THEN 500
            WHEN 'I' THEN 400
            ELSE 300
          END * v_multiplier
        WHEN rp.final_position = 2 THEN 
          CASE rp.player_rank
            WHEN 'E+' THEN 1400
            WHEN 'E' THEN 1200
            WHEN 'F+' THEN 1000
            WHEN 'F' THEN 900
            WHEN 'G+' THEN 800
            WHEN 'G' THEN 700
            WHEN 'H+' THEN 600
            WHEN 'H' THEN 500
            WHEN 'I+' THEN 400
            WHEN 'I' THEN 300
            ELSE 200
          END * v_multiplier
        WHEN rp.final_position = 3 THEN 
          CASE rp.player_rank
            WHEN 'E+' THEN 1000
            WHEN 'E' THEN 900
            WHEN 'F+' THEN 800
            WHEN 'F' THEN 700
            WHEN 'G+' THEN 600
            WHEN 'G' THEN 500
            WHEN 'H+' THEN 400
            WHEN 'H' THEN 350
            WHEN 'I+' THEN 300
            WHEN 'I' THEN 250
            ELSE 150
          END * v_multiplier
        WHEN rp.final_position <= 8 THEN 
          CASE rp.player_rank
            WHEN 'E+' THEN 600
            WHEN 'E' THEN 500
            WHEN 'F+' THEN 400
            WHEN 'F' THEN 350
            WHEN 'G+' THEN 300
            WHEN 'G' THEN 250
            ELSE 200
          END * v_multiplier
        WHEN rp.final_position <= 16 THEN 
          CASE rp.player_rank
            WHEN 'E+' THEN 400
            WHEN 'E' THEN 350
            WHEN 'F+' THEN 300
            WHEN 'F' THEN 250
            ELSE 200
          END * v_multiplier
        ELSE 100 * v_multiplier
      END::INTEGER,
      -- Fixed ELO points based on position only
      CASE 
        WHEN rp.final_position = 1 THEN 100
        WHEN rp.final_position = 2 THEN 50
        WHEN rp.final_position = 3 THEN 25
        WHEN rp.final_position <= 4 THEN 12
        WHEN rp.final_position <= 8 THEN 6
        WHEN rp.final_position <= 16 THEN 3
        ELSE 1
      END,
      -- Prize money based on position
      CASE 
        WHEN rp.final_position = 1 THEN 5000000
        WHEN rp.final_position = 2 THEN 3000000
        WHEN rp.final_position = 3 THEN 2000000
        WHEN rp.final_position = 4 THEN 1000000
        WHEN rp.final_position <= 8 THEN 500000
        ELSE 0
      END,
      -- Physical rewards array
      CASE 
        WHEN rp.final_position = 1 THEN ARRAY['Cúp vô địch', 'Giấy chứng nhận', 'Huy hiệu vàng']
        WHEN rp.final_position = 2 THEN ARRAY['Huy chương bạc', 'Giấy chứng nhận']
        WHEN rp.final_position = 3 THEN ARRAY['Huy chương đồng', 'Giấy chứng nhận']
        WHEN rp.final_position <= 8 THEN ARRAY['Giấy chứng nhận Top 8']
        WHEN rp.final_position <= 16 THEN ARRAY['Giấy chứng nhận tham gia']
        ELSE ARRAY['Giấy chứng nhận tham gia']
      END,
      NOW()
    FROM ranked_participants rp
    ON CONFLICT (tournament_id, user_id) DO UPDATE SET
      final_position = EXCLUDED.final_position,
      matches_played = EXCLUDED.matches_played,
      matches_won = EXCLUDED.matches_won,
      matches_lost = EXCLUDED.matches_lost,
      spa_points_earned = EXCLUDED.spa_points_earned,
      elo_points_earned = EXCLUDED.elo_points_earned,
      prize_money = EXCLUDED.prize_money,
      physical_rewards = EXCLUDED.physical_rewards,
      updated_at = NOW();
    
    -- Update player rankings with accumulated rewards
    FOR v_participant IN 
      SELECT user_id, spa_points_earned, elo_points_earned, matches_played, matches_won, matches_lost
      FROM tournament_results 
      WHERE tournament_id = NEW.id
    LOOP
      INSERT INTO player_rankings (user_id, spa_points, elo_points, total_matches, wins, losses)
      VALUES (v_participant.user_id, v_participant.spa_points_earned, v_participant.elo_points_earned, 
              v_participant.matches_played, v_participant.matches_won, v_participant.matches_lost)
      ON CONFLICT (user_id) DO UPDATE SET
        spa_points = COALESCE(player_rankings.spa_points, 0) + v_participant.spa_points_earned,
        elo_points = COALESCE(player_rankings.elo_points, 1000) + v_participant.elo_points_earned,
        total_matches = COALESCE(player_rankings.total_matches, 0) + v_participant.matches_played,
        wins = COALESCE(player_rankings.wins, 0) + v_participant.matches_won,
        losses = COALESCE(player_rankings.losses, 0) + v_participant.matches_lost,
        updated_at = NOW();
    END LOOP;
    
    RAISE NOTICE 'Tournament % completed with proper sequential ranking for % participants', 
      NEW.name, (SELECT COUNT(*) FROM tournament_results WHERE tournament_id = NEW.id);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Add physical_rewards column to tournament_results if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournament_results' AND column_name = 'physical_rewards') THEN
    ALTER TABLE tournament_results ADD COLUMN physical_rewards TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Create tournament rewards preview function
CREATE OR REPLACE FUNCTION public.get_tournament_reward_preview(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_tournament RECORD;
  v_rewards jsonb := '[]'::jsonb;
  v_multiplier numeric := 1.0;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Calculate multiplier
  v_multiplier := CASE 
    WHEN v_tournament.tournament_type = 'season' THEN 1.5
    WHEN v_tournament.tournament_type = 'open' THEN 2.0
    ELSE 1.0
  END;
  
  -- Build rewards structure for different positions and ranks
  SELECT jsonb_agg(
    jsonb_build_object(
      'position', pos,
      'position_name', CASE 
        WHEN pos = 1 THEN 'Vô địch'
        WHEN pos = 2 THEN 'Á quân'  
        WHEN pos = 3 THEN 'Hạng ba'
        WHEN pos = 4 THEN 'Hạng tư'
        WHEN pos <= 8 THEN 'Top 8'
        WHEN pos <= 16 THEN 'Top 16'
        ELSE 'Tham gia'
      END,
      'elo_points', CASE 
        WHEN pos = 1 THEN 100
        WHEN pos = 2 THEN 50
        WHEN pos = 3 THEN 25
        WHEN pos = 4 THEN 12
        WHEN pos <= 8 THEN 6
        WHEN pos <= 16 THEN 3
        ELSE 1
      END,
      'prize_money', CASE 
        WHEN pos = 1 THEN 5000000
        WHEN pos = 2 THEN 3000000
        WHEN pos = 3 THEN 2000000
        WHEN pos = 4 THEN 1000000
        WHEN pos <= 8 THEN 500000
        ELSE 0
      END,
      'physical_rewards', CASE 
        WHEN pos = 1 THEN jsonb_build_array('Cúp vô địch', 'Giấy chứng nhận', 'Huy hiệu vàng')
        WHEN pos = 2 THEN jsonb_build_array('Huy chương bạc', 'Giấy chứng nhận')
        WHEN pos = 3 THEN jsonb_build_array('Huy chương đồng', 'Giấy chứng nhận')
        WHEN pos <= 8 THEN jsonb_build_array('Giấy chứng nhận Top 8')
        ELSE jsonb_build_array('Giấy chứng nhận tham gia')
      END,
      'spa_by_rank', jsonb_build_object(
        'E+', (CASE WHEN pos = 1 THEN 2000 WHEN pos = 2 THEN 1400 WHEN pos = 3 THEN 1000 WHEN pos <= 8 THEN 600 ELSE 400 END * v_multiplier)::integer,
        'E', (CASE WHEN pos = 1 THEN 1800 WHEN pos = 2 THEN 1200 WHEN pos = 3 THEN 900 WHEN pos <= 8 THEN 500 ELSE 350 END * v_multiplier)::integer,
        'F+', (CASE WHEN pos = 1 THEN 1600 WHEN pos = 2 THEN 1000 WHEN pos = 3 THEN 800 WHEN pos <= 8 THEN 400 ELSE 300 END * v_multiplier)::integer,
        'F', (CASE WHEN pos = 1 THEN 1400 WHEN pos = 2 THEN 900 WHEN pos = 3 THEN 700 WHEN pos <= 8 THEN 350 ELSE 250 END * v_multiplier)::integer,
        'G+', (CASE WHEN pos = 1 THEN 1200 WHEN pos = 2 THEN 800 WHEN pos = 3 THEN 600 WHEN pos <= 8 THEN 300 ELSE 200 END * v_multiplier)::integer,
        'G', (CASE WHEN pos = 1 THEN 1000 WHEN pos = 2 THEN 700 WHEN pos = 3 THEN 500 WHEN pos <= 8 THEN 250 ELSE 200 END * v_multiplier)::integer,
        'H+', (CASE WHEN pos = 1 THEN 800 WHEN pos = 2 THEN 600 WHEN pos = 3 THEN 400 WHEN pos <= 8 THEN 200 ELSE 200 END * v_multiplier)::integer,
        'H', (CASE WHEN pos = 1 THEN 600 WHEN pos = 2 THEN 500 WHEN pos = 3 THEN 350 WHEN pos <= 8 THEN 200 ELSE 200 END * v_multiplier)::integer,
        'I+', (CASE WHEN pos = 1 THEN 500 WHEN pos = 2 THEN 400 WHEN pos = 3 THEN 300 WHEN pos <= 8 THEN 200 ELSE 200 END * v_multiplier)::integer,
        'I', (CASE WHEN pos = 1 THEN 400 WHEN pos = 2 THEN 300 WHEN pos = 3 THEN 250 WHEN pos <= 8 THEN 200 ELSE 200 END * v_multiplier)::integer,
        'K+', (CASE WHEN pos = 1 THEN 300 WHEN pos = 2 THEN 200 WHEN pos = 3 THEN 150 WHEN pos <= 8 THEN 200 ELSE 200 END * v_multiplier)::integer,
        'K', (CASE WHEN pos = 1 THEN 300 WHEN pos = 2 THEN 200 WHEN pos = 3 THEN 150 WHEN pos <= 8 THEN 200 ELSE 200 END * v_multiplier)::integer
      )
    )
  ) INTO v_rewards
  FROM generate_series(1, LEAST(v_tournament.max_participants, 20)) AS pos;
  
  RETURN jsonb_build_object(
    'tournament_id', p_tournament_id,
    'tournament_name', v_tournament.name,
    'tournament_type', v_tournament.tournament_type,
    'multiplier', v_multiplier,
    'rewards', v_rewards
  );
END;
$function$;

-- Fix existing tournament results that have incorrect positions
-- This will reset positions to be sequential 1-N for each tournament
WITH corrected_positions AS (
  SELECT 
    tournament_id,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY tournament_id 
      ORDER BY matches_won DESC, matches_lost ASC, final_position ASC
    ) as new_position
  FROM tournament_results
)
UPDATE tournament_results tr
SET 
  final_position = cp.new_position,
  updated_at = NOW()
FROM corrected_positions cp
WHERE tr.tournament_id = cp.tournament_id 
  AND tr.user_id = cp.user_id
  AND tr.final_position != cp.new_position;
