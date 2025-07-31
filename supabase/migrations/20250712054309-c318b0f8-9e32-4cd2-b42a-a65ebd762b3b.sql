-- Update admin_create_challenge function to allow setting custom status
CREATE OR REPLACE FUNCTION public.admin_create_challenge(
    p_challenger_id uuid, 
    p_opponent_id uuid, 
    p_bet_points integer, 
    p_admin_id uuid, 
    p_race_to integer DEFAULT 8, 
    p_message text DEFAULT NULL::text, 
    p_club_id uuid DEFAULT NULL::uuid, 
    p_admin_notes text DEFAULT NULL::text,
    p_auto_accept boolean DEFAULT false  -- New parameter to control auto-accept
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