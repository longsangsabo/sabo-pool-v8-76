-- Phase 1: Database Migration & Setup

-- 1. First, let's check if we need to migrate existing challenges data
-- Create a function to migrate data from challenges to sabo_challenges
CREATE OR REPLACE FUNCTION migrate_challenges_to_sabo()
RETURNS TABLE(migrated_count INTEGER, error_message TEXT) AS $$
DECLARE
  challenge_record RECORD;
  migrated_count INTEGER := 0;
  error_message TEXT := NULL;
BEGIN
  -- Migrate existing challenges to sabo_challenges
  FOR challenge_record IN 
    SELECT * FROM public.challenges 
    WHERE status IN ('pending', 'accepted', 'in_progress')
  LOOP
    BEGIN
      INSERT INTO public.sabo_challenges (
        challenger_id,
        opponent_id,
        stake_amount,
        race_to,
        handicap_challenger,
        handicap_opponent,
        status,
        created_at,
        expires_at,
        accepted_at,
        started_at,
        completed_at,
        challenger_score,
        opponent_score,
        winner_id,
        rack_history
      ) VALUES (
        challenge_record.challenger_id,
        challenge_record.opponent_id,
        COALESCE(challenge_record.bet_points, 100), -- Default stake
        COALESCE(challenge_record.race_to, 8), -- Default race to 8
        0, -- Will be calculated by trigger
        0, -- Will be calculated by trigger
        challenge_record.status,
        challenge_record.created_at,
        challenge_record.expires_at,
        challenge_record.responded_at,
        CASE WHEN challenge_record.status = 'in_progress' THEN challenge_record.responded_at ELSE NULL END,
        CASE WHEN challenge_record.status = 'completed' THEN NOW() ELSE NULL END,
        0, -- Initial score
        0, -- Initial score
        NULL, -- No winner yet
        '[]'::jsonb -- Empty rack history
      );
      
      migrated_count := migrated_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      error_message := SQLERRM;
      -- Continue with next record
    END;
  END LOOP;
  
  RETURN QUERY SELECT migrated_count, error_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update admin_create_challenge function to use sabo_challenges instead of challenges
CREATE OR REPLACE FUNCTION public.admin_create_sabo_challenge(
  p_challenger_id uuid, 
  p_opponent_id uuid, 
  p_stake_amount integer, 
  p_admin_id uuid, 
  p_message text DEFAULT NULL::text, 
  p_admin_notes text DEFAULT NULL::text, 
  p_auto_accept boolean DEFAULT false
)
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
  
  IF v_challenger_spa < p_stake_amount THEN
    RAISE EXCEPTION 'Challenger does not have enough SPA points (has %, needs %)', v_challenger_spa, p_stake_amount;
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
  
  -- Create notifications for both users
  IF p_opponent_id IS NOT NULL AND v_opponent_exists THEN
    INSERT INTO public.notifications (user_id, type, title, message, priority, metadata)
    VALUES (
      p_opponent_id,
      CASE WHEN p_auto_accept THEN 'challenge_accepted' ELSE 'challenge_received' END,
      CASE WHEN p_auto_accept THEN 'SABO Challenge Accepted' ELSE 'New SABO Challenge' END,
      format('Admin created a %s SPA points SABO challenge from %s%s', 
             p_stake_amount,
             COALESCE(v_challenger_name, 'Player'),
             CASE WHEN p_auto_accept THEN ' and auto-accepted it' ELSE '' END
      ),
      'high',
      jsonb_build_object(
        'challenge_id', v_challenge_id,
        'challenger_id', p_challenger_id,
        'stake_amount', p_stake_amount,
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
      CASE WHEN p_auto_accept THEN 'SABO Challenge Accepted' ELSE 'SABO Challenge Created' END,
      format('Admin created a %s SPA points SABO challenge with %s%s',
             p_stake_amount,
             COALESCE(v_opponent_name, 'Player'),
             CASE WHEN p_auto_accept THEN ' and auto-accepted it' ELSE ' for you' END
      ),
      'normal',
      jsonb_build_object(
        'challenge_id', v_challenge_id,
        'opponent_id', p_opponent_id,
        'stake_amount', p_stake_amount,
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
    'create_sabo_challenge',
    jsonb_build_object(
      'challenge_id', v_challenge_id,
      'challenger_id', p_challenger_id,
      'opponent_id', p_opponent_id,
      'stake_amount', p_stake_amount,
      'auto_accepted', p_auto_accept,
      'status', v_challenge_status
    ),
    format('Admin created SABO challenge between %s and %s for %s SPA points%s',
           COALESCE(v_challenger_name, 'Player'),
           COALESCE(v_opponent_name, 'Player'),
           p_stake_amount,
           CASE WHEN p_auto_accept THEN ' (auto-accepted)' ELSE '' END
    )
  );
  
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

-- 3. Update challenge accept/start workflow function
CREATE OR REPLACE FUNCTION public.accept_sabo_challenge(
  p_challenge_id uuid,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_challenge RECORD;
  v_user_spa INTEGER;
BEGIN
  -- Get challenge details
  SELECT * INTO v_challenge
  FROM public.sabo_challenges
  WHERE id = p_challenge_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Challenge not found or not pending');
  END IF;
  
  -- Verify user is the opponent
  IF v_challenge.opponent_id != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only the challenged player can accept this challenge');
  END IF;
  
  -- Check if user has enough SPA points
  SELECT COALESCE(MAX(COALESCE(w.points_balance, pr.spa_points)), 0)
  INTO v_user_spa
  FROM public.profiles p
  LEFT JOIN public.player_rankings pr ON p.user_id = pr.player_id
  LEFT JOIN public.wallets w ON p.user_id = w.user_id
  WHERE p.user_id = p_user_id;
  
  IF v_user_spa < v_challenge.stake_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient SPA points to accept challenge');
  END IF;
  
  -- Accept the challenge
  UPDATE public.sabo_challenges
  SET 
    status = 'accepted',
    accepted_at = NOW()
  WHERE id = p_challenge_id;
  
  -- Create notification for challenger
  INSERT INTO public.notifications (user_id, type, title, message, priority, metadata)
  VALUES (
    v_challenge.challenger_id,
    'challenge_accepted',
    'SABO Challenge Accepted',
    'Your SABO challenge has been accepted! The match is ready to start.',
    'high',
    jsonb_build_object(
      'challenge_id', p_challenge_id,
      'stake_amount', v_challenge.stake_amount
    )
  );
  
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
$function$;

-- 4. Start match function
CREATE OR REPLACE FUNCTION public.start_sabo_match(
  p_challenge_id uuid,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_challenge RECORD;
BEGIN
  -- Get challenge details
  SELECT * INTO v_challenge
  FROM public.sabo_challenges
  WHERE id = p_challenge_id AND status = 'accepted';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Challenge not found or not accepted');
  END IF;
  
  -- Verify user is involved in the challenge
  IF v_challenge.challenger_id != p_user_id AND v_challenge.opponent_id != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are not involved in this challenge');
  END IF;
  
  -- Start the match
  UPDATE public.sabo_challenges
  SET 
    status = 'in_progress',
    started_at = NOW()
  WHERE id = p_challenge_id;
  
  -- Notify both players
  INSERT INTO public.notifications (user_id, type, title, message, priority, metadata)
  VALUES 
    (v_challenge.challenger_id, 'match_started', 'SABO Match Started', 'Your SABO match has begun! Good luck!', 'normal', jsonb_build_object('challenge_id', p_challenge_id)),
    (v_challenge.opponent_id, 'match_started', 'SABO Match Started', 'Your SABO match has begun! Good luck!', 'normal', jsonb_build_object('challenge_id', p_challenge_id));
  
  RETURN jsonb_build_object(
    'success', true,
    'challenge_id', p_challenge_id,
    'status', 'in_progress',
    'message', 'Match started successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;