-- Fix calculate_tournament_standings function to use user_id instead of player_id
DROP FUNCTION IF EXISTS public.calculate_tournament_standings(uuid);

CREATE OR REPLACE FUNCTION public.calculate_tournament_standings(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_registrations RECORD;
  v_standings jsonb := '[]'::jsonb;
  v_participant RECORD;
  v_wins INTEGER;
  v_losses INTEGER;
  v_total_matches INTEGER;
  v_position INTEGER := 1;
  v_spa_points INTEGER;
  v_prize_money INTEGER;
  v_participant_rank TEXT;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament
  FROM tournaments
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Process each participant
  FOR v_registrations IN 
    SELECT DISTINCT tr.user_id, p.full_name, p.display_name, pr.verified_rank
    FROM tournament_registrations tr
    JOIN profiles p ON p.user_id = tr.user_id
    LEFT JOIN player_rankings pr ON pr.user_id = tr.user_id
    WHERE tr.tournament_id = p_tournament_id 
    AND tr.registration_status = 'confirmed'
    ORDER BY p.full_name
  LOOP
    -- Calculate wins for this participant
    SELECT COUNT(*) INTO v_wins
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
    AND winner_id = v_registrations.user_id
    AND status = 'completed';
    
    -- Calculate total matches for this participant  
    SELECT COUNT(*) INTO v_total_matches
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
    AND (player1_id = v_registrations.user_id OR player2_id = v_registrations.user_id)
    AND status = 'completed';
    
    -- Calculate losses
    v_losses := v_total_matches - v_wins;
    
    -- Determine rank for prize calculation
    v_participant_rank := COALESCE(v_registrations.verified_rank, 'Unranked');
    
    -- Calculate SPA points based on performance and rank
    v_spa_points := CASE
      WHEN v_wins >= 4 THEN 
        CASE 
          WHEN v_participant_rank IN ('G+', 'G', 'F+', 'F') THEN 300 + (v_wins * 25)
          WHEN v_participant_rank IN ('E+', 'E') THEN 200 + (v_wins * 20)
          ELSE 150 + (v_wins * 15)
        END
      WHEN v_wins >= 2 THEN 
        CASE 
          WHEN v_participant_rank IN ('G+', 'G', 'F+', 'F') THEN 200 + (v_wins * 20)
          WHEN v_participant_rank IN ('E+', 'E') THEN 150 + (v_wins * 15)
          ELSE 100 + (v_wins * 10)
        END
      ELSE 50 + (v_wins * 10)
    END;
    
    -- Calculate prize money based on performance
    v_prize_money := CASE
      WHEN v_wins >= 5 THEN 500000
      WHEN v_wins = 4 THEN 300000
      WHEN v_wins = 3 THEN 150000
      WHEN v_wins = 2 THEN 75000
      ELSE 0
    END;
    
    -- Add participant to standings
    v_standings := v_standings || jsonb_build_object(
      'player_id', v_registrations.user_id,
      'player_name', COALESCE(v_registrations.display_name, v_registrations.full_name),
      'wins', v_wins,
      'losses', v_losses,
      'total_matches', v_total_matches,
      'final_position', v_position,
      'spa_points_earned', v_spa_points,
      'prize_money', v_prize_money,
      'player_rank', v_participant_rank
    );
    
    v_position := v_position + 1;
  END LOOP;
  
  -- Sort standings by wins (descending), then by losses (ascending)
  SELECT jsonb_agg(standing ORDER BY (standing->>'wins')::integer DESC, (standing->>'losses')::integer ASC)
  INTO v_standings
  FROM jsonb_array_elements(v_standings) as standing;
  
  -- Update positions after sorting
  SELECT jsonb_agg(
    jsonb_set(standing, '{final_position}', (row_number() OVER())::text::jsonb)
    ORDER BY (standing->>'wins')::integer DESC, (standing->>'losses')::integer ASC
  )
  INTO v_standings
  FROM jsonb_array_elements(v_standings) as standing;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'tournament_name', v_tournament.name,
    'standings', v_standings,
    'total_participants', jsonb_array_length(v_standings)
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

-- Rebuild Sabo 3 tournament results using the corrected function
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
FROM calculated_standings;

-- Award SPA points to participants
WITH calculated_standings AS (
  SELECT jsonb_array_elements(
    (SELECT calculate_tournament_standings('aecf2073-7665-4da7-91fb-02b1c2e6a890'::uuid)->'standings')
  ) as standing
)
INSERT INTO spa_transactions (
  user_id,
  amount,
  transaction_type,
  description,
  reference_id,
  reference_type
)
SELECT 
  (standing->>'player_id')::uuid,
  (standing->>'spa_points_earned')::integer,
  'tournament_completion',
  'Sabo 3 Tournament Completion - Position ' || (standing->>'final_position'),
  'aecf2073-7665-4da7-91fb-02b1c2e6a890'::uuid,
  'tournament'
FROM calculated_standings
WHERE (standing->>'spa_points_earned')::integer > 0;

-- Update player rankings with earned SPA points
WITH calculated_standings AS (
  SELECT jsonb_array_elements(
    (SELECT calculate_tournament_standings('aecf2073-7665-4da7-91fb-02b1c2e6a890'::uuid)->'standings')
  ) as standing
)
UPDATE player_rankings 
SET spa_points = COALESCE(spa_points, 0) + (
  SELECT (standing->>'spa_points_earned')::integer
  FROM calculated_standings cs
  WHERE (cs.standing->>'player_id')::uuid = player_rankings.user_id
)
WHERE user_id IN (
  SELECT (standing->>'player_id')::uuid FROM calculated_standings
);

-- Create notifications for participants about their results
WITH calculated_standings AS (
  SELECT jsonb_array_elements(
    (SELECT calculate_tournament_standings('aecf2073-7665-4da7-91fb-02b1c2e6a890'::uuid)->'standings')
  ) as standing
)
INSERT INTO notifications (user_id, type, title, message, priority, metadata)
SELECT 
  (standing->>'player_id')::uuid,
  'tournament_completed',
  'Kết quả Sabo 3',
  'Bạn đã hoàn thành giải đấu Sabo 3 ở vị trí thứ ' || (standing->>'final_position') || ' và nhận được ' || (standing->>'spa_points_earned') || ' điểm SPA',
  'high',
  jsonb_build_object(
    'tournament_id', 'aecf2073-7665-4da7-91fb-02b1c2e6a890',
    'position', (standing->>'final_position')::integer,
    'spa_points', (standing->>'spa_points_earned')::integer,
    'prize_money', (standing->>'prize_money')::integer
  )
FROM calculated_standings;