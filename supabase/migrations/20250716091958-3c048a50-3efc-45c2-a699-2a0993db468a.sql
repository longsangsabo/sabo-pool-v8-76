-- Fix the calculate_tournament_standings function - remove window function from aggregate
DROP FUNCTION IF EXISTS public.calculate_tournament_standings(uuid);

CREATE OR REPLACE FUNCTION public.calculate_tournament_standings(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_standings jsonb := '[]'::jsonb;
  v_position INTEGER := 1;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament
  FROM tournaments
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Build standings with proper position calculation
  WITH participant_stats AS (
    SELECT DISTINCT 
      tr.user_id,
      p.full_name,
      p.display_name,
      pr.verified_rank,
      -- Calculate wins
      (SELECT COUNT(*) 
       FROM tournament_matches tm 
       WHERE tm.tournament_id = p_tournament_id 
       AND tm.winner_id = tr.user_id 
       AND tm.status = 'completed') as wins,
      -- Calculate total matches
      (SELECT COUNT(*) 
       FROM tournament_matches tm 
       WHERE tm.tournament_id = p_tournament_id 
       AND (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id) 
       AND tm.status = 'completed') as total_matches
    FROM tournament_registrations tr
    JOIN profiles p ON p.user_id = tr.user_id
    LEFT JOIN player_rankings pr ON pr.user_id = tr.user_id
    WHERE tr.tournament_id = p_tournament_id 
    AND tr.registration_status = 'confirmed'
  ),
  ranked_participants AS (
    SELECT 
      user_id,
      COALESCE(display_name, full_name) as player_name,
      wins,
      (total_matches - wins) as losses,
      total_matches,
      COALESCE(verified_rank, 'Unranked') as player_rank,
      ROW_NUMBER() OVER (ORDER BY wins DESC, (total_matches - wins) ASC) as final_position
    FROM participant_stats
  ),
  final_standings AS (
    SELECT 
      user_id,
      player_name,
      wins,
      losses,
      total_matches,
      final_position,
      player_rank,
      -- Calculate SPA points based on performance and rank
      CASE
        WHEN wins >= 4 THEN 
          CASE 
            WHEN player_rank IN ('G+', 'G', 'F+', 'F') THEN 300 + (wins * 25)
            WHEN player_rank IN ('E+', 'E') THEN 200 + (wins * 20)
            ELSE 150 + (wins * 15)
          END
        WHEN wins >= 2 THEN 
          CASE 
            WHEN player_rank IN ('G+', 'G', 'F+', 'F') THEN 200 + (wins * 20)
            WHEN player_rank IN ('E+', 'E') THEN 150 + (wins * 15)
            ELSE 100 + (wins * 10)
          END
        ELSE 50 + (wins * 10)
      END as spa_points_earned,
      -- Calculate prize money based on performance
      CASE
        WHEN wins >= 5 THEN 500000
        WHEN wins = 4 THEN 300000
        WHEN wins = 3 THEN 150000
        WHEN wins = 2 THEN 75000
        ELSE 0
      END as prize_money
    FROM ranked_participants
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'player_id', user_id,
      'player_name', player_name,
      'wins', wins,
      'losses', losses,
      'total_matches', total_matches,
      'final_position', final_position,
      'spa_points_earned', spa_points_earned,
      'prize_money', prize_money,
      'player_rank', player_rank
    ) ORDER BY final_position
  ) INTO v_standings
  FROM final_standings;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'tournament_name', v_tournament.name,
    'standings', COALESCE(v_standings, '[]'::jsonb),
    'total_participants', COALESCE(jsonb_array_length(v_standings), 0)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'details', SQLSTATE
    );
END;
$$;

-- Now rebuild Sabo 3 results with the fixed function
DELETE FROM tournament_results WHERE tournament_id = 'aecf2073-7665-4da7-91fb-02b1c2e6a890';

-- Calculate and insert correct standings for Sabo 3
WITH calculated_standings AS (
  SELECT jsonb_array_elements(
    (SELECT calculate_tournament_standings('aecf2073-7665-4da7-91fb-02b1c2e6a890'::uuid)->'standings')
  ) as standing
)
INSERT INTO tournament_results (
  tournament_id,
  user_id,
  final_position,
  prize_money,
  spa_points_earned,
  elo_points_earned,
  matches_played,
  matches_won,
  matches_lost
)
SELECT 
  'aecf2073-7665-4da7-91fb-02b1c2e6a890'::uuid,
  (standing->>'player_id')::uuid,
  (standing->>'final_position')::integer,
  (standing->>'prize_money')::integer,
  (standing->>'spa_points_earned')::integer,
  ROUND((standing->>'spa_points_earned')::numeric * 0.1),
  (standing->>'total_matches')::integer,
  (standing->>'wins')::integer,
  (standing->>'losses')::integer
FROM calculated_standings
WHERE standing IS NOT NULL;