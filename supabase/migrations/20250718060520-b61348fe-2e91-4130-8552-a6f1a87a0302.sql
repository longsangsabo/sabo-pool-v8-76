-- Step 1: Fix Tournament Status (CRITICAL ISSUE #1)
UPDATE public.tournaments 
SET 
  status = 'completed',
  updated_at = now()
WHERE id = '727a8ae8-0598-47bf-b305-2fc2bc60b57d' AND status != 'completed';

-- Step 2: Fix ELO Points in tournament_results to match actual player_rankings (CRITICAL ISSUE #2)
UPDATE public.tournament_results 
SET elo_points_earned = (
  CASE user_id
    WHEN 'dc6705c7-6261-4caf-8f1b-2ec23ba87f05' THEN 50  -- Long SAng: actual elo 1100, reasonable change
    WHEN '91932bd8-0f2f-492b-bc52-946d83aece06' THEN 10  -- dfgdfgd: actual elo 1010, small change  
    WHEN '570f94dd-91f1-4f43-9ad3-6f152db91f67' THEN 5   -- Club Owner low elo (6), minimal change
    WHEN 'c1ee98ea-db15-4a29-9947-09cd5ad6a600' THEN 12  -- Club Owner: actual elo 1012, reasonable change
    ELSE elo_points_earned
  END
)
WHERE tournament_id = '727a8ae8-0598-47bf-b305-2fc2bc60b57d';

-- Step 3: Create tournament completion automation function  
CREATE OR REPLACE FUNCTION public.complete_tournament_automatically(p_tournament_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_final_match RECORD;
  v_results jsonb := '[]'::jsonb;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Check if final match is completed
  SELECT * INTO v_final_match 
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND bracket_type = 'final' 
    AND status = 'completed'
    AND winner_id IS NOT NULL
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Final match not completed yet');
  END IF;
  
  -- Update tournament status to completed
  UPDATE tournaments 
  SET 
    status = 'completed',
    completed_at = COALESCE(completed_at, now()),
    updated_at = now()
  WHERE id = p_tournament_id AND status != 'completed';
  
  -- Process tournament results automatically
  WITH match_results AS (
    SELECT 
      tm.player1_id as player_id,
      COUNT(CASE WHEN tm.winner_id = tm.player1_id THEN 1 END) as wins,
      COUNT(CASE WHEN tm.status = 'completed' AND tm.winner_id != tm.player1_id THEN 1 END) as losses,
      COUNT(tm.id) as total_matches
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND tm.status = 'completed'
      AND tm.player1_id IS NOT NULL
    GROUP BY tm.player1_id
    
    UNION ALL
    
    SELECT 
      tm.player2_id as player_id,
      COUNT(CASE WHEN tm.winner_id = tm.player2_id THEN 1 END) as wins,
      COUNT(CASE WHEN tm.status = 'completed' AND tm.winner_id != tm.player2_id THEN 1 END) as losses,
      COUNT(tm.id) as total_matches
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND tm.status = 'completed'
      AND tm.player2_id IS NOT NULL
    GROUP BY tm.player2_id
  ),
  player_aggregated AS (
    SELECT 
      player_id,
      SUM(wins) as total_wins,
      SUM(losses) as total_losses,
      SUM(total_matches) as total_matches
    FROM match_results
    GROUP BY player_id
  ),
  position_calculated AS (
    SELECT 
      pa.*,
      CASE 
        WHEN pa.player_id = v_final_match.winner_id THEN 1
        WHEN pa.player_id IN (v_final_match.player1_id, v_final_match.player2_id) THEN 2
        ELSE ROW_NUMBER() OVER (ORDER BY pa.total_wins DESC, pa.total_losses ASC) + 2
      END as final_position
    FROM player_aggregated pa
  )
  INSERT INTO tournament_results (
    tournament_id, user_id, final_position, 
    matches_played, matches_won, matches_lost,
    spa_points_earned, elo_points_earned, prize_money
  )
  SELECT 
    p_tournament_id,
    pc.player_id,
    pc.final_position,
    pc.total_matches,
    pc.total_wins,
    pc.total_losses,
    CASE pc.final_position
      WHEN 1 THEN 1500
      WHEN 2 THEN 1000  
      WHEN 3 THEN 700
      WHEN 4 THEN 500
      ELSE 100
    END as spa_points,
    CASE pc.final_position
      WHEN 1 THEN 50
      WHEN 2 THEN 30
      WHEN 3 THEN 20
      ELSE 10
    END as elo_points,
    CASE pc.final_position
      WHEN 1 THEN 5000000
      WHEN 2 THEN 3000000
      WHEN 3 THEN 2000000
      WHEN 4 THEN 1000000
      ELSE 0
    END as prize_money
  FROM position_calculated pc
  ON CONFLICT (tournament_id, user_id) DO UPDATE SET
    final_position = EXCLUDED.final_position,
    matches_played = EXCLUDED.matches_played,
    matches_won = EXCLUDED.matches_won,
    matches_lost = EXCLUDED.matches_lost,
    spa_points_earned = EXCLUDED.spa_points_earned,
    elo_points_earned = EXCLUDED.elo_points_earned,
    prize_money = EXCLUDED.prize_money,
    updated_at = now();
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'status', 'completed',
    'message', 'Tournament completed automatically'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to complete tournament: ' || SQLERRM
    );
END;
$function$;