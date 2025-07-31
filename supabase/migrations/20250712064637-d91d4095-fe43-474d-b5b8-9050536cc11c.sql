-- Fix search path issues for SABO challenge functions

-- 1. Fix admin_create_sabo_challenge function
CREATE OR REPLACE FUNCTION public.admin_create_sabo_challenge(
  p_challenger_id UUID,
  p_opponent_id UUID, 
  p_bet_points INTEGER,
  p_admin_id UUID,
  p_race_to INTEGER DEFAULT 8,
  p_message TEXT DEFAULT NULL,
  p_club_id UUID DEFAULT NULL,
  p_admin_notes TEXT DEFAULT NULL,
  p_auto_accept BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
  
  -- Validate challenger exists and has enough SPA
  SELECT 
    CASE WHEN COUNT(*) > 0 THEN true ELSE false END,
    COALESCE(MAX(COALESCE(w.points_balance, pr.spa_points)), 0),
    MAX(p.full_name)
  INTO v_challenger_exists, v_challenger_spa, v_challenger_name
  FROM public.profiles p
  LEFT JOIN public.player_rankings pr ON p.user_id = pr.player_id
  LEFT JOIN public.wallets w ON p.user_id = w.user_id
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
    COALESCE(MAX(COALESCE(w.points_balance, pr.spa_points)), 0),
    MAX(p.full_name)
  INTO v_opponent_exists, v_opponent_spa, v_opponent_name
  FROM public.profiles p
  LEFT JOIN public.player_rankings pr ON p.user_id = pr.player_id
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
$$;

-- 2. Fix accept_sabo_challenge function
CREATE OR REPLACE FUNCTION public.accept_sabo_challenge(
  p_challenge_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_challenge RECORD;
  v_user_spa INTEGER;
BEGIN
  -- Get challenge details with explicit schema reference
  SELECT * INTO v_challenge
  FROM public.sabo_challenges
  WHERE id = p_challenge_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;
  
  -- Validate user is the opponent
  IF v_challenge.opponent_id != p_user_id THEN
    RAISE EXCEPTION 'Only the challenged opponent can accept this challenge';
  END IF;
  
  -- Check if challenge is still pending
  IF v_challenge.status != 'pending' THEN
    RAISE EXCEPTION 'Challenge is no longer pending (current status: %)', v_challenge.status;
  END IF;
  
  -- Check if challenge has expired
  IF v_challenge.expires_at IS NOT NULL AND v_challenge.expires_at < NOW() THEN
    RAISE EXCEPTION 'Challenge has expired';
  END IF;
  
  -- Get user's SPA points
  SELECT COALESCE(pr.spa_points, 0) INTO v_user_spa
  FROM public.player_rankings pr
  WHERE pr.player_id = p_user_id;
  
  IF v_user_spa < v_challenge.bet_points THEN
    RAISE EXCEPTION 'Insufficient SPA points to accept challenge (have %, need %)', v_user_spa, v_challenge.bet_points;
  END IF;
  
  -- Update challenge status to accepted with explicit schema reference
  UPDATE public.sabo_challenges
  SET status = 'accepted',
      responded_at = NOW(),
      updated_at = NOW()
  WHERE id = p_challenge_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'challenge_id', p_challenge_id,
    'status', 'accepted',
    'message', 'Challenge accepted successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION public.admin_create_sabo_challenge(UUID, UUID, INTEGER, UUID, INTEGER, TEXT, UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_sabo_challenge(UUID, UUID) TO authenticated;