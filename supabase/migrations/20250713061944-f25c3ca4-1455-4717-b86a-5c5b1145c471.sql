-- Fix all remaining functions that use player_id instead of user_id

-- 1. Fix accept_sabo_challenge function
CREATE OR REPLACE FUNCTION public.accept_sabo_challenge(p_challenge_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- Get user's SPA points (FIXED: using user_id instead of player_id)
  SELECT COALESCE(pr.spa_points, 0) INTO v_user_spa
  FROM public.player_rankings pr
  WHERE pr.user_id = p_user_id;
  
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
$function$;

-- 2. Fix admin_add_users_to_tournament function
CREATE OR REPLACE FUNCTION public.admin_add_users_to_tournament(p_tournament_id uuid, p_user_ids uuid[], p_admin_id uuid, p_notes text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  tournament_record RECORD;
  user_count INTEGER;
  available_slots INTEGER;
  inserted_count INTEGER := 0;
  result jsonb;
BEGIN
  -- Get tournament info
  SELECT * INTO tournament_record
  FROM public.tournaments 
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Tournament not found',
      'tournament_id', p_tournament_id
    );
  END IF;
  
  -- Check available slots
  SELECT COUNT(*) INTO user_count
  FROM public.tournament_registrations 
  WHERE tournament_id = p_tournament_id;
  
  available_slots := tournament_record.max_participants - user_count;
  
  IF array_length(p_user_ids, 1) > available_slots THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Not enough slots available',
      'available_slots', available_slots,
      'requested', array_length(p_user_ids, 1),
      'current_participants', user_count,
      'max_participants', tournament_record.max_participants
    );
  END IF;
  
  -- Insert registrations (FIXED: using user_id instead of player_id)
  INSERT INTO public.tournament_registrations (
    tournament_id, user_id, registration_status, payment_status,
    status, added_by_admin, admin_notes, registration_date
  )
  SELECT 
    p_tournament_id, 
    unnest(p_user_ids),
    'confirmed',
    'paid',
    'confirmed', 
    p_admin_id,
    p_notes,
    now()
  ON CONFLICT (tournament_id, user_id) DO NOTHING;
  
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  
  -- Update tournament participant count
  UPDATE public.tournaments 
  SET 
    current_participants = (
      SELECT COUNT(*) FROM public.tournament_registrations 
      WHERE tournament_id = p_tournament_id
    ),
    updated_at = now()
  WHERE id = p_tournament_id;
  
  -- Mark demo users as in use
  UPDATE public.demo_user_pool 
  SET 
    is_available = false, 
    currently_used_in = p_tournament_id::TEXT,
    last_used_at = now()
  WHERE user_id = ANY(p_user_ids);
  
  result := jsonb_build_object(
    'success', true,
    'added_count', inserted_count,
    'tournament_name', tournament_record.name,
    'tournament_id', p_tournament_id,
    'new_participant_count', (
      SELECT COUNT(*) FROM public.tournament_registrations 
      WHERE tournament_id = p_tournament_id
    ),
    'available_slots_remaining', tournament_record.max_participants - (
      SELECT COUNT(*) FROM public.tournament_registrations 
      WHERE tournament_id = p_tournament_id
    )
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Database error: ' || SQLERRM,
    'error_code', SQLSTATE,
    'error_detail', SQLSTATE || ': ' || SQLERRM
  );
END;
$function$;