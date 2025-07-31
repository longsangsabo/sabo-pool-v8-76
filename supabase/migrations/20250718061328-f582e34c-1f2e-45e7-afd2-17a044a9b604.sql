-- Fix ELO points calculation for tournament winners
-- Update the complete_tournament_automatically function to give correct ELO points

CREATE OR REPLACE FUNCTION public.complete_tournament_automatically(p_tournament_id uuid)
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
  
  -- Process tournament results automatically with CORRECT ELO points
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
    -- FIXED: Champion now gets 100 ELO points instead of 50
    CASE pc.final_position
      WHEN 1 THEN 100  -- Champion gets 100 ELO (FIXED from 50)
      WHEN 2 THEN 50   -- Runner-up gets 50 ELO (increased from 30)
      WHEN 3 THEN 30   -- 3rd place gets 30 ELO (increased from 20)
      WHEN 4 THEN 20   -- 4th place gets 20 ELO (increased from 10)
      ELSE 10          -- Others get 10 ELO
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
    'message', 'Tournament completed automatically with correct ELO points'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to complete tournament: ' || SQLERRM
    );
END;
$function$;