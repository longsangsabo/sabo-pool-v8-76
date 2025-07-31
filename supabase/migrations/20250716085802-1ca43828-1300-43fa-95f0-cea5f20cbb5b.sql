-- Drop existing function and recreate with proper signature
DROP FUNCTION IF EXISTS public.calculate_tournament_standings(uuid);

-- Create comprehensive tournament standings calculation function
CREATE OR REPLACE FUNCTION public.calculate_tournament_standings(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_tournament RECORD;
  v_participants RECORD;
  v_standings jsonb[] := '{}';
  v_final_match_winner uuid;
  v_final_match_loser uuid;
  v_semifinal_losers uuid[];
  v_tournament_rank text;
  v_highest_participant_rank text;
  v_spa_multiplier numeric := 1.0;
  v_prize_pool jsonb;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament
  FROM public.tournaments
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Determine highest participant rank to set tournament rank
  SELECT 
    CASE 
      WHEN verified_rank IS NOT NULL THEN verified_rank
      ELSE 'E'  -- Default rank
    END INTO v_highest_participant_rank
  FROM public.tournament_registrations tr
  LEFT JOIN public.profiles p ON tr.player_id = p.user_id
  WHERE tr.tournament_id = p_tournament_id 
    AND tr.registration_status = 'confirmed'
  ORDER BY public.get_rank_order(COALESCE(p.verified_rank, 'E')) ASC
  LIMIT 1;
  
  -- Set tournament rank and SPA multiplier
  v_tournament_rank := COALESCE(v_highest_participant_rank, 'E');
  v_spa_multiplier := CASE 
    WHEN v_tournament_rank IN ('K', 'K+') THEN 2.5
    WHEN v_tournament_rank IN ('I', 'I+') THEN 2.0
    WHEN v_tournament_rank IN ('H', 'H+') THEN 1.8
    WHEN v_tournament_rank IN ('G', 'G+') THEN 1.5
    WHEN v_tournament_rank IN ('F', 'F+') THEN 1.2
    ELSE 1.0
  END;
  
  -- Set prize pool based on tournament rank
  v_prize_pool := CASE 
    WHEN v_tournament_rank IN ('K', 'K+') THEN '{"1": 5000000, "2": 3000000, "3": 2000000}'::jsonb
    WHEN v_tournament_rank IN ('I', 'I+') THEN '{"1": 4000000, "2": 2500000, "3": 1500000}'::jsonb
    WHEN v_tournament_rank IN ('H', 'H+') THEN '{"1": 3000000, "2": 2000000, "3": 1200000}'::jsonb
    WHEN v_tournament_rank IN ('G', 'G+') THEN '{"1": 2000000, "2": 1200000, "3": 800000}'::jsonb
    WHEN v_tournament_rank IN ('F', 'F+') THEN '{"1": 1500000, "2": 1000000, "3": 600000}'::jsonb
    ELSE '{"1": 0, "2": 0, "3": 0}'::jsonb  -- E rank: no prize money
  END;
  
  -- Get final match results (1st and 2nd place)
  WITH final_matches AS (
    SELECT tm.*, 
           CASE WHEN tm.winner_id = tm.player1_id THEN tm.player2_id ELSE tm.player1_id END as loser_id
    FROM public.tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id 
      AND tm.round_number = (
        SELECT MAX(round_number) 
        FROM public.tournament_matches 
        WHERE tournament_id = p_tournament_id
          AND (is_third_place_match = false OR is_third_place_match IS NULL)
      )
      AND tm.status = 'completed'
      AND tm.winner_id IS NOT NULL
      AND (tm.is_third_place_match = false OR tm.is_third_place_match IS NULL)
    ORDER BY tm.match_number
    LIMIT 1
  )
  SELECT winner_id, loser_id INTO v_final_match_winner, v_final_match_loser
  FROM final_matches;
  
  -- Get semifinal losers for 3rd/4th place
  WITH semifinal_round AS (
    SELECT MAX(round_number) - 1 as semifinal_round_num
    FROM public.tournament_matches 
    WHERE tournament_id = p_tournament_id
      AND (is_third_place_match = false OR is_third_place_match IS NULL)
  )
  SELECT ARRAY_AGG(
    CASE 
      WHEN tm.winner_id = tm.player1_id THEN tm.player2_id
      WHEN tm.winner_id = tm.player2_id THEN tm.player1_id
      ELSE NULL
    END
  ) INTO v_semifinal_losers
  FROM public.tournament_matches tm, semifinal_round sr
  WHERE tm.tournament_id = p_tournament_id
    AND tm.round_number = sr.semifinal_round_num
    AND tm.status = 'completed'
    AND tm.winner_id IS NOT NULL;
  
  -- Calculate standings for all participants
  FOR v_participants IN 
    SELECT 
      tr.player_id,
      p.full_name,
      p.verified_rank,
      -- Calculate match statistics
      COUNT(CASE WHEN tm.status = 'completed' THEN 1 END) as total_matches,
      COUNT(CASE WHEN tm.winner_id = tr.player_id THEN 1 END) as wins,
      COUNT(CASE WHEN tm.status = 'completed' AND tm.winner_id != tr.player_id AND tm.winner_id IS NOT NULL THEN 1 END) as losses
    FROM public.tournament_registrations tr
    LEFT JOIN public.profiles p ON tr.player_id = p.user_id
    LEFT JOIN public.tournament_matches tm ON 
      (tm.player1_id = tr.player_id OR tm.player2_id = tr.player_id)
      AND tm.tournament_id = p_tournament_id
    WHERE tr.tournament_id = p_tournament_id 
      AND tr.registration_status = 'confirmed'
      AND tr.player_id IS NOT NULL
    GROUP BY tr.player_id, p.full_name, p.verified_rank
  LOOP
    DECLARE
      v_position integer;
      v_spa_points integer;
      v_prize_money integer := 0;
    BEGIN
      -- Determine final position
      IF v_participants.player_id = v_final_match_winner THEN
        v_position := 1;  -- Champion
      ELSIF v_participants.player_id = v_final_match_loser THEN
        v_position := 2;  -- Runner-up
      ELSIF v_semifinal_losers IS NOT NULL AND v_participants.player_id = ANY(v_semifinal_losers) THEN
        -- Check third place match if exists
        WITH third_place_winner AS (
          SELECT winner_id
          FROM public.tournament_matches 
          WHERE tournament_id = p_tournament_id
            AND is_third_place_match = true
            AND status = 'completed'
            AND winner_id IS NOT NULL
        )
        SELECT CASE 
          WHEN tpw.winner_id = v_participants.player_id THEN 3
          ELSE 4
        END INTO v_position
        FROM third_place_winner tpw
        WHERE tpw.winner_id IN (SELECT unnest(v_semifinal_losers));
        
        -- If no third place match or not found, assign based on order
        IF v_position IS NULL THEN
          v_position := 3 + array_position(v_semifinal_losers, v_participants.player_id) - 1;
        END IF;
      ELSE
        -- Rank remaining players by wins, then total matches
        WITH remaining_rankings AS (
          SELECT 
            player_id,
            ROW_NUMBER() OVER (ORDER BY wins DESC, total_matches DESC) + 4 as position_rank
          FROM (
            SELECT 
              tr.player_id,
              COUNT(CASE WHEN tm.winner_id = tr.player_id THEN 1 END) as wins,
              COUNT(CASE WHEN tm.status = 'completed' THEN 1 END) as total_matches
            FROM public.tournament_registrations tr
            LEFT JOIN public.tournament_matches tm ON 
              (tm.player1_id = tr.player_id OR tm.player2_id = tr.player_id)
              AND tm.tournament_id = p_tournament_id
            WHERE tr.tournament_id = p_tournament_id 
              AND tr.registration_status = 'confirmed'
              AND tr.player_id NOT IN (
                SELECT unnest(ARRAY[v_final_match_winner, v_final_match_loser] || COALESCE(v_semifinal_losers, '{}'))
                WHERE v_final_match_winner IS NOT NULL
              )
            GROUP BY tr.player_id
          ) ranked_players
        )
        SELECT position_rank INTO v_position
        FROM remaining_rankings
        WHERE player_id = v_participants.player_id;
      END IF;
      
      -- Calculate SPA points based on position and tournament rank
      v_spa_points := CASE 
        WHEN v_position = 1 THEN ROUND(1000 * v_spa_multiplier)  -- Champion
        WHEN v_position = 2 THEN ROUND(700 * v_spa_multiplier)   -- Runner-up
        WHEN v_position = 3 THEN ROUND(500 * v_spa_multiplier)   -- Third place
        WHEN v_position = 4 THEN ROUND(400 * v_spa_multiplier)   -- Fourth place
        WHEN v_position <= 8 THEN ROUND(300 * v_spa_multiplier)  -- Quarter-finals
        WHEN v_position <= 16 THEN ROUND(200 * v_spa_multiplier) -- Round of 16
        ELSE ROUND(100 * v_spa_multiplier)  -- Participation
      END;
      
      -- Get prize money
      v_prize_money := COALESCE((v_prize_pool->>v_position::text)::integer, 0);
      
      -- Add to standings
      v_standings := v_standings || jsonb_build_object(
        'player_id', v_participants.player_id,
        'player_name', v_participants.full_name,
        'player_rank', COALESCE(v_participants.verified_rank, 'E'),
        'final_position', v_position,
        'spa_points_earned', v_spa_points,
        'prize_money', v_prize_money,
        'total_matches', v_participants.total_matches,
        'wins', v_participants.wins,
        'losses', v_participants.losses
      );
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'tournament_rank', v_tournament_rank,
    'spa_multiplier', v_spa_multiplier,
    'prize_pool', v_prize_pool,
    'standings', v_standings,
    'calculated_at', now()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournament_id', p_tournament_id
    );
END;
$function$;