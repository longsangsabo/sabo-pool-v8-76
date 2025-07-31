-- Thêm unique constraint cho tournament_results
ALTER TABLE public.tournament_results 
ADD CONSTRAINT tournament_results_unique UNIQUE (tournament_id, user_id);

-- Đơn giản hóa function để insert mà không cần conflict resolution
CREATE OR REPLACE FUNCTION public.process_tournament_results_manual(tournament_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_tournament RECORD;
  v_participant RECORD;
  v_spa_points INTEGER;
  v_elo_points INTEGER;
  v_prize_money NUMERIC;
  v_multiplier NUMERIC;
  v_final_match_winner UUID;
  v_final_match_loser UUID;
BEGIN
  -- Clear existing results first
  DELETE FROM public.tournament_results WHERE tournament_id = tournament_id_param;
  
  -- Get tournament with config
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = tournament_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tournament not found: %', tournament_id_param;
  END IF;
  
  -- Get tournament type multiplier for SPA points
  v_multiplier := CASE 
    WHEN v_tournament.tournament_type = 'season' THEN 1.5
    WHEN v_tournament.tournament_type = 'open' THEN 2.0
    ELSE 1.0
  END;
  
  -- Get final match results to determine 1st and 2nd place  
  SELECT winner_id, 
         CASE WHEN winner_id = player1_id THEN player2_id ELSE player1_id END as loser_id
  INTO v_final_match_winner, v_final_match_loser
  FROM public.tournament_matches tm
  WHERE tm.tournament_id = tournament_id_param 
    AND tm.round_number = (
      SELECT MAX(round_number) 
      FROM public.tournament_matches 
      WHERE tournament_id = tournament_id_param
    )
    AND tm.status = 'completed'
    AND tm.winner_id IS NOT NULL
  LIMIT 1;
  
  RAISE NOTICE 'Final match winner: %, loser: %', v_final_match_winner, v_final_match_loser;
  
  -- Process all tournament participants with position calculation
  FOR v_participant IN 
    WITH player_stats AS (
      SELECT 
        tr.user_id,
        p.full_name,
        COUNT(CASE WHEN tm.winner_id = tr.user_id THEN 1 END) as wins,
        COUNT(CASE WHEN tm.status = 'completed' AND tm.winner_id IS NOT NULL 
                   AND (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id) 
                   AND tm.winner_id != tr.user_id THEN 1 END) as losses,
        COUNT(CASE WHEN tm.status = 'completed' AND tm.winner_id IS NOT NULL 
                   AND (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id) THEN 1 END) as total_matches
      FROM public.tournament_registrations tr
      LEFT JOIN public.profiles p ON tr.user_id = p.user_id
      LEFT JOIN public.tournament_matches tm ON 
        (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id)
        AND tm.tournament_id = tournament_id_param
      WHERE tr.tournament_id = tournament_id_param 
        AND tr.registration_status = 'confirmed'
        AND tr.user_id IS NOT NULL
      GROUP BY tr.user_id, p.full_name
    )
    SELECT 
      user_id,
      full_name,
      wins,
      losses,
      total_matches,
      CASE 
        WHEN user_id = v_final_match_winner THEN 1
        WHEN user_id = v_final_match_loser THEN 2
        ELSE ROW_NUMBER() OVER (ORDER BY wins DESC, total_matches DESC, losses ASC) + 2
      END as position
    FROM player_stats
    ORDER BY 
      CASE 
        WHEN user_id = v_final_match_winner THEN 1
        WHEN user_id = v_final_match_loser THEN 2
        ELSE ROW_NUMBER() OVER (ORDER BY wins DESC, total_matches DESC, losses ASC) + 2
      END
  LOOP
    -- Get SPA points from tournament config
    v_spa_points := COALESCE(
      (v_tournament.spa_points_config->>v_participant.position::text)::INTEGER,
      (v_tournament.spa_points_config->>'default')::INTEGER,
      100
    );
    
    -- Apply multiplier to SPA points
    v_spa_points := ROUND(v_spa_points * v_multiplier);
    
    -- Get ELO points from tournament config (no multiplier)
    v_elo_points := COALESCE(
      (v_tournament.elo_points_config->>v_participant.position::text)::INTEGER,
      (v_tournament.elo_points_config->>'default')::INTEGER,
      1
    );
    
    -- Get prize money from tournament config
    v_prize_money := COALESCE(
      (v_tournament.prize_distribution->>v_participant.position::text)::NUMERIC,
      (v_tournament.prize_distribution->>'default')::NUMERIC,
      0
    );
    
    RAISE NOTICE 'Player % (%) position % gets % SPA points, % ELO points, %đ prize', 
      v_participant.full_name, v_participant.user_id, v_participant.position, v_spa_points, v_elo_points, v_prize_money;
    
    -- Award tournament results
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
      tournament_id_param,
      v_participant.user_id,
      v_participant.position,
      v_participant.total_matches,
      v_participant.wins,
      v_participant.losses,
      v_spa_points,
      v_elo_points,
      v_prize_money,
      NOW()
    );
  END LOOP;
  
  RAISE NOTICE 'Tournament % reprocessing completed using configuration', v_tournament.name;
END;
$function$;

-- Chạy function
SELECT public.process_tournament_results_manual('727a8ae8-0598-47bf-b305-2fc2bc60b57d');