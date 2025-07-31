-- Fix all remaining player_id references in database functions

-- Update process_tournament_results function to use user_id consistently
CREATE OR REPLACE FUNCTION public.process_tournament_results()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_participant RECORD;
  v_points INTEGER;
  v_multiplier NUMERIC;
  v_final_match_winner UUID;
  v_final_match_loser UUID;
  v_position_map JSONB := '{}';
BEGIN
  -- Only process when tournament status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Get tournament type multiplier
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
        COUNT(tm.id) as total_matches
      FROM public.tournament_registrations tr
      LEFT JOIN public.tournament_matches tm ON 
        (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id)
        AND tm.tournament_id = NEW.id
        AND tm.status = 'completed'
      WHERE tr.tournament_id = NEW.id 
        AND tr.registration_status = 'confirmed'
        AND tr.user_id IS NOT NULL
      GROUP BY tr.user_id
    ),
    player_positions AS (
      SELECT 
        user_id,
        CASE 
          WHEN user_id = v_final_match_winner THEN 1
          WHEN user_id = v_final_match_loser THEN 2
          ELSE ROW_NUMBER() OVER (ORDER BY wins DESC, total_matches DESC) + 2
        END as position
      FROM player_stats
    )
    SELECT jsonb_object_agg(user_id::text, position)
    INTO v_position_map
    FROM player_positions;
    
    -- Process all tournament participants
    FOR v_participant IN 
      SELECT 
        tr.user_id,
        p.full_name,
        -- Get position from position map
        COALESCE((v_position_map->>tr.user_id::text)::integer, 99) as position
      FROM public.tournament_registrations tr
      LEFT JOIN public.profiles p ON tr.user_id = p.user_id
      WHERE tr.tournament_id = NEW.id 
        AND tr.registration_status = 'confirmed'
        AND tr.user_id IS NOT NULL
    LOOP
      -- Calculate base points based on actual position
      v_points := CASE 
        WHEN v_participant.position = 1 THEN 1000  -- Champion
        WHEN v_participant.position = 2 THEN 700   -- Runner-up  
        WHEN v_participant.position = 3 THEN 500   -- Third place
        WHEN v_participant.position = 4 THEN 400   -- Fourth place
        WHEN v_participant.position <= 8 THEN 300  -- Quarter-finals
        WHEN v_participant.position <= 16 THEN 200 -- Round of 16
        ELSE 100  -- Participation
      END;
      
      -- Apply multiplier
      v_points := ROUND(v_points * v_multiplier);
      
      -- Award SPA points (skip if table doesn't exist)
      BEGIN
        INSERT INTO public.spa_points_log (
          user_id,
          source_type, 
          source_id, 
          points_earned,
          description
        ) VALUES (
          v_participant.user_id,
          'tournament',
          NEW.id,
          v_points,
          format('Vị trí %s trong %s', v_participant.position, NEW.name)
        );
      EXCEPTION 
        WHEN undefined_table THEN
          RAISE NOTICE 'spa_points_log table does not exist, skipping SPA points';
        WHEN OTHERS THEN
          RAISE NOTICE 'Error inserting SPA points for player %: %', v_participant.user_id, SQLERRM;
      END;
      
      -- Update player rankings (skip if table doesn't exist)
      BEGIN
        INSERT INTO public.player_rankings (user_id, spa_points, total_matches)
        VALUES (v_participant.user_id, v_points, 1)
        ON CONFLICT (user_id) DO UPDATE SET
          spa_points = COALESCE(player_rankings.spa_points, 0) + v_points,
          total_matches = COALESCE(player_rankings.total_matches, 0) + 1,
          updated_at = NOW();
      EXCEPTION 
        WHEN undefined_table THEN
          RAISE NOTICE 'player_rankings table does not exist, skipping ranking update';
        WHEN OTHERS THEN
          RAISE NOTICE 'Error updating player rankings for player %: %', v_participant.user_id, SQLERRM;
      END;
      
      -- Create match results for ELO calculation if match data exists
      BEGIN
        WITH player_matches AS (
          SELECT 
            tm.*,
            CASE WHEN tm.winner_id = v_participant.user_id THEN 'win'
                 WHEN tm.winner_id IS NOT NULL THEN 'loss'
                 ELSE 'draw' END as result,
            CASE WHEN tm.player1_id = v_participant.user_id THEN tm.player2_id
                 ELSE tm.player1_id END as opponent_id
          FROM public.tournament_matches tm
          WHERE tm.tournament_id = NEW.id
            AND (tm.player1_id = v_participant.user_id OR tm.player2_id = v_participant.user_id)
            AND tm.status = 'completed'
        )
        INSERT INTO public.match_results (
          tournament_id,
          match_id,
          player1_id,
          player2_id,
          winner_id,
          loser_id,
          player1_score,
          player2_score,
          match_date,
          result_status,
          player1_elo_before,
          player1_elo_after,
          player1_elo_change,
          player2_elo_before,
          player2_elo_after,
          player2_elo_change
        )
        SELECT 
          NEW.id,
          pm.id,
          pm.player1_id,
          pm.player2_id,
          pm.winner_id,
          CASE WHEN pm.winner_id = pm.player1_id THEN pm.player2_id ELSE pm.player1_id END,
          5, -- Default race to 5
          CASE WHEN pm.winner_id IS NOT NULL THEN 
            CASE WHEN pm.winner_id = pm.player1_id THEN 3 ELSE 5 END
          ELSE 5 END,
          COALESCE(pm.completed_at, NOW()),
          'verified',
          1000, -- Default ELO before
          1000 + CASE WHEN pm.winner_id = v_participant.user_id THEN 25 ELSE -25 END, -- Simple ELO change
          CASE WHEN pm.winner_id = v_participant.user_id THEN 25 ELSE -25 END,
          1000, -- Opponent ELO before  
          1000 + CASE WHEN pm.winner_id = v_participant.user_id THEN -25 ELSE 25 END,
          CASE WHEN pm.winner_id = v_participant.user_id THEN -25 ELSE 25 END
        FROM player_matches pm
        ON CONFLICT (tournament_id, match_id) DO NOTHING;
      EXCEPTION 
        WHEN undefined_table THEN
          RAISE NOTICE 'match_results table does not exist, skipping match results';
        WHEN OTHERS THEN
          RAISE NOTICE 'Error creating match results for player %: %', v_participant.user_id, SQLERRM;
      END;
    END LOOP;
    
    RAISE NOTICE 'Tournament % completed processing with % participants', NEW.name, 
      (SELECT COUNT(*) FROM public.tournament_registrations WHERE tournament_id = NEW.id);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update admin_create_challenge function to use user_id consistently  
CREATE OR REPLACE FUNCTION public.admin_create_challenge(p_challenger_id uuid, p_opponent_id uuid, p_bet_points integer, p_admin_id uuid, p_race_to integer DEFAULT 8, p_message text DEFAULT NULL::text, p_club_id uuid DEFAULT NULL::uuid, p_admin_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_challenge_id UUID;
  v_admin_check BOOLEAN;
  v_challenger_exists BOOLEAN;
  v_opponent_exists BOOLEAN;
  v_challenger_spa INTEGER;
  v_opponent_spa INTEGER;
  v_challenger_name TEXT;
  v_opponent_name TEXT;
BEGIN
  -- Validate required parameters are not null
  IF p_challenger_id IS NULL THEN
    RAISE EXCEPTION 'Challenger ID cannot be null';
  END IF;
  
  IF p_opponent_id IS NULL THEN
    RAISE EXCEPTION 'Opponent ID cannot be null';
  END IF;
  
  IF p_admin_id IS NULL THEN
    RAISE EXCEPTION 'Admin ID cannot be null';
  END IF;

  -- Check if the calling user is an admin
  SELECT is_admin INTO v_admin_check
  FROM public.profiles
  WHERE user_id = p_admin_id;
  
  IF NOT COALESCE(v_admin_check, false) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can create challenges for other users';
  END IF;
  
  -- Validate challenger exists and has enough SPA
  SELECT 
    CASE WHEN COUNT(*) > 0 THEN true ELSE false END,
    COALESCE(MAX(pr.spa_points), 0),
    MAX(p.full_name)
  INTO v_challenger_exists, v_challenger_spa, v_challenger_name
  FROM public.profiles p
  LEFT JOIN public.player_rankings pr ON p.user_id = pr.user_id
  WHERE p.user_id = p_challenger_id;
  
  IF NOT v_challenger_exists THEN
    RAISE EXCEPTION 'Challenger user not found';
  END IF;
  
  IF v_challenger_spa < p_bet_points THEN
    RAISE EXCEPTION 'Challenger does not have enough SPA points (has %, needs %)', v_challenger_spa, p_bet_points;
  END IF;
  
  -- Validate opponent exists and has enough SPA  
  SELECT 
    CASE WHEN COUNT(*) > 0 THEN true ELSE false END,
    COALESCE(MAX(pr.spa_points), 0),
    MAX(p.full_name)
  INTO v_opponent_exists, v_opponent_spa, v_opponent_name
  FROM public.profiles p
  LEFT JOIN public.player_rankings pr ON p.user_id = pr.user_id
  WHERE p.user_id = p_opponent_id;
  
  IF NOT v_opponent_exists THEN
    RAISE EXCEPTION 'Opponent user not found';
  END IF;
  
  IF v_opponent_spa < p_bet_points THEN
    RAISE EXCEPTION 'Opponent does not have enough SPA points (has %, needs %)', v_opponent_spa, p_bet_points;
  END IF;
  
  -- Validate users are different
  IF p_challenger_id = p_opponent_id THEN
    RAISE EXCEPTION 'Challenger and opponent cannot be the same user';
  END IF;
  
  -- Create the challenge
  INSERT INTO public.challenges (
    challenger_id,
    opponent_id,
    bet_points,
    race_to,
    message,
    club_id,
    status,
    expires_at,
    admin_created_by,
    admin_notes
  ) VALUES (
    p_challenger_id,
    p_opponent_id,
    p_bet_points,
    p_race_to,
    p_message,
    p_club_id,
    'pending',
    NOW() + INTERVAL '48 hours',
    p_admin_id,
    p_admin_notes
  ) RETURNING id INTO v_challenge_id;
  
  -- Create notifications for both users (with null checks)
  IF p_opponent_id IS NOT NULL AND v_opponent_exists THEN
    INSERT INTO public.notifications (user_id, type, title, message, priority, metadata)
    VALUES (
      p_opponent_id,
      'challenge_received', 
      'Thách đấu mới từ Admin',
      format('Admin đã tạo thách đấu %s điểm SPA từ %s', 
             p_bet_points,
             COALESCE(v_challenger_name, 'Người chơi')
      ),
      'high',
      jsonb_build_object(
        'challenge_id', v_challenge_id,
        'challenger_id', p_challenger_id,
        'bet_points', p_bet_points,
        'admin_created', true,
        'admin_id', p_admin_id
      )
    );
  END IF;
  
  IF p_challenger_id IS NOT NULL AND v_challenger_exists THEN
    INSERT INTO public.notifications (user_id, type, title, message, priority, metadata)
    VALUES (
      p_challenger_id,
      'challenge_created',
      'Thách đấu được tạo bởi Admin', 
      format('Admin đã tạo thách đấu %s điểm SPA với %s cho bạn',
             p_bet_points,
             COALESCE(v_opponent_name, 'Người chơi')
      ),
      'normal',
      jsonb_build_object(
        'challenge_id', v_challenge_id,
        'opponent_id', p_opponent_id,
        'bet_points', p_bet_points,
        'admin_created', true,
        'admin_id', p_admin_id
      )
    );
  END IF;
  
  -- Log admin action
  INSERT INTO public.admin_actions (
    admin_id,
    target_user_id,
    action_type,
    action_details,
    reason
  ) VALUES (
    p_admin_id,
    p_challenger_id,
    'create_challenge',
    jsonb_build_object(
      'challenge_id', v_challenge_id,
      'challenger_id', p_challenger_id,
      'opponent_id', p_opponent_id,
      'bet_points', p_bet_points,
      'race_to', p_race_to,
      'club_id', p_club_id
    ),
    format('Admin created challenge between %s and %s for %s points',
           COALESCE(v_challenger_name, 'Người chơi'),
           COALESCE(v_opponent_name, 'Người chơi'),
           p_bet_points
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'challenge_id', v_challenge_id,
    'challenger_id', p_challenger_id,
    'opponent_id', p_opponent_id,
    'bet_points', p_bet_points,
    'admin_id', p_admin_id,
    'message', 'Challenge created successfully by admin'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;

-- Update create_user_complete_records function to use user_id consistently
CREATE OR REPLACE FUNCTION public.create_user_complete_records()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Create wallet record
  INSERT INTO public.wallets (user_id, balance, points_balance, status)
  VALUES (NEW.user_id, 0, 50, 'active')
  ON CONFLICT (user_id) DO NOTHING;

  -- Create player_rankings record - Using user_id consistently
  INSERT INTO public.player_rankings (
    user_id, elo_points, spa_points, total_matches, wins, 
    daily_challenges, tournament_wins, rank_points, 
    average_opponent_strength, performance_quality, club_verified, is_visible
  )
  VALUES (NEW.user_id, 1000, 50, 0, 0, 0, 0, 0, 0, 0, false, true)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;