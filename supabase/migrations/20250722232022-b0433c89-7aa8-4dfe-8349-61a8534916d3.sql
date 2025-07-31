
-- Fix tournament results logic and database issues

-- 1. Drop and recreate the tournament_results table with correct schema
DROP TABLE IF EXISTS tournament_results CASCADE;

CREATE TABLE tournament_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  final_position integer NOT NULL,
  matches_played integer DEFAULT 0,
  matches_won integer DEFAULT 0,
  matches_lost integer DEFAULT 0,
  win_percentage numeric DEFAULT 0,
  spa_points_earned integer DEFAULT 0,
  elo_points_earned integer DEFAULT 0,
  prize_amount numeric DEFAULT 0,
  physical_rewards jsonb DEFAULT '[]'::jsonb,
  placement_type text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view tournament results"
ON tournament_results FOR SELECT
USING (true);

CREATE POLICY "System can manage tournament results"
ON tournament_results FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND is_admin = true
  )
);

-- 2. Create improved tournament completion function
CREATE OR REPLACE FUNCTION public.complete_tournament_automatically(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament RECORD;
  v_participant RECORD;
  v_final_round INTEGER;
  v_results_exist BOOLEAN;
  v_placement_counter INTEGER := 1;
  v_spa_multiplier NUMERIC;
  v_elo_multiplier NUMERIC;
  v_prize_pool NUMERIC;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Check if results already exist
  SELECT EXISTS(
    SELECT 1 FROM tournament_results WHERE tournament_id = p_tournament_id
  ) INTO v_results_exist;
  
  IF v_results_exist THEN
    RETURN jsonb_build_object('error', 'Tournament results already exist');
  END IF;
  
  -- Get final round number
  SELECT MAX(round_number) INTO v_final_round
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id;
  
  -- Calculate prize pool and multipliers based on tournament tier
  v_prize_pool := COALESCE(v_tournament.prize_pool, v_tournament.entry_fee * 20);
  v_spa_multiplier := CASE 
    WHEN v_tournament.tier = 'pro' THEN 2.0
    WHEN v_tournament.tier = 'advanced' THEN 1.5
    ELSE 1.0
  END;
  v_elo_multiplier := 1.0;
  
  -- Process results by bracket progression for single elimination
  WITH bracket_standings AS (
    -- Champion (winner of final match)
    SELECT 
      tm.winner_id as user_id,
      1 as final_position,
      'champion' as placement_type,
      COUNT(tm_all.id) as matches_played,
      COUNT(CASE WHEN tm_all.winner_id = tm.winner_id THEN 1 END) as matches_won
    FROM tournament_matches tm
    LEFT JOIN tournament_matches tm_all ON (
      tm_all.tournament_id = p_tournament_id 
      AND (tm_all.player1_id = tm.winner_id OR tm_all.player2_id = tm.winner_id)
      AND tm_all.status = 'completed'
    )
    WHERE tm.tournament_id = p_tournament_id 
    AND tm.round_number = v_final_round 
    AND tm.match_number = 1
    AND tm.status = 'completed'
    AND tm.winner_id IS NOT NULL
    AND (tm.is_third_place_match IS NULL OR tm.is_third_place_match = false)
    GROUP BY tm.winner_id
    
    UNION ALL
    
    -- Runner-up (loser of final match)
    SELECT 
      CASE 
        WHEN tm.player1_id = tm.winner_id THEN tm.player2_id 
        ELSE tm.player1_id 
      END as user_id,
      2 as final_position,
      'runner_up' as placement_type,
      COUNT(tm_all.id) as matches_played,
      COUNT(CASE WHEN tm_all.winner_id = CASE WHEN tm.player1_id = tm.winner_id THEN tm.player2_id ELSE tm.player1_id END THEN 1 END) as matches_won
    FROM tournament_matches tm
    LEFT JOIN tournament_matches tm_all ON (
      tm_all.tournament_id = p_tournament_id 
      AND (tm_all.player1_id = CASE WHEN tm.player1_id = tm.winner_id THEN tm.player2_id ELSE tm.player1_id END 
           OR tm_all.player2_id = CASE WHEN tm.player1_id = tm.winner_id THEN tm.player2_id ELSE tm.player1_id END)
      AND tm_all.status = 'completed'
    )
    WHERE tm.tournament_id = p_tournament_id 
    AND tm.round_number = v_final_round 
    AND tm.match_number = 1
    AND tm.status = 'completed'
    AND tm.winner_id IS NOT NULL
    AND (tm.is_third_place_match IS NULL OR tm.is_third_place_match = false)
    GROUP BY CASE WHEN tm.player1_id = tm.winner_id THEN tm.player2_id ELSE tm.player1_id END
    
    UNION ALL
    
    -- Third place (if third place match exists)
    SELECT 
      tm.winner_id as user_id,
      3 as final_position,
      'third_place' as placement_type,
      COUNT(tm_all.id) as matches_played,
      COUNT(CASE WHEN tm_all.winner_id = tm.winner_id THEN 1 END) as matches_won
    FROM tournament_matches tm
    LEFT JOIN tournament_matches tm_all ON (
      tm_all.tournament_id = p_tournament_id 
      AND (tm_all.player1_id = tm.winner_id OR tm_all.player2_id = tm.winner_id)
      AND tm_all.status = 'completed'
    )
    WHERE tm.tournament_id = p_tournament_id 
    AND tm.is_third_place_match = true
    AND tm.status = 'completed'
    AND tm.winner_id IS NOT NULL
    GROUP BY tm.winner_id
    
    UNION ALL
    
    -- Fourth place (loser of third place match)
    SELECT 
      CASE 
        WHEN tm.player1_id = tm.winner_id THEN tm.player2_id 
        ELSE tm.player1_id 
      END as user_id,
      4 as final_position,
      'fourth_place' as placement_type,
      COUNT(tm_all.id) as matches_played,
      COUNT(CASE WHEN tm_all.winner_id = CASE WHEN tm.player1_id = tm.winner_id THEN tm.player2_id ELSE tm.player1_id END THEN 1 END) as matches_won
    FROM tournament_matches tm
    LEFT JOIN tournament_matches tm_all ON (
      tm_all.tournament_id = p_tournament_id 
      AND (tm_all.player1_id = CASE WHEN tm.player1_id = tm.winner_id THEN tm.player2_id ELSE tm.player1_id END 
           OR tm_all.player2_id = CASE WHEN tm.player1_id = tm.winner_id THEN tm.player2_id ELSE tm.player1_id END)
      AND tm_all.status = 'completed'
    )
    WHERE tm.tournament_id = p_tournament_id 
    AND tm.is_third_place_match = true
    AND tm.status = 'completed'
    AND tm.winner_id IS NOT NULL
    GROUP BY CASE WHEN tm.player1_id = tm.winner_id THEN tm.player2_id ELSE tm.player1_id END
    
    UNION ALL
    
    -- Remaining participants (by elimination round)
    SELECT 
      tr.user_id,
      ROW_NUMBER() OVER (ORDER BY last_round DESC, matches_won DESC, matches_played ASC) + 4 as final_position,
      'eliminated' as placement_type,
      matches_played,
      matches_won
    FROM (
      SELECT 
        COALESCE(tm.player1_id, tm.player2_id) as user_id,
        MAX(tm.round_number) as last_round,
        COUNT(tm_all.id) as matches_played,
        COUNT(CASE WHEN tm_all.winner_id = COALESCE(tm.player1_id, tm.player2_id) THEN 1 END) as matches_won
      FROM tournament_registrations tr
      LEFT JOIN tournament_matches tm ON (
        (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id)
        AND tm.tournament_id = p_tournament_id 
        AND tm.status = 'completed'
        AND tm.winner_id != tr.user_id
      )
      LEFT JOIN tournament_matches tm_all ON (
        (tm_all.player1_id = tr.user_id OR tm_all.player2_id = tr.user_id)
        AND tm_all.tournament_id = p_tournament_id 
        AND tm_all.status = 'completed'
      )
      WHERE tr.tournament_id = p_tournament_id 
      AND tr.registration_status = 'confirmed'
      AND tr.user_id NOT IN (
        -- Exclude top 4 finishers
        SELECT user_id FROM bracket_standings WHERE final_position <= 4
      )
      GROUP BY tr.user_id
    ) tr
  )
  
  -- Insert tournament results
  INSERT INTO tournament_results (
    tournament_id,
    user_id,
    final_position,
    matches_played,
    matches_won,
    matches_lost,
    win_percentage,
    spa_points_earned,
    elo_points_earned,
    prize_amount,
    physical_rewards,
    placement_type
  )
  SELECT 
    p_tournament_id,
    bs.user_id,
    bs.final_position,
    bs.matches_played,
    bs.matches_won,
    GREATEST(0, bs.matches_played - bs.matches_won) as matches_lost,
    CASE 
      WHEN bs.matches_played > 0 THEN ROUND((bs.matches_won::numeric / bs.matches_played) * 100, 2)
      ELSE 0 
    END as win_percentage,
    -- SPA points calculation
    ROUND((CASE bs.final_position
      WHEN 1 THEN 1000
      WHEN 2 THEN 700  
      WHEN 3 THEN 500
      WHEN 4 THEN 400
      ELSE GREATEST(100, 300 - (bs.final_position - 5) * 50)
    END) * v_spa_multiplier) as spa_points_earned,
    -- ELO points calculation
    ROUND((CASE bs.final_position
      WHEN 1 THEN 100
      WHEN 2 THEN 50
      WHEN 3 THEN 25  
      WHEN 4 THEN 15
      ELSE GREATEST(5, 20 - (bs.final_position - 5) * 2)
    END) * v_elo_multiplier) as elo_points_earned,
    -- Prize money calculation
    CASE bs.final_position
      WHEN 1 THEN v_prize_pool * 0.5
      WHEN 2 THEN v_prize_pool * 0.3
      WHEN 3 THEN v_prize_pool * 0.15
      WHEN 4 THEN v_prize_pool * 0.05
      ELSE 0
    END as prize_amount,
    -- Physical rewards
    CASE bs.final_position
      WHEN 1 THEN '["Cúp vô địch", "Huy chương vàng", "Giấy chứng nhận"]'::jsonb
      WHEN 2 THEN '["Huy chương bạc", "Giấy chứng nhận"]'::jsonb  
      WHEN 3 THEN '["Huy chương đồng", "Giấy chứng nhận"]'::jsonb
      WHEN 4 THEN '["Giấy chứng nhận"]'::jsonb
      ELSE '[]'::jsonb
    END as physical_rewards,
    bs.placement_type
  FROM bracket_standings bs
  ORDER BY bs.final_position;
  
  -- Update tournament status
  UPDATE tournaments 
  SET status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'results_created', (SELECT COUNT(*) FROM tournament_results WHERE tournament_id = p_tournament_id),
    'completed_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to complete tournament: ' || SQLERRM
    );
END;
$$;

-- 3. Create real-time notification trigger
CREATE OR REPLACE FUNCTION notify_tournament_results_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'tournament_results_update',
    json_build_object(
      'tournament_id', NEW.tournament_id,
      'action', TG_OP,
      'user_id', NEW.user_id,
      'final_position', NEW.final_position
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for real-time updates
DROP TRIGGER IF EXISTS tournament_results_notify ON tournament_results;
CREATE TRIGGER tournament_results_notify
  AFTER INSERT OR UPDATE ON tournament_results
  FOR EACH ROW
  EXECUTE FUNCTION notify_tournament_results_update();

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournament_results_tournament_id ON tournament_results(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_user_id ON tournament_results(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_position ON tournament_results(tournament_id, final_position);
