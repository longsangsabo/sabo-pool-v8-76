-- Fix the complete_any_tournament function with correct SPA and ELO calculation logic
CREATE OR REPLACE FUNCTION public.complete_any_tournament(tournament_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_participant RECORD;
  v_player_rank TEXT;
  v_spa_points INTEGER;
  v_elo_points INTEGER;
  v_position_category TEXT;
  v_participants_processed INTEGER := 0;
  v_total_spa_awarded INTEGER := 0;
  v_total_elo_awarded INTEGER := 0;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = tournament_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Check if tournament is eligible for completion
  IF v_tournament.status != 'in_progress' THEN
    RETURN jsonb_build_object('error', 'Tournament must be in progress to complete');
  END IF;
  
  -- Process each participant and calculate rewards
  FOR v_participant IN
    WITH final_positions AS (
      SELECT 
        tr.user_id,
        tr.player_id,
        p.full_name,
        p.verified_rank,
        ROW_NUMBER() OVER (
          ORDER BY 
            CASE WHEN tm.winner_id = tr.player_id THEN 1 ELSE 2 END,
            COALESCE(pr.elo_points, 1000) DESC
        ) as final_position
      FROM tournament_registrations tr
      JOIN profiles p ON tr.player_id = p.user_id
      LEFT JOIN player_rankings pr ON pr.user_id = tr.player_id
      LEFT JOIN tournament_matches tm ON tm.tournament_id = tournament_uuid 
        AND tm.winner_id = tr.player_id
        AND tm.round_number = (
          SELECT MAX(round_number) FROM tournament_matches 
          WHERE tournament_id = tournament_uuid AND status = 'completed'
        )
      WHERE tr.tournament_id = tournament_uuid 
        AND tr.registration_status = 'confirmed'
    )
    SELECT * FROM final_positions ORDER BY final_position
  LOOP
    -- Get player's verified rank (default to 'K' if null)
    v_player_rank := COALESCE(v_participant.verified_rank, 'K');
    
    -- Determine position category for rewards
    v_position_category := CASE 
      WHEN v_participant.final_position = 1 THEN 'CHAMPION'
      WHEN v_participant.final_position = 2 THEN 'RUNNER_UP'
      WHEN v_participant.final_position = 3 THEN 'THIRD_PLACE'
      WHEN v_participant.final_position = 4 THEN 'FOURTH_PLACE'
      WHEN v_participant.final_position <= 8 THEN 'TOP_8'
      WHEN v_participant.final_position <= 16 THEN 'TOP_16'
      ELSE 'PARTICIPATION'
    END;
    
    -- Calculate SPA points based on rank and position
    v_spa_points := CASE v_player_rank
      WHEN 'E+' THEN 
        CASE v_position_category
          WHEN 'CHAMPION' THEN 300
          WHEN 'RUNNER_UP' THEN 200
          WHEN 'THIRD_PLACE' THEN 150
          WHEN 'FOURTH_PLACE' THEN 100
          WHEN 'TOP_8' THEN 80
          WHEN 'TOP_16' THEN 60
          ELSE 40
        END
      WHEN 'E' THEN 
        CASE v_position_category
          WHEN 'CHAMPION' THEN 320
          WHEN 'RUNNER_UP' THEN 220
          WHEN 'THIRD_PLACE' THEN 160
          WHEN 'FOURTH_PLACE' THEN 110
          WHEN 'TOP_8' THEN 90
          WHEN 'TOP_16' THEN 70
          ELSE 50
        END
      WHEN 'F+' THEN 
        CASE v_position_category
          WHEN 'CHAMPION' THEN 340
          WHEN 'RUNNER_UP' THEN 240
          WHEN 'THIRD_PLACE' THEN 170
          WHEN 'FOURTH_PLACE' THEN 120
          WHEN 'TOP_8' THEN 100
          WHEN 'TOP_16' THEN 80
          ELSE 60
        END
      WHEN 'F' THEN 
        CASE v_position_category
          WHEN 'CHAMPION' THEN 360
          WHEN 'RUNNER_UP' THEN 260
          WHEN 'THIRD_PLACE' THEN 180
          WHEN 'FOURTH_PLACE' THEN 130
          WHEN 'TOP_8' THEN 110
          WHEN 'TOP_16' THEN 90
          ELSE 70
        END
      ELSE -- Default for other ranks (G+, G, H+, H, I+, I, K+, K)
        CASE v_position_category
          WHEN 'CHAMPION' THEN 400
          WHEN 'RUNNER_UP' THEN 300
          WHEN 'THIRD_PLACE' THEN 200
          WHEN 'FOURTH_PLACE' THEN 150
          WHEN 'TOP_8' THEN 120
          WHEN 'TOP_16' THEN 100
          ELSE 80
        END
    END;
    
    -- Calculate ELO points based on position (rank-independent)
    v_elo_points := CASE v_position_category
      WHEN 'CHAMPION' THEN 100
      WHEN 'RUNNER_UP' THEN 70
      WHEN 'THIRD_PLACE' THEN 50
      WHEN 'FOURTH_PLACE' THEN 30
      WHEN 'TOP_8' THEN 20
      WHEN 'TOP_16' THEN 10
      ELSE 5
    END;
    
    -- Update player rankings (accumulate points)
    INSERT INTO player_rankings (
      user_id, spa_points, elo_points, total_matches, tournament_wins, updated_at
    )
    VALUES (
      v_participant.player_id,
      v_spa_points,
      v_elo_points,
      1,
      CASE WHEN v_participant.final_position = 1 THEN 1 ELSE 0 END,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      spa_points = COALESCE(player_rankings.spa_points, 0) + v_spa_points,
      elo_points = COALESCE(player_rankings.elo_points, 1000) + v_elo_points,
      total_matches = COALESCE(player_rankings.total_matches, 0) + 1,
      tournament_wins = COALESCE(player_rankings.tournament_wins, 0) + 
        CASE WHEN v_participant.final_position = 1 THEN 1 ELSE 0 END,
      updated_at = NOW();
    
    -- Log SPA points transaction
    INSERT INTO spa_points_log (
      player_id, source_type, source_id, points_earned, description
    ) VALUES (
      v_participant.player_id,
      'tournament',
      tournament_uuid,
      v_spa_points,
      format('Vị trí %s trong giải đấu %s', v_participant.final_position, v_tournament.name)
    );
    
    -- Create achievement for top 3
    IF v_participant.final_position <= 3 THEN
      INSERT INTO player_achievements (player_id, achievement_type, achieved_at, metadata)
      VALUES (
        v_participant.player_id,
        CASE v_participant.final_position
          WHEN 1 THEN 'tournament_champion'
          WHEN 2 THEN 'tournament_runner_up'
          WHEN 3 THEN 'tournament_third_place'
        END,
        NOW(),
        jsonb_build_object(
          'tournament_id', tournament_uuid,
          'tournament_name', v_tournament.name,
          'position', v_participant.final_position,
          'spa_earned', v_spa_points,
          'elo_earned', v_elo_points
        )
      ) ON CONFLICT (player_id, achievement_type) DO NOTHING;
    END IF;
    
    -- Create notification
    INSERT INTO notifications (
      user_id, type, title, message, priority, metadata
    ) VALUES (
      v_participant.player_id,
      'tournament_completed',
      'Giải đấu hoàn thành',
      format('Bạn đạt vị trí %s trong %s. Nhận %s SPA và %s ELO!', 
             v_participant.final_position, v_tournament.name, v_spa_points, v_elo_points),
      'high',
      jsonb_build_object(
        'tournament_id', tournament_uuid,
        'position', v_participant.final_position,
        'spa_earned', v_spa_points,
        'elo_earned', v_elo_points
      )
    );
    
    -- Update counters
    v_participants_processed := v_participants_processed + 1;
    v_total_spa_awarded := v_total_spa_awarded + v_spa_points;
    v_total_elo_awarded := v_total_elo_awarded + v_elo_points;
  END LOOP;
  
  -- Update tournament status to completed
  UPDATE tournaments 
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE id = tournament_uuid;
  
  -- Return completion summary
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', tournament_uuid,
    'tournament_name', v_tournament.name,
    'participants_processed', v_participants_processed,
    'total_spa_awarded', v_total_spa_awarded,
    'total_elo_awarded', v_total_elo_awarded,
    'message', format('Tournament %s completed successfully. %s participants processed, %s total SPA and %s total ELO awarded.',
                     v_tournament.name, v_participants_processed, v_total_spa_awarded, v_total_elo_awarded)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to complete tournament: ' || SQLERRM,
      'tournament_id', tournament_uuid
    );
END;
$$;