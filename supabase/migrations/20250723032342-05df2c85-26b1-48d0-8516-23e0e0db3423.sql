
-- Step 1: Create enhanced user creation function with zero-based data
CREATE OR REPLACE FUNCTION public.create_user_zero_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Create wallet record with zero balance
  INSERT INTO public.wallets (user_id, balance, points_balance, status, total_earned, total_spent)
  VALUES (NEW.user_id, 0, 0, 'active', 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create player_rankings record with zero data (except ELO = 1000)
  INSERT INTO public.player_rankings (
    user_id, elo_points, spa_points, total_matches, wins, losses, 
    win_streak, promotion_eligible, current_rank, verified_rank
  )
  VALUES (NEW.user_id, 1000, 0, 0, 0, 0, 0, false, 'K', NULL)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create player_stats record with zero data
  INSERT INTO public.player_stats (
    user_id, total_matches, total_wins, total_losses, win_percentage,
    current_streak, longest_win_streak, tournaments_played, tournaments_won,
    spa_points_earned
  )
  VALUES (NEW.user_id, 0, 0, 0, 0, 0, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create player_trust_scores record with zero data
  INSERT INTO public.player_trust_scores (
    user_id, trust_score, trust_percentage, rating_count
  )
  VALUES (NEW.user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create elo_history record for initial ELO
  INSERT INTO public.elo_history (
    user_id, elo_change, new_elo, reason
  )
  VALUES (NEW.user_id, 0, 1000, 'Initial ELO assignment')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Step 2: Create club creation function with zero-based data
CREATE OR REPLACE FUNCTION public.create_club_zero_data(p_club_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_club_registration RECORD;
  v_club_profile_id UUID;
BEGIN
  -- Get club registration data
  SELECT * INTO v_club_registration
  FROM public.club_registrations
  WHERE id = p_club_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Club registration not found');
  END IF;

  -- Create club_profiles record with zero-based data
  INSERT INTO public.club_profiles (
    id, user_id, club_name, address, phone, description, 
    hourly_rate, available_tables, priority_score, is_sabo_owned,
    verification_status
  )
  VALUES (
    gen_random_uuid(), p_user_id, v_club_registration.club_name, 
    v_club_registration.address, v_club_registration.phone, 
    v_club_registration.description, 0, 0, 0, false, 'approved'
  )
  RETURNING id INTO v_club_profile_id;

  -- Create club membership for owner
  INSERT INTO public.memberships (user_id, club_id, role, status)
  VALUES (p_user_id, v_club_profile_id, 'owner', 'active')
  ON CONFLICT DO NOTHING;

  -- Create default club tables (if table_count > 0)
  IF v_club_registration.table_count > 0 THEN
    INSERT INTO public.club_tables (club_id, table_number, table_name, status)
    SELECT 
      v_club_profile_id,
      generate_series(1, v_club_registration.table_count),
      'Table ' || generate_series(1, v_club_registration.table_count),
      'available';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'club_profile_id', v_club_profile_id,
    'message', 'Club created with zero-based data'
  );
END;
$function$;

-- Step 3: Create cleanup function for existing sample data
CREATE OR REPLACE FUNCTION public.cleanup_sample_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_updated_wallets INTEGER;
  v_updated_rankings INTEGER;
  v_created_stats INTEGER;
  v_created_trust INTEGER;
BEGIN
  -- Reset wallet balances to zero (except for admins)
  UPDATE public.wallets 
  SET points_balance = 0, 
      total_earned = 0, 
      total_spent = 0,
      updated_at = NOW()
  WHERE user_id NOT IN (
    SELECT user_id FROM public.profiles WHERE is_admin = true
  );
  GET DIAGNOSTICS v_updated_wallets = ROW_COUNT;

  -- Reset player rankings SPA points to zero
  UPDATE public.player_rankings 
  SET spa_points = 0,
      updated_at = NOW()
  WHERE user_id NOT IN (
    SELECT user_id FROM public.profiles WHERE is_admin = true
  );
  GET DIAGNOSTICS v_updated_rankings = ROW_COUNT;

  -- Create missing player_stats records
  INSERT INTO public.player_stats (
    user_id, total_matches, total_wins, total_losses, win_percentage,
    current_streak, longest_win_streak, tournaments_played, tournaments_won,
    spa_points_earned
  )
  SELECT 
    p.user_id, 0, 0, 0, 0, 0, 0, 0, 0, 0
  FROM public.profiles p
  LEFT JOIN public.player_stats ps ON p.user_id = ps.user_id
  WHERE ps.user_id IS NULL AND p.is_demo_user = false
  ON CONFLICT (user_id) DO NOTHING;
  GET DIAGNOSTICS v_created_stats = ROW_COUNT;

  -- Create missing player_trust_scores records
  INSERT INTO public.player_trust_scores (
    user_id, trust_score, trust_percentage, rating_count
  )
  SELECT 
    p.user_id, 0, 0, 0
  FROM public.profiles p
  LEFT JOIN public.player_trust_scores pts ON p.user_id = pts.user_id
  WHERE pts.user_id IS NULL AND p.is_demo_user = false
  ON CONFLICT (user_id) DO NOTHING;
  GET DIAGNOSTICS v_created_trust = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'updated_wallets', v_updated_wallets,
    'updated_rankings', v_updated_rankings,
    'created_stats', v_created_stats,
    'created_trust', v_created_trust,
    'cleanup_time', NOW()
  );
END;
$function$;

-- Step 4: Update triggers to use zero-based data
DROP TRIGGER IF EXISTS ensure_complete_user_records ON public.profiles;
CREATE TRIGGER ensure_complete_user_records
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_zero_data();

-- Step 5: Run cleanup for existing data
SELECT public.cleanup_sample_data();
