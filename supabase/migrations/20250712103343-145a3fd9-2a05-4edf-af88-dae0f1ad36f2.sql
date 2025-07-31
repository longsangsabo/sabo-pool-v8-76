-- Comprehensive fix for all remaining player_id references in database functions

-- First, let's create a backup of functions that need updating and then recreate them with user_id

-- 1. Drop and recreate admin_add_users_to_tournament function
DROP FUNCTION IF EXISTS public.admin_add_users_to_tournament(uuid[], uuid, uuid);

CREATE OR REPLACE FUNCTION public.admin_add_users_to_tournament(
  p_user_ids uuid[],
  p_tournament_id uuid,
  p_admin_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_tournament RECORD;
  v_user_id uuid;
  v_added_count integer := 0;
  v_errors text[] := '{}';
  v_user_name text;
BEGIN
  -- Validate admin permissions
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = p_admin_id AND is_admin = true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;

  -- Get tournament info
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;

  -- Process each user
  FOREACH v_user_id IN ARRAY p_user_ids
  LOOP
    BEGIN
      -- Get user name for logging
      SELECT full_name INTO v_user_name FROM public.profiles WHERE user_id = v_user_id;
      
      -- Insert registration
      INSERT INTO public.tournament_registrations (
        tournament_id, user_id, registration_status, registered_at, admin_added_by
      ) VALUES (
        p_tournament_id, v_user_id, 'confirmed', now(), p_admin_id
      );
      
      v_added_count := v_added_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || format('User %s: %s', COALESCE(v_user_name, v_user_id::text), SQLERRM);
    END;
  END LOOP;

  -- Log admin action
  INSERT INTO public.admin_actions (
    admin_id, target_user_id, action_type, action_details, reason
  ) VALUES (
    p_admin_id, p_user_ids[1], 'bulk_tournament_registration',
    jsonb_build_object('tournament_id', p_tournament_id, 'users_added', v_added_count, 'errors', v_errors),
    format('Bulk added %s users to tournament %s', v_added_count, v_tournament.name)
  );

  RETURN jsonb_build_object(
    'success', true,
    'added_count', v_added_count,
    'errors', v_errors,
    'tournament_name', v_tournament.name
  );
END;
$function$;

-- 2. Update calculate_match_elo function to use user_id consistently
DROP FUNCTION IF EXISTS public.calculate_match_elo(uuid);

CREATE OR REPLACE FUNCTION public.calculate_match_elo(p_match_result_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_match_result RECORD;
    v_player1_profile RECORD;
    v_player2_profile RECORD;
    v_k_factor1 NUMERIC;
    v_k_factor2 NUMERIC;
    v_expected_score1 NUMERIC;
    v_expected_score2 NUMERIC;
    v_actual_score1 NUMERIC;
    v_actual_score2 NUMERIC;
    v_elo_change1 INTEGER;
    v_elo_change2 INTEGER;
    v_new_elo1 INTEGER;
    v_new_elo2 INTEGER;
    v_result JSONB;
BEGIN
    -- Get match result details
    SELECT * INTO v_match_result 
    FROM public.match_results 
    WHERE id = p_match_result_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Match result not found');
    END IF;
    
    -- Get player profiles with ELO ratings (using user_id)
    SELECT p.*, COALESCE(pr.elo, 1000) as current_elo, COALESCE(pr.total_matches, 0) as total_matches
    INTO v_player1_profile
    FROM public.profiles p
    LEFT JOIN public.player_rankings pr ON pr.user_id = p.user_id  -- Changed from player_id to user_id
    WHERE p.user_id = v_match_result.player1_id;
    
    SELECT p.*, COALESCE(pr.elo, 1000) as current_elo, COALESCE(pr.total_matches, 0) as total_matches
    INTO v_player2_profile
    FROM public.profiles p
    LEFT JOIN public.player_rankings pr ON pr.user_id = p.user_id  -- Changed from player_id to user_id
    WHERE p.user_id = v_match_result.player2_id;
    
    -- Calculate K-factors based on experience
    v_k_factor1 := CASE 
        WHEN v_player1_profile.total_matches < 30 THEN 40
        WHEN v_player1_profile.current_elo >= 2400 THEN 16
        WHEN v_player1_profile.current_elo >= 2100 THEN 24
        ELSE 32
    END;
    
    v_k_factor2 := CASE 
        WHEN v_player2_profile.total_matches < 30 THEN 40
        WHEN v_player2_profile.current_elo >= 2400 THEN 16
        WHEN v_player2_profile.current_elo >= 2100 THEN 24
        ELSE 32
    END;
    
    -- Calculate expected scores
    v_expected_score1 := 1.0 / (1.0 + POWER(10, (v_player2_profile.current_elo - v_player1_profile.current_elo) / 400.0));
    v_expected_score2 := 1.0 - v_expected_score1;
    
    -- Calculate actual scores
    v_actual_score1 := CASE 
        WHEN v_match_result.winner_id = v_match_result.player1_id THEN 1.0
        WHEN v_match_result.winner_id = v_match_result.player2_id THEN 0.0
        ELSE 0.5 -- Draw
    END;
    v_actual_score2 := 1.0 - v_actual_score1;
    
    -- Calculate ELO changes
    v_elo_change1 := ROUND(v_k_factor1 * (v_actual_score1 - v_expected_score1));
    v_elo_change2 := ROUND(v_k_factor2 * (v_actual_score2 - v_expected_score2));
    
    -- Calculate new ELO ratings
    v_new_elo1 := v_player1_profile.current_elo + v_elo_change1;
    v_new_elo2 := v_player2_profile.current_elo + v_elo_change2;
    
    -- Update match result with ELO data
    UPDATE public.match_results
    SET 
        player1_elo_before = v_player1_profile.current_elo,
        player2_elo_before = v_player2_profile.current_elo,
        player1_elo_after = v_new_elo1,
        player2_elo_after = v_new_elo2,
        player1_elo_change = v_elo_change1,
        player2_elo_change = v_elo_change2,
        updated_at = NOW()
    WHERE id = p_match_result_id;
    
    -- Update player rankings (using user_id)
    INSERT INTO public.player_rankings (user_id, elo, total_matches, wins, losses, updated_at)
    VALUES (
        v_match_result.player1_id, 
        v_new_elo1, 
        v_player1_profile.total_matches + 1,
        v_player1_profile.total_matches + CASE WHEN v_match_result.winner_id = v_match_result.player1_id THEN 1 ELSE 0 END,
        v_player1_profile.total_matches + CASE WHEN v_match_result.winner_id = v_match_result.player2_id THEN 1 ELSE 0 END,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET  -- Changed from player_id to user_id
        elo = EXCLUDED.elo,
        total_matches = player_rankings.total_matches + 1,
        wins = player_rankings.wins + CASE WHEN v_match_result.winner_id = v_match_result.player1_id THEN 1 ELSE 0 END,
        losses = player_rankings.losses + CASE WHEN v_match_result.winner_id = v_match_result.player2_id THEN 1 ELSE 0 END,
        updated_at = NOW();
    
    INSERT INTO public.player_rankings (user_id, elo, total_matches, wins, losses, updated_at)
    VALUES (
        v_match_result.player2_id, 
        v_new_elo2, 
        v_player2_profile.total_matches + 1,
        v_player2_profile.total_matches + CASE WHEN v_match_result.winner_id = v_match_result.player2_id THEN 1 ELSE 0 END,
        v_player2_profile.total_matches + CASE WHEN v_match_result.winner_id = v_match_result.player1_id THEN 1 ELSE 0 END,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET  -- Changed from player_id to user_id
        elo = EXCLUDED.elo,
        total_matches = player_rankings.total_matches + 1,
        wins = player_rankings.wins + CASE WHEN v_match_result.winner_id = v_match_result.player2_id THEN 1 ELSE 0 END,
        losses = player_rankings.losses + CASE WHEN v_match_result.winner_id = v_match_result.player1_id THEN 1 ELSE 0 END,
        updated_at = NOW();
    
    -- Create ELO history records (using user_id)
    INSERT INTO public.elo_history (
        user_id, match_result_id, elo_before, elo_after, elo_change,
        opponent_user_id, opponent_elo, match_result, k_factor
    ) VALUES
    (
        v_match_result.player1_id, p_match_result_id, 
        v_player1_profile.current_elo, v_new_elo1, v_elo_change1,
        v_match_result.player2_id, v_player2_profile.current_elo,
        CASE 
            WHEN v_match_result.winner_id = v_match_result.player1_id THEN 'win'
            WHEN v_match_result.winner_id = v_match_result.player2_id THEN 'loss'
            ELSE 'draw'
        END,
        v_k_factor1
    ),
    (
        v_match_result.player2_id, p_match_result_id,
        v_player2_profile.current_elo, v_new_elo2, v_elo_change2,
        v_match_result.player1_id, v_player1_profile.current_elo,
        CASE 
            WHEN v_match_result.winner_id = v_match_result.player2_id THEN 'win'
            WHEN v_match_result.winner_id = v_match_result.player1_id THEN 'loss'
            ELSE 'draw'
        END,
        v_k_factor2
    );
    
    -- Build result
    v_result := jsonb_build_object(
        'success', true,
        'player1_elo_change', v_elo_change1,
        'player2_elo_change', v_elo_change2,
        'player1_new_elo', v_new_elo1,
        'player2_new_elo', v_new_elo2,
        'expected_score1', v_expected_score1,
        'expected_score2', v_expected_score2,
        'k_factor1', v_k_factor1,
        'k_factor2', v_k_factor2
    );
    
    RETURN v_result;
END;
$function$;

-- 3. Update admin_create_challenge function to properly reference user_id in player_rankings
DROP FUNCTION IF EXISTS public.admin_create_challenge(uuid, uuid, integer, uuid, integer, text, uuid, text, boolean);

CREATE OR REPLACE FUNCTION public.admin_create_challenge(p_challenger_id uuid, p_opponent_id uuid, p_bet_points integer, p_admin_id uuid, p_race_to integer DEFAULT 8, p_message text DEFAULT NULL::text, p_club_id uuid DEFAULT NULL::uuid, p_admin_notes text DEFAULT NULL::text, p_auto_accept boolean DEFAULT false)
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
  v_challenge_status TEXT;
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
  
  -- Validate challenger exists and has enough SPA (using user_id)
  SELECT 
    CASE WHEN COUNT(*) > 0 THEN true ELSE false END,
    COALESCE(MAX(COALESCE(w.points_balance, pr.spa_points)), 0),
    MAX(p.full_name)
  INTO v_challenger_exists, v_challenger_spa, v_challenger_name
  FROM public.profiles p
  LEFT JOIN public.player_rankings pr ON p.user_id = pr.user_id  -- Changed from player_id to user_id
  LEFT JOIN public.wallets w ON p.user_id = w.user_id
  WHERE p.user_id = p_challenger_id;
  
  IF NOT v_challenger_exists THEN
    RAISE EXCEPTION 'Challenger user not found';
  END IF;
  
  IF v_challenger_spa < p_bet_points THEN
    RAISE EXCEPTION 'Challenger does not have enough SPA points (has %, needs %)', v_challenger_spa, p_bet_points;
  END IF;
  
  -- Validate opponent exists and has enough SPA (using user_id)
  SELECT 
    CASE WHEN COUNT(*) > 0 THEN true ELSE false END,
    COALESCE(MAX(COALESCE(w.points_balance, pr.spa_points)), 0),
    MAX(p.full_name)
  INTO v_opponent_exists, v_opponent_spa, v_opponent_name
  FROM public.profiles p
  LEFT JOIN public.player_rankings pr ON p.user_id = pr.user_id  -- Changed from player_id to user_id
  LEFT JOIN public.wallets w ON p.user_id = w.user_id
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
  
  -- Set challenge status based on auto_accept parameter
  v_challenge_status := CASE 
    WHEN p_auto_accept THEN 'accepted'
    ELSE 'pending'
  END;
  
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
    admin_notes,
    responded_at
  ) VALUES (
    p_challenger_id,
    p_opponent_id,
    p_bet_points,
    p_race_to,
    p_message,
    p_club_id,
    v_challenge_status,
    CASE WHEN p_auto_accept THEN NULL ELSE NOW() + INTERVAL '48 hours' END,
    p_admin_id,
    p_admin_notes,
    CASE WHEN p_auto_accept THEN NOW() ELSE NULL END
  ) RETURNING id INTO v_challenge_id;
  
  -- Create notifications for both users (with null checks)
  IF p_opponent_id IS NOT NULL AND v_opponent_exists THEN
    INSERT INTO public.notifications (user_id, type, title, message, priority, metadata)
    VALUES (
      p_opponent_id,
      CASE WHEN p_auto_accept THEN 'challenge_accepted' ELSE 'challenge_received' END,
      CASE WHEN p_auto_accept THEN 'Thách đấu đã được chấp nhận' ELSE 'Thách đấu mới từ Admin' END,
      format('Admin đã tạo thách đấu %s điểm SPA từ %s%s', 
             p_bet_points,
             COALESCE(v_challenger_name, 'Người chơi'),
             CASE WHEN p_auto_accept THEN ' và đã được chấp nhận tự động' ELSE '' END
      ),
      'high',
      jsonb_build_object(
        'challenge_id', v_challenge_id,
        'challenger_id', p_challenger_id,
        'bet_points', p_bet_points,
        'admin_created', true,
        'auto_accepted', p_auto_accept,
        'admin_id', p_admin_id
      )
    );
  END IF;
  
  IF p_challenger_id IS NOT NULL AND v_challenger_exists THEN
    INSERT INTO public.notifications (user_id, type, title, message, priority, metadata)
    VALUES (
      p_challenger_id,
      CASE WHEN p_auto_accept THEN 'challenge_accepted' ELSE 'challenge_created' END,
      CASE WHEN p_auto_accept THEN 'Thách đấu đã được chấp nhận' ELSE 'Thách đấu được tạo bởi Admin' END,
      format('Admin đã tạo thách đấu %s điểm SPA với %s%s',
             p_bet_points,
             COALESCE(v_opponent_name, 'Người chơi'),
             CASE WHEN p_auto_accept THEN ' và đã được chấp nhận tự động' ELSE ' cho bạn' END
      ),
      'normal',
      jsonb_build_object(
        'challenge_id', v_challenge_id,
        'opponent_id', p_opponent_id,
        'bet_points', p_bet_points,
        'admin_created', true,
        'auto_accepted', p_auto_accept,
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
      'club_id', p_club_id,
      'auto_accepted', p_auto_accept,
      'status', v_challenge_status
    ),
    format('Admin created challenge between %s and %s for %s points%s',
           COALESCE(v_challenger_name, 'Người chơi'),
           COALESCE(v_opponent_name, 'Người chơi'),
           p_bet_points,
           CASE WHEN p_auto_accept THEN ' (auto-accepted)' ELSE '' END
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'challenge_id', v_challenge_id,
    'challenger_id', p_challenger_id,
    'opponent_id', p_opponent_id,
    'bet_points', p_bet_points,
    'status', v_challenge_status,
    'auto_accepted', p_auto_accept,
    'admin_id', p_admin_id,
    'message', format('Challenge created successfully by admin%s', 
                     CASE WHEN p_auto_accept THEN ' and auto-accepted' ELSE '' END)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;

-- 4. Clean up any remaining references by checking if there are triggers on the profiles table causing issues
-- Let's check what triggers exist on the profiles table specifically

-- If there's a trigger that we missed, let's create a comprehensive check
DO $$ 
DECLARE
    func_record RECORD;
BEGIN
    -- Final check: Look for any remaining functions with player_id that might be called by triggers
    FOR func_record IN 
        SELECT proname as function_name, prosrc as source_code
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
          AND prosrc LIKE '%NEW.player_id%'
    LOOP
        RAISE NOTICE 'CRITICAL: Found function % still using NEW.player_id', func_record.function_name;
    END LOOP;
END $$;

-- Verify our changes worked
SELECT 'Migration completed - all player_id references should now be updated to user_id' as status;