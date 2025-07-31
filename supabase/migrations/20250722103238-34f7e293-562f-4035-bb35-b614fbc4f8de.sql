
-- Phase 1: Reset dữ liệu demo và giữ lại 100 SPA từ rank verification
-- Step 1: Backup và xóa dữ liệu demo từ tournament_results
DELETE FROM tournament_results WHERE tournament_id = 'acd33d20-b841-474d-a754-31a33647cc93';

-- Step 2: Reset player_rankings về giá trị mặc định (trừ verified rank SPA)
UPDATE player_rankings 
SET 
  spa_points = CASE 
    WHEN verified_rank IS NOT NULL AND verified_rank != 'K' THEN 100 
    ELSE 0 
  END,
  elo_points = 1000,
  total_matches = 0,
  wins = 0,
  losses = 0,
  win_streak = 0,
  tournament_wins = 0,
  updated_at = NOW()
WHERE user_id IN (
  SELECT DISTINCT user_id FROM tournament_registrations 
  WHERE tournament_id = 'acd33d20-b841-474d-a754-31a33647cc93'
);

-- Step 3: Thêm SPA points log cho rank verification (nếu chưa có)
INSERT INTO spa_points_log (user_id, points_earned, source_type, description, created_at)
SELECT 
  pr.user_id,
  100,
  'rank_verification',
  'Xác thực hạng ' || pr.verified_rank || ' thành công',
  NOW()
FROM player_rankings pr
WHERE pr.verified_rank IS NOT NULL 
  AND pr.verified_rank != 'K'
  AND NOT EXISTS (
    SELECT 1 FROM spa_points_log spl 
    WHERE spl.user_id = pr.user_id 
    AND spl.source_type = 'rank_verification'
  );

-- Phase 2: Cập nhật logic tính toán tournament_results
-- Sửa lại function calculate_tournament_results với logic chính xác
CREATE OR REPLACE FUNCTION public.calculate_tournament_results(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_result_count INTEGER := 0;
  v_final_match RECORD;
  v_champion_id UUID;
  v_runner_up_id UUID;
  v_multiplier NUMERIC := 1.0;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF v_tournament IS NULL THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Get tournament multiplier
  v_multiplier := CASE 
    WHEN v_tournament.tournament_type = 'season' THEN 1.5
    WHEN v_tournament.tournament_type = 'open' THEN 2.0
    ELSE 1.0
  END;
  
  -- Clear existing results for this tournament
  DELETE FROM tournament_results WHERE tournament_id = p_tournament_id;
  
  -- Find final match to determine champion and runner-up
  SELECT * INTO v_final_match
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND round_number = (
      SELECT MAX(round_number) 
      FROM tournament_matches 
      WHERE tournament_id = p_tournament_id
    )
    AND status = 'completed'
    AND winner_id IS NOT NULL
    AND NOT COALESCE(is_third_place_match, false)
  ORDER BY match_number
  LIMIT 1;
  
  IF v_final_match IS NULL THEN
    RETURN jsonb_build_object('error', 'No completed final match found');
  END IF;
  
  v_champion_id := v_final_match.winner_id;
  v_runner_up_id := CASE 
    WHEN v_final_match.player1_id = v_champion_id THEN v_final_match.player2_id
    ELSE v_final_match.player1_id
  END;
  
  -- Insert results for all participants
  WITH participant_positions AS (
    SELECT 
      p.user_id,
      CASE 
        WHEN p.user_id = v_champion_id THEN 1
        WHEN p.user_id = v_runner_up_id THEN 2
        ELSE
          -- Calculate position based on elimination round
          CASE 
            WHEN p.eliminated_round = v_final_match.round_number - 1 THEN 
              3 + ROW_NUMBER() OVER (
                PARTITION BY p.eliminated_round 
                ORDER BY p.wins DESC, p.total_matches ASC
              ) - 1
            WHEN p.eliminated_round = v_final_match.round_number - 2 THEN 
              5 + ROW_NUMBER() OVER (
                PARTITION BY p.eliminated_round 
                ORDER BY p.wins DESC, p.total_matches ASC
              ) - 1
            ELSE 
              9 + ROW_NUMBER() OVER (
                PARTITION BY p.eliminated_round 
                ORDER BY p.wins DESC, p.total_matches ASC
              ) - 1
          END
      END as final_position,
      p.total_matches,
      p.wins,
      p.losses,
      p.eliminated_round
    FROM (
      -- Calculate participant stats
      SELECT 
        participants.user_id,
        COUNT(tm.id) as total_matches,
        COUNT(CASE WHEN tm.winner_id = participants.user_id THEN 1 END) as wins,
        COUNT(CASE WHEN tm.winner_id IS NOT NULL AND tm.winner_id != participants.user_id THEN 1 END) as losses,
        -- Find elimination round (last round where they lost or max round if champion)
        CASE 
          WHEN participants.user_id = v_champion_id THEN v_final_match.round_number
          ELSE COALESCE(
            (SELECT MAX(tm2.round_number) 
             FROM tournament_matches tm2 
             WHERE tm2.tournament_id = p_tournament_id
               AND (tm2.player1_id = participants.user_id OR tm2.player2_id = participants.user_id)
               AND tm2.winner_id IS NOT NULL 
               AND tm2.winner_id != participants.user_id), 
            1
          )
        END as eliminated_round
      FROM (
        SELECT DISTINCT user_id
        FROM tournament_registrations 
        WHERE tournament_id = p_tournament_id 
          AND registration_status = 'confirmed'
      ) participants
      LEFT JOIN tournament_matches tm ON 
        tm.tournament_id = p_tournament_id 
        AND (tm.player1_id = participants.user_id OR tm.player2_id = participants.user_id)
        AND tm.status = 'completed'
      GROUP BY participants.user_id
    ) p
  )
  INSERT INTO tournament_results (
    tournament_id, 
    user_id, 
    final_position, 
    matches_played, 
    matches_won, 
    matches_lost,
    win_percentage,
    spa_points_earned, 
    elo_points_awarded, 
    prize_amount,
    physical_rewards,
    created_at,
    updated_at
  )
  SELECT 
    p_tournament_id,
    pp.user_id,
    pp.final_position,
    pp.total_matches,
    pp.wins,
    pp.losses,
    CASE 
      WHEN pp.total_matches > 0 THEN ROUND((pp.wins::NUMERIC / pp.total_matches * 100), 2)
      ELSE 0 
    END as win_percentage,
    -- SPA points with multiplier
    ROUND((CASE 
      WHEN pp.final_position = 1 THEN 1000
      WHEN pp.final_position = 2 THEN 700
      WHEN pp.final_position = 3 THEN 500
      WHEN pp.final_position = 4 THEN 400
      WHEN pp.final_position <= 8 THEN 300
      WHEN pp.final_position <= 16 THEN 200
      ELSE 100
    END * v_multiplier)) as spa_points_earned,
    -- ELO points
    CASE 
      WHEN pp.final_position = 1 THEN 100
      WHEN pp.final_position = 2 THEN 75
      WHEN pp.final_position = 3 THEN 50
      WHEN pp.final_position = 4 THEN 40
      WHEN pp.final_position <= 8 THEN 25
      WHEN pp.final_position <= 16 THEN 15
      ELSE 5
    END as elo_points_awarded,
    -- Prize money
    CASE 
      WHEN pp.final_position = 1 THEN 5000000
      WHEN pp.final_position = 2 THEN 3000000
      WHEN pp.final_position = 3 THEN 1500000
      WHEN pp.final_position = 4 THEN 1000000
      WHEN pp.final_position <= 8 THEN 500000
      WHEN pp.final_position <= 16 THEN 200000
      ELSE 100000
    END as prize_amount,
    -- Physical rewards
    CASE 
      WHEN pp.final_position = 1 THEN '["Cúp vô địch", "Huy chương vàng", "Giấy chứng nhận"]'::jsonb
      WHEN pp.final_position = 2 THEN '["Huy chương bạc", "Giấy chứng nhận"]'::jsonb
      WHEN pp.final_position = 3 THEN '["Huy chương đồng", "Giấy chứng nhận"]'::jsonb
      WHEN pp.final_position <= 8 THEN '["Giấy chứng nhận"]'::jsonb
      ELSE '["Giấy chứng nhận tham gia"]'::jsonb
    END as physical_rewards,
    NOW(),
    NOW()
  FROM participant_positions pp
  ORDER BY pp.final_position;
  
  GET DIAGNOSTICS v_result_count = ROW_COUNT;
  
  -- Auto-insert SPA points log
  INSERT INTO spa_points_log (user_id, source_type, source_id, points_earned, description, created_at)
  SELECT 
    tr.user_id,
    'tournament',
    p_tournament_id,
    tr.spa_points_earned,
    'Vị trí ' || tr.final_position || ' trong ' || v_tournament.name,
    NOW()
  FROM tournament_results tr
  WHERE tr.tournament_id = p_tournament_id;
  
  -- Auto-update player rankings
  UPDATE player_rankings pr
  SET 
    spa_points = pr.spa_points + tr.spa_points_earned,
    elo_points = pr.elo_points + tr.elo_points_awarded,
    total_matches = pr.total_matches + tr.matches_played,
    wins = pr.wins + tr.matches_won,
    losses = pr.losses + tr.matches_lost,
    tournament_wins = CASE WHEN tr.final_position = 1 THEN pr.tournament_wins + 1 ELSE pr.tournament_wins END,
    updated_at = NOW()
  FROM tournament_results tr
  WHERE pr.user_id = tr.user_id 
    AND tr.tournament_id = p_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'results_created', v_result_count,
    'champion_id', v_champion_id,
    'runner_up_id', v_runner_up_id,
    'multiplier', v_multiplier,
    'message', 'Tournament results calculated successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to calculate tournament results: ' || SQLERRM
    );
END;
$$;

-- Test the function with test5 tournament
SELECT public.calculate_tournament_results('acd33d20-b841-474d-a754-31a33647cc93'::uuid);
