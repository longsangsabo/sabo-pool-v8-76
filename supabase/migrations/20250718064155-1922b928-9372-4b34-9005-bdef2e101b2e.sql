-- Sửa logic tính điểm ELO và SPA trong process_tournament_results function
CREATE OR REPLACE FUNCTION public.process_tournament_results()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_participant RECORD;
  v_spa_points INTEGER;
  v_elo_points INTEGER;
  v_multiplier NUMERIC;
  v_final_match_winner UUID;
  v_final_match_loser UUID;
  v_position_map JSONB := '{}';
  v_max_position INTEGER := 0;
BEGIN
  -- Only process when tournament status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Get tournament type multiplier for SPA points
    v_multiplier := CASE 
      WHEN NEW.tournament_type = 'season' THEN 1.5
      WHEN NEW.tournament_type = 'open' THEN 2.0
      ELSE 1.0
    END;
    
    -- Get final match results to determine 1st and 2nd place
    SELECT winner_id, 
           CASE WHEN winner_id = player1_id THEN player2_id ELSE player1_id END as loser_id
    INTO v_final_match_winner, v_final_match_loser
    FROM public.tournament_matches tm
    WHERE tm.tournament_id = NEW.id 
      AND tm.round_number = (
        SELECT MAX(round_number) 
        FROM public.tournament_matches 
        WHERE tournament_id = NEW.id
      )
      AND tm.status = 'completed'
      AND tm.winner_id IS NOT NULL
    LIMIT 1;
    
    -- Build position map based on tournament bracket results
    WITH player_stats AS (
      SELECT 
        tr.user_id,
        COUNT(CASE WHEN tm.winner_id = tr.user_id THEN 1 END) as wins,
        COUNT(CASE WHEN tm.status = 'completed' AND tm.winner_id IS NOT NULL 
                   AND (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id) 
                   AND tm.winner_id != tr.user_id THEN 1 END) as losses,
        COUNT(CASE WHEN tm.status = 'completed' AND tm.winner_id IS NOT NULL 
                   AND (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id) THEN 1 END) as total_matches
      FROM public.tournament_registrations tr
      LEFT JOIN public.tournament_matches tm ON 
        (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id)
        AND tm.tournament_id = NEW.id
      WHERE tr.tournament_id = NEW.id 
        AND tr.registration_status = 'confirmed'
        AND tr.user_id IS NOT NULL
      GROUP BY tr.user_id
    )
    SELECT jsonb_object_agg(
      user_id::text,
      CASE 
        WHEN user_id = v_final_match_winner THEN 1
        WHEN user_id = v_final_match_loser THEN 2
        ELSE ROW_NUMBER() OVER (ORDER BY wins DESC, total_matches DESC, losses ASC) + 2
      END
    ) INTO v_position_map
    FROM player_stats;
    
    -- Get max position for participants without matches
    SELECT MAX(position_value::integer) INTO v_max_position
    FROM jsonb_each_text(v_position_map) AS t(user_id, position_value);
    
    -- Process ALL tournament participants
    FOR v_participant IN 
      SELECT 
        tr.user_id,
        p.full_name,
        COALESCE((v_position_map->>tr.user_id::text)::integer, v_max_position + 1) as position,
        COALESCE(ps.wins, 0) as wins,
        COALESCE(ps.losses, 0) as losses,
        COALESCE(ps.total_matches, 0) as total_matches
      FROM public.tournament_registrations tr
      LEFT JOIN public.profiles p ON tr.user_id = p.user_id
      LEFT JOIN (
        SELECT 
          tr2.user_id,
          COUNT(CASE WHEN tm.winner_id = tr2.user_id THEN 1 END) as wins,
          COUNT(CASE WHEN tm.status = 'completed' AND tm.winner_id IS NOT NULL 
                     AND (tm.player1_id = tr2.user_id OR tm.player2_id = tr2.user_id) 
                     AND tm.winner_id != tr2.user_id THEN 1 END) as losses,
          COUNT(CASE WHEN tm.status = 'completed' AND tm.winner_id IS NOT NULL 
                     AND (tm.player1_id = tr2.user_id OR tm.player2_id = tr2.user_id) THEN 1 END) as total_matches
        FROM public.tournament_registrations tr2
        LEFT JOIN public.tournament_matches tm ON 
          (tm.player1_id = tr2.user_id OR tm.player2_id = tr2.user_id)
          AND tm.tournament_id = NEW.id
        WHERE tr2.tournament_id = NEW.id 
          AND tr2.registration_status = 'confirmed'
        GROUP BY tr2.user_id
      ) ps ON ps.user_id = tr.user_id
      WHERE tr.tournament_id = NEW.id 
        AND tr.registration_status = 'confirmed'
        AND tr.user_id IS NOT NULL
    LOOP
      -- Calculate SPA points based on position (with multiplier)
      v_spa_points := CASE 
        WHEN v_participant.position = 1 THEN 1000  -- Champion
        WHEN v_participant.position = 2 THEN 700   -- Runner-up  
        WHEN v_participant.position = 3 THEN 500   -- Third place
        WHEN v_participant.position = 4 THEN 400   -- Fourth place
        WHEN v_participant.position <= 8 THEN 300  -- Quarter-finals
        WHEN v_participant.position <= 16 THEN 200 -- Round of 16
        ELSE 100  -- Participation
      END;
      
      -- Apply multiplier to SPA points
      v_spa_points := ROUND(v_spa_points * v_multiplier);
      
      -- Calculate FIXED ELO points based on position (no multiplier)
      v_elo_points := CASE 
        WHEN v_participant.position = 1 THEN 100   -- Champion: +100 ELO
        WHEN v_participant.position = 2 THEN 50    -- Runner-up: +50 ELO
        WHEN v_participant.position = 3 THEN 25    -- Third place: +25 ELO
        WHEN v_participant.position = 4 THEN 12    -- Fourth place: +12 ELO
        WHEN v_participant.position <= 8 THEN 6    -- Top 8: +6 ELO
        WHEN v_participant.position <= 16 THEN 3   -- Top 16: +3 ELO
        ELSE 1  -- Participation: +1 ELO
      END;
      
      -- Award tournament results
      BEGIN
        INSERT INTO public.tournament_results (
          tournament_id,
          user_id,
          final_position,
          matches_played,
          matches_won,
          matches_lost,
          spa_points_earned,
          elo_points_earned,
          prize_money,
          created_at
        ) VALUES (
          NEW.id,
          v_participant.user_id,
          v_participant.position,
          v_participant.total_matches,
          v_participant.wins,
          v_participant.losses,
          v_spa_points,
          v_elo_points,
          CASE 
            WHEN v_participant.position = 1 THEN 5000000
            WHEN v_participant.position = 2 THEN 3000000
            WHEN v_participant.position = 3 THEN 2000000
            WHEN v_participant.position = 4 THEN 1000000
            WHEN v_participant.position <= 8 THEN 500000
            ELSE 0
          END,
          NOW()
        )
        ON CONFLICT (tournament_id, user_id) DO UPDATE SET
          final_position = EXCLUDED.final_position,
          matches_played = EXCLUDED.matches_played,
          matches_won = EXCLUDED.matches_won,
          matches_lost = EXCLUDED.matches_lost,
          spa_points_earned = EXCLUDED.spa_points_earned,
          elo_points_earned = EXCLUDED.elo_points_earned,
          prize_money = EXCLUDED.prize_money,
          updated_at = NOW();
      EXCEPTION 
        WHEN OTHERS THEN
          RAISE NOTICE 'Error inserting tournament results for player %: %', v_participant.user_id, SQLERRM;
      END;
      
      -- Update player rankings - CỘNG CỐ ĐỊNH ELO POINTS VÀO ELO HIỆN TẠI
      BEGIN
        INSERT INTO public.player_rankings (user_id, spa_points, elo_points, total_matches, wins, losses)
        VALUES (v_participant.user_id, v_spa_points, v_elo_points, v_participant.total_matches, v_participant.wins, v_participant.losses)
        ON CONFLICT (user_id) DO UPDATE SET
          spa_points = COALESCE(player_rankings.spa_points, 0) + v_spa_points,
          elo_points = COALESCE(player_rankings.elo_points, 1000) + v_elo_points,  -- CỘNG CỐ ĐỊNH ELO
          total_matches = COALESCE(player_rankings.total_matches, 0) + v_participant.total_matches,
          wins = COALESCE(player_rankings.wins, 0) + v_participant.wins,
          losses = COALESCE(player_rankings.losses, 0) + v_participant.losses,
          updated_at = NOW();
      EXCEPTION 
        WHEN OTHERS THEN
          RAISE NOTICE 'Error updating player rankings for player %: %', v_participant.user_id, SQLERRM;
      END;
    END LOOP;
    
    RAISE NOTICE 'Tournament % completed processing with % participants', NEW.name, 
      (SELECT COUNT(*) FROM tournament_registrations WHERE tournament_id = NEW.id AND registration_status = 'confirmed');
  END IF;
  
  RETURN NEW;
END;
$function$;