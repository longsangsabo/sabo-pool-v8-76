-- Create the calculate_tournament_results function and complete tournament
CREATE OR REPLACE FUNCTION public.calculate_tournament_results(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_result_count INTEGER := 0;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF v_tournament IS NULL THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Clear existing results for this tournament
  DELETE FROM tournament_results WHERE tournament_id = p_tournament_id;
  
  -- Insert results based on match outcomes for completed tournaments
  INSERT INTO tournament_results (
    tournament_id, user_id, final_position, total_matches, wins, losses, 
    win_percentage, spa_points_earned, elo_points_awarded, prize_amount
  )
  SELECT 
    p_tournament_id,
    p.user_id,
    CASE 
      WHEN tm_final.winner_id = p.user_id THEN 1  -- Champion
      WHEN tm_final.player1_id = p.user_id OR tm_final.player2_id = p.user_id THEN 2  -- Runner-up
      ELSE 3  -- Other positions
    END as final_position,
    COALESCE(matches_played, 0) as total_matches,
    COALESCE(wins_count, 0) as wins,
    COALESCE(matches_played - wins_count, 0) as losses,
    CASE 
      WHEN COALESCE(matches_played, 0) > 0 THEN ROUND((COALESCE(wins_count, 0)::numeric / matches_played * 100), 2)
      ELSE 0 
    END as win_percentage,
    CASE 
      WHEN tm_final.winner_id = p.user_id THEN 1000  -- Champion gets 1000 SPA
      WHEN tm_final.player1_id = p.user_id OR tm_final.player2_id = p.user_id THEN 700  -- Runner-up gets 700 SPA
      ELSE 500  -- Others get 500 SPA
    END as spa_points_earned,
    CASE 
      WHEN tm_final.winner_id = p.user_id THEN 100  -- Champion gets 100 ELO
      WHEN tm_final.player1_id = p.user_id OR tm_final.player2_id = p.user_id THEN 50  -- Runner-up gets 50 ELO
      ELSE 25  -- Others get 25 ELO
    END as elo_points_awarded,
    CASE 
      WHEN tm_final.winner_id = p.user_id THEN 1400000  -- Champion prize from tournament config
      WHEN tm_final.player1_id = p.user_id OR tm_final.player2_id = p.user_id THEN 840000  -- Runner-up prize
      ELSE 560000  -- Third place prize
    END as prize_amount
  FROM (
    -- Get all tournament participants
    SELECT DISTINCT 
      COALESCE(tm.player1_id, tm.player2_id) as user_id
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND (tm.player1_id IS NOT NULL OR tm.player2_id IS NOT NULL)
    
    UNION
    
    SELECT DISTINCT tm.player2_id as user_id
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND tm.player2_id IS NOT NULL
  ) p
  LEFT JOIN (
    -- Calculate match statistics for each player
    SELECT 
      player_id,
      COUNT(*) as matches_played,
      SUM(CASE WHEN is_winner THEN 1 ELSE 0 END) as wins_count
    FROM (
      SELECT 
        tm.player1_id as player_id,
        CASE WHEN tm.winner_id = tm.player1_id THEN 1 ELSE 0 END as is_winner
      FROM tournament_matches tm
      WHERE tm.tournament_id = p_tournament_id 
        AND tm.status = 'completed'
        AND tm.player1_id IS NOT NULL
      
      UNION ALL
      
      SELECT 
        tm.player2_id as player_id,
        CASE WHEN tm.winner_id = tm.player2_id THEN 1 ELSE 0 END as is_winner
      FROM tournament_matches tm
      WHERE tm.tournament_id = p_tournament_id 
        AND tm.status = 'completed'
        AND tm.player2_id IS NOT NULL
    ) player_matches
    GROUP BY player_id
  ) stats ON p.user_id = stats.player_id
  LEFT JOIN (
    -- Get final match info to determine champion and runner-up
    SELECT tm.*
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND tm.round_number = (
        SELECT MAX(round_number) 
        FROM tournament_matches 
        WHERE tournament_id = p_tournament_id
      )
      AND tm.status = 'completed'
    ORDER BY tm.match_number
    LIMIT 1
  ) tm_final ON true
  WHERE p.user_id IS NOT NULL;
  
  GET DIAGNOSTICS v_result_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'results_created', v_result_count,
    'message', 'Tournament results calculated successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to calculate tournament results: ' || SQLERRM
    );
END;
$$;

-- Now complete the tournament and generate results
SELECT public.force_complete_tournament_status('727a8ae8-0598-47bf-b305-2fc2bc60b57d'::uuid);
SELECT public.calculate_tournament_results('727a8ae8-0598-47bf-b305-2fc2bc60b57d'::uuid);