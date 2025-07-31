-- Create comprehensive tournament completion function that updates SPA, ELO and achievements
CREATE OR REPLACE FUNCTION public.complete_any_tournament(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_tournament RECORD;
  v_final_match RECORD;
  v_rankings jsonb[];
  v_winners jsonb[];
  v_participant RECORD;
  v_position INTEGER;
  v_spa_reward INTEGER;
  v_elo_change INTEGER;
  v_achievement_check RECORD;
  v_stats jsonb;
  v_start_time TIMESTAMP := clock_timestamp();
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament 
  FROM public.tournaments 
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  -- Check if already completed
  IF v_tournament.status = 'completed' THEN
    RETURN jsonb_build_object(
      'success', true, 
      'message', 'Tournament already completed',
      'tournament', jsonb_build_object(
        'id', v_tournament.id,
        'name', v_tournament.name,
        'status', v_tournament.status,
        'completed_at', v_tournament.tournament_end
      )
    );
  END IF;
  
  -- Check if tournament can be completed (final match exists and is finished)
  SELECT * INTO v_final_match
  FROM public.tournament_matches tm
  WHERE tm.tournament_id = p_tournament_id
    AND tm.status = 'completed'
    AND tm.winner_id IS NOT NULL
  ORDER BY tm.round_number DESC, tm.match_number ASC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not ready for completion - no final match found');
  END IF;
  
  -- Get tournament rankings from completed matches
  WITH RECURSIVE tournament_participants AS (
    -- Get all unique participants
    SELECT DISTINCT user_id, full_name, display_name, verified_rank
    FROM (
      SELECT tm.player1_id as user_id, p1.full_name, p1.display_name, p1.verified_rank
      FROM public.tournament_matches tm
      JOIN public.profiles p1 ON tm.player1_id = p1.user_id
      WHERE tm.tournament_id = p_tournament_id AND tm.player1_id IS NOT NULL
      
      UNION
      
      SELECT tm.player2_id as user_id, p2.full_name, p2.display_name, p2.verified_rank
      FROM public.tournament_matches tm  
      JOIN public.profiles p2 ON tm.player2_id = p2.user_id
      WHERE tm.tournament_id = p_tournament_id AND tm.player2_id IS NOT NULL
    ) all_players
  ),
  participant_stats AS (
    SELECT 
      tp.user_id,
      tp.full_name,
      tp.display_name,
      tp.verified_rank,
      COUNT(CASE WHEN tm.winner_id = tp.user_id THEN 1 END) as wins,
      COUNT(CASE WHEN tm.winner_id IS NOT NULL AND tm.winner_id != tp.user_id 
                 AND (tm.player1_id = tp.user_id OR tm.player2_id = tp.user_id) THEN 1 END) as losses,
      COUNT(CASE WHEN tm.status = 'completed' AND (tm.player1_id = tp.user_id OR tm.player2_id = tp.user_id) THEN 1 END) as total_matches,
      -- Determine final position based on when they were eliminated
      CASE 
        WHEN tp.user_id = v_final_match.winner_id THEN 1  -- Champion
        WHEN tp.user_id IN (v_final_match.player1_id, v_final_match.player2_id) AND tp.user_id != v_final_match.winner_id THEN 2  -- Runner-up
        ELSE 
          -- For others, determine position based on elimination round
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM public.tournament_matches semi
              WHERE semi.tournament_id = p_tournament_id 
              AND semi.round_number = (v_final_match.round_number - 1)
              AND (semi.player1_id = tp.user_id OR semi.player2_id = tp.user_id)
              AND semi.winner_id != tp.user_id
              AND semi.status = 'completed'
            ) THEN 3  -- Semi-final losers (3rd place)
            ELSE 4  -- Others
          END
      END as final_position
    FROM tournament_participants tp
    LEFT JOIN public.tournament_matches tm ON (tm.player1_id = tp.user_id OR tm.player2_id = tp.user_id)
      AND tm.tournament_id = p_tournament_id
    GROUP BY tp.user_id, tp.full_name, tp.display_name, tp.verified_rank
  )
  SELECT array_agg(
    jsonb_build_object(
      'user_id', ps.user_id,
      'full_name', ps.full_name,
      'display_name', ps.display_name,
      'verified_rank', ps.verified_rank,
      'position', ps.final_position,
      'wins', ps.wins,
      'losses', ps.losses,
      'total_matches', ps.total_matches
    ) ORDER BY ps.final_position ASC, ps.wins DESC, ps.losses ASC
  ) INTO v_rankings
  FROM participant_stats ps;
  
  -- Update tournament status
  UPDATE public.tournaments 
  SET 
    status = 'completed',
    tournament_end = NOW(),
    updated_at = NOW()
  WHERE id = p_tournament_id;
  
  -- Process rewards and updates for each participant
  FOR i IN 1..array_length(v_rankings, 1) LOOP
    v_participant := (v_rankings[i])::jsonb;
    v_position := (v_participant->>'position')::INTEGER;
    
    -- Calculate SPA rewards based on position
    v_spa_reward := CASE v_position
      WHEN 1 THEN 100  -- Champion
      WHEN 2 THEN 75   -- Runner-up  
      WHEN 3 THEN 50   -- 3rd place
      ELSE 25          -- Participation
    END;
    
    -- Calculate ELO change based on performance
    v_elo_change := CASE v_position
      WHEN 1 THEN 50   -- Champion gets +50
      WHEN 2 THEN 25   -- Runner-up gets +25
      WHEN 3 THEN 10   -- 3rd place gets +10
      ELSE 5           -- Others get +5 participation
    END;
    
    -- Update player rankings
    INSERT INTO public.player_rankings (
      user_id, spa_points, elo_points, tournament_wins, total_matches, wins, updated_at
    ) VALUES (
      (v_participant->>'user_id')::UUID,
      v_spa_reward,
      1000 + v_elo_change,
      CASE WHEN v_position = 1 THEN 1 ELSE 0 END,
      (v_participant->>'total_matches')::INTEGER,
      (v_participant->>'wins')::INTEGER,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      spa_points = COALESCE(player_rankings.spa_points, 0) + v_spa_reward,
      elo_points = COALESCE(player_rankings.elo_points, 1000) + v_elo_change,
      tournament_wins = COALESCE(player_rankings.tournament_wins, 0) + CASE WHEN v_position = 1 THEN 1 ELSE 0 END,
      total_matches = COALESCE(player_rankings.total_matches, 0) + (v_participant->>'total_matches')::INTEGER,
      wins = COALESCE(player_rankings.wins, 0) + (v_participant->>'wins')::INTEGER,
      updated_at = NOW();
    
    -- Create notification for participant
    INSERT INTO public.notifications (
      user_id, type, title, message, priority, metadata
    ) VALUES (
      (v_participant->>'user_id')::UUID,
      'tournament_completed',
      'Giải đấu đã kết thúc!',
      format('Bạn đã đạt vị trí thứ %s và nhận được %s điểm SPA, %s điểm ELO', 
             v_position, v_spa_reward, v_elo_change),
      'normal',
      jsonb_build_object(
        'tournament_id', p_tournament_id,
        'tournament_name', v_tournament.name,
        'final_position', v_position,
        'spa_reward', v_spa_reward,
        'elo_change', v_elo_change
      )
    );
    
    -- Check and award achievements for winners
    IF v_position <= 3 THEN
      -- Tournament achievement
      FOR v_achievement_check IN 
        SELECT * FROM public.achievements 
        WHERE achievement_type = 'tournament' 
        AND requirements->>'min_position' IS NOT NULL
        AND v_position <= (requirements->>'min_position')::INTEGER
      LOOP
        -- Award achievement if not already earned
        INSERT INTO public.user_achievements (
          user_id, achievement_id, earned_at, tournament_id
        ) VALUES (
          (v_participant->>'user_id')::UUID,
          v_achievement_check.id,
          NOW(),
          p_tournament_id
        )
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
  
  -- Extract winners (top 3)
  SELECT array_agg(ranking) INTO v_winners
  FROM (
    SELECT unnest(v_rankings) as ranking
    ORDER BY (unnest(v_rankings)->>'position')::INTEGER
    LIMIT 3
  ) winners;
  
  -- Calculate tournament statistics
  v_stats := jsonb_build_object(
    'total_participants', array_length(v_rankings, 1),
    'total_matches', (SELECT COUNT(*) FROM public.tournament_matches WHERE tournament_id = p_tournament_id AND status = 'completed'),
    'total_spa_awarded', array_length(v_rankings, 1) * 25 + 75 + 50 + 25, -- Base calculation
    'duration_hours', ROUND(EXTRACT(EPOCH FROM (NOW() - v_tournament.created_at)) / 3600, 2),
    'completion_rate', 100.0
  );
  
  -- Log automation performance
  INSERT INTO public.automation_performance_log (
    automation_type,
    tournament_id,
    success,
    execution_time_ms,
    metadata
  ) VALUES (
    'tournament_completion',
    p_tournament_id,
    true,
    ROUND(EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000),
    jsonb_build_object(
      'participants_processed', array_length(v_rankings, 1),
      'total_spa_awarded', v_stats->'total_spa_awarded',
      'completion_method', 'complete_any_tournament_function'
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Tournament completed successfully',
    'tournament', jsonb_build_object(
      'id', v_tournament.id,
      'name', v_tournament.name,
      'status', 'completed'
    ),
    'rankings', v_rankings,
    'winners', v_winners,
    'stats', v_stats
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    INSERT INTO public.automation_performance_log (
      automation_type,
      tournament_id,
      success,
      execution_time_ms,
      error_message,
      metadata
    ) VALUES (
      'tournament_completion',
      p_tournament_id,
      false,
      ROUND(EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000),
      SQLERRM,
      jsonb_build_object(
        'error_code', SQLSTATE,
        'completion_method', 'complete_any_tournament_function'
      )
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Tournament completion failed: %s', SQLERRM)
    );
END;
$$;