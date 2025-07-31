-- Fix more functions with player_id references

-- 3. Fix admin_create_sabo_challenge function (the one with wrong parameter join)
CREATE OR REPLACE FUNCTION public.admin_create_sabo_challenge(p_challenger_id uuid, p_opponent_id uuid, p_stake_amount integer, p_admin_id uuid, p_message text DEFAULT NULL::text, p_admin_notes text DEFAULT NULL::text, p_auto_accept boolean DEFAULT false)
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
  -- Validate required parameters
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
  
  -- Validate challenger exists and has enough SPA (FIXED: using user_id)
  SELECT 
    CASE WHEN COUNT(*) > 0 THEN true ELSE false END,
    COALESCE(MAX(COALESCE(w.points_balance, pr.spa_points)), 0),
    MAX(p.full_name)
  INTO v_challenger_exists, v_challenger_spa, v_challenger_name
  FROM public.profiles p
  LEFT JOIN public.player_rankings pr ON p.user_id = pr.user_id
  LEFT JOIN public.wallets w ON p.user_id = w.user_id
  WHERE p.user_id = p_challenger_id;
  
  IF NOT v_challenger_exists THEN
    RAISE EXCEPTION 'Challenger user not found';
  END IF;
  
  IF v_challenger_spa < p_stake_amount THEN
    RAISE EXCEPTION 'Challenger does not have enough SPA points (has %, needs %)', v_challenger_spa, p_stake_amount;
  END IF;
  
  -- Validate opponent exists and has enough SPA (FIXED: using user_id)
  SELECT 
    CASE WHEN COUNT(*) > 0 THEN true ELSE false END,
    COALESCE(MAX(COALESCE(w.points_balance, pr.spa_points)), 0),
    MAX(p.full_name)
  INTO v_opponent_exists, v_opponent_spa, v_opponent_name
  FROM public.profiles p
  LEFT JOIN public.player_rankings pr ON p.user_id = pr.user_id
  LEFT JOIN public.wallets w ON p.user_id = w.user_id
  WHERE p.user_id = p_opponent_id;
  
  IF NOT v_opponent_exists THEN
    RAISE EXCEPTION 'Opponent user not found';
  END IF;
  
  IF v_opponent_spa < p_stake_amount THEN
    RAISE EXCEPTION 'Opponent does not have enough SPA points (has %, needs %)', v_opponent_spa, p_stake_amount;
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
  
  -- Create the SABO challenge
  INSERT INTO public.sabo_challenges (
    challenger_id,
    opponent_id,
    stake_amount,
    status,
    expires_at,
    accepted_at,
    started_at
  ) VALUES (
    p_challenger_id,
    p_opponent_id,
    p_stake_amount,
    v_challenge_status,
    CASE WHEN p_auto_accept THEN NULL ELSE NOW() + INTERVAL '48 hours' END,
    CASE WHEN p_auto_accept THEN NOW() ELSE NULL END,
    CASE WHEN p_auto_accept THEN NOW() ELSE NULL END
  ) RETURNING id INTO v_challenge_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'challenge_id', v_challenge_id,
    'challenger_id', p_challenger_id,
    'opponent_id', p_opponent_id,
    'stake_amount', p_stake_amount,
    'status', v_challenge_status,
    'auto_accepted', p_auto_accept,
    'admin_id', p_admin_id,
    'message', format('SABO Challenge created successfully by admin%s', 
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

-- 4. Fix admin_create_sabo_challenge (the other version with bet_points)
CREATE OR REPLACE FUNCTION public.admin_create_sabo_challenge(p_challenger_id uuid, p_opponent_id uuid, p_bet_points integer, p_admin_id uuid, p_race_to integer DEFAULT 8, p_message text DEFAULT NULL::text, p_club_id uuid DEFAULT NULL::uuid, p_admin_notes text DEFAULT NULL::text, p_auto_accept boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  -- Validate admin permissions
  SELECT is_admin INTO v_admin_check
  FROM public.profiles
  WHERE user_id = p_admin_id;
  
  IF NOT COALESCE(v_admin_check, false) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can create SABO challenges';
  END IF;
  
  -- Validate challenger exists and has enough SPA (FIXED: using user_id)
  SELECT 
    CASE WHEN COUNT(*) > 0 THEN true ELSE false END,
    COALESCE(MAX(COALESCE(w.points_balance, pr.spa_points)), 0),
    MAX(p.full_name)
  INTO v_challenger_exists, v_challenger_spa, v_challenger_name
  FROM public.profiles p
  LEFT JOIN public.player_rankings pr ON p.user_id = pr.user_id
  LEFT JOIN public.wallets w ON p.user_id = w.user_id
  WHERE p.user_id = p_challenger_id;
  
  IF NOT v_challenger_exists THEN
    RAISE EXCEPTION 'Challenger user not found';
  END IF;
  
  IF v_challenger_spa < p_bet_points THEN
    RAISE EXCEPTION 'Challenger does not have enough SPA points (has %, needs %)', v_challenger_spa, p_bet_points;
  END IF;
  
  -- Validate opponent exists and has enough SPA (FIXED: using user_id)
  SELECT 
    CASE WHEN COUNT(*) > 0 THEN true ELSE false END,
    COALESCE(MAX(COALESCE(w.points_balance, pr.spa_points)), 0),
    MAX(p.full_name)
  INTO v_opponent_exists, v_opponent_spa, v_opponent_name
  FROM public.profiles p
  LEFT JOIN public.player_rankings pr ON p.user_id = pr.user_id
  LEFT JOIN public.wallets w ON p.user_id = w.user_id
  WHERE p.user_id = p_opponent_id;
  
  IF NOT v_opponent_exists THEN
    RAISE EXCEPTION 'Opponent user not found';
  END IF;
  
  IF v_opponent_spa < p_bet_points THEN
    RAISE EXCEPTION 'Opponent does not have enough SPA points (has %, needs %)', v_opponent_spa, p_bet_points;
  END IF;
  
  -- Set challenge status
  v_challenge_status := CASE 
    WHEN p_auto_accept THEN 'accepted'
    ELSE 'pending'
  END;
  
  -- Create the SABO challenge with explicit schema reference
  INSERT INTO public.sabo_challenges (
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
  
  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'challenge_id', v_challenge_id,
    'challenger_id', p_challenger_id,
    'opponent_id', p_opponent_id,
    'bet_points', p_bet_points,
    'status', v_challenge_status,
    'auto_accepted', p_auto_accept,
    'admin_id', p_admin_id,
    'message', format('SABO challenge created successfully by admin%s', 
                     CASE WHEN p_auto_accept THEN ' and auto-accepted' ELSE '' END)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$function$;