-- Fix all remaining player_id references in functions and clean up properly

-- 1. Fix decay_inactive_spa_points function
CREATE OR REPLACE FUNCTION public.decay_inactive_spa_points()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  decay_amount INTEGER := 50;
  inactive_count INTEGER := 0;
BEGIN
  -- Find players inactive for >30 days and decay their points
  WITH inactive_players AS (
    SELECT p.user_id as id
    FROM public.profiles p
    LEFT JOIN public.matches m ON (m.player1_id = p.user_id OR m.player2_id = p.user_id) 
      AND m.created_at > NOW() - INTERVAL '30 days'
    LEFT JOIN public.player_rankings pr ON pr.user_id = p.user_id
    WHERE m.id IS NULL 
    AND pr.spa_points > 0
    AND pr.updated_at < NOW() - INTERVAL '30 days'
  )
  UPDATE public.player_rankings pr
  SET spa_points = GREATEST(0, spa_points - decay_amount),
      updated_at = NOW()
  FROM inactive_players ip
  WHERE pr.user_id = ip.id;
  
  -- Get count of affected players
  GET DIAGNOSTICS inactive_count = ROW_COUNT;
  
  -- Log the decay for each affected player
  INSERT INTO public.spa_transactions (user_id, amount, transaction_type, category, description)
  SELECT pr.user_id, -decay_amount, 'system_decay', 'decay', 'Inactive penalty (30+ days)'
  FROM public.player_rankings pr
  WHERE pr.updated_at >= NOW() - INTERVAL '1 hour'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    LEFT JOIN public.matches m ON (m.player1_id = p.user_id OR m.player2_id = p.user_id) 
      AND m.created_at > NOW() - INTERVAL '30 days'
    WHERE m.id IS NULL AND p.user_id = pr.user_id
  );
  
  -- Log the operation in system logs if table exists
  BEGIN
    INSERT INTO public.system_logs (log_type, message, metadata)
    VALUES (
      'points_decay',
      'Applied points decay to inactive players',
      jsonb_build_object(
        'decay_amount', decay_amount,
        'affected_players', inactive_count,
        'threshold_days', 30
      )
    );
  EXCEPTION
    WHEN undefined_table THEN
      -- Skip if system_logs table doesn't exist
      NULL;
  END;
END;
$$;

-- 2. Fix credit_spa_points function to remove spa_points_log reference
CREATE OR REPLACE FUNCTION public.credit_spa_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_category TEXT,
  p_description TEXT,
  p_reference_id TEXT,
  p_reference_type TEXT DEFAULT 'general'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_transaction_id UUID;
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_result JSONB;
BEGIN
  -- Create SPA transaction record using user_id
  INSERT INTO public.spa_transactions (
    user_id, amount, transaction_type, category, description, 
    reference_id, reference_type, status
  ) VALUES (
    p_user_id, p_amount, 
    CASE 
      WHEN p_amount > 0 THEN COALESCE(p_category || '_win', 'match_win')
      ELSE COALESCE(p_category || '_loss', 'match_loss')
    END,
    p_category, p_description, p_reference_id, p_reference_type, 'completed'
  ) RETURNING id INTO v_transaction_id;

  -- Update wallet balance
  INSERT INTO public.wallets (user_id, points_balance, status)
  VALUES (p_user_id, p_amount, 'active')
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    points_balance = wallets.points_balance + p_amount,
    updated_at = NOW()
  RETURNING points_balance INTO v_new_balance;

  -- Get previous balance
  v_current_balance := v_new_balance - p_amount;

  -- Update player rankings SPA points using user_id
  INSERT INTO public.player_rankings (user_id, spa_points, updated_at)
  VALUES (p_user_id, p_amount, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    spa_points = player_rankings.spa_points + p_amount,
    updated_at = NOW();

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'user_id', p_user_id,
    'amount_credited', p_amount,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'category', p_category,
    'description', p_description
  );

  RETURN v_result;
END;
$$;

-- 3. Fix debit_spa_points function to remove spa_points_log reference  
CREATE OR REPLACE FUNCTION public.debit_spa_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_category TEXT,
  p_description TEXT,
  p_reference_id TEXT,
  p_reference_type TEXT DEFAULT 'general'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_transaction_id UUID;
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_current_spa INTEGER;
  v_result JSONB;
BEGIN
  -- Get current SPA points
  SELECT COALESCE(spa_points, 0) INTO v_current_spa
  FROM public.player_rankings
  WHERE user_id = p_user_id;

  -- Check if user has enough SPA points
  IF v_current_spa < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient SPA points',
      'current_spa', v_current_spa,
      'requested_amount', p_amount
    );
  END IF;

  -- Create SPA transaction record using user_id
  INSERT INTO public.spa_transactions (
    user_id, amount, transaction_type, category, description, 
    reference_id, reference_type, status
  ) VALUES (
    p_user_id, -p_amount, 
    COALESCE(p_category || '_debit', 'debit'),
    p_category, p_description, p_reference_id, p_reference_type, 'completed'
  ) RETURNING id INTO v_transaction_id;

  -- Update wallet balance
  UPDATE public.wallets 
  SET points_balance = points_balance - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING points_balance INTO v_new_balance;

  v_current_balance := v_new_balance + p_amount;

  -- Update player rankings SPA points using user_id
  UPDATE public.player_rankings
  SET spa_points = spa_points - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'user_id', p_user_id,
    'amount_debited', p_amount,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'category', p_category,
    'description', p_description
  );

  RETURN v_result;
END;
$$;

-- 4. Fix sync_spa_wallet_data function
CREATE OR REPLACE FUNCTION public.sync_spa_wallet_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_synced_count INTEGER := 0;
  v_created_count INTEGER := 0;
  v_user_record RECORD;
BEGIN
  -- Update existing wallets to match player_rankings spa_points
  FOR v_user_record IN 
    SELECT 
      pr.user_id,
      pr.spa_points,
      COALESCE(w.points_balance, 0) as current_wallet_balance
    FROM public.player_rankings pr
    LEFT JOIN public.wallets w ON pr.user_id = w.user_id
    WHERE pr.spa_points > 0
  LOOP
    -- Create wallet if it doesn't exist
    IF v_user_record.current_wallet_balance = 0 AND NOT EXISTS (
      SELECT 1 FROM public.wallets WHERE user_id = v_user_record.user_id
    ) THEN
      INSERT INTO public.wallets (user_id, points_balance, balance, status)
      VALUES (v_user_record.user_id, v_user_record.spa_points, 0, 'active');
      v_created_count := v_created_count + 1;
    ELSE
      -- Update existing wallet to match spa_points
      UPDATE public.wallets 
      SET points_balance = v_user_record.spa_points,
          updated_at = NOW()
      WHERE user_id = v_user_record.user_id
        AND points_balance != v_user_record.spa_points;
      
      IF FOUND THEN
        v_synced_count := v_synced_count + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'synced_count', v_synced_count,
    'created_count', v_created_count,
    'message', format('Synced %s wallets, created %s new wallets', v_synced_count, v_created_count)
  );
END;
$$;

-- 5. Fix ensure_spa_data_consistency function
CREATE OR REPLACE FUNCTION public.ensure_spa_data_consistency()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  sync_count INTEGER := 0;
  missing_wallets INTEGER := 0;
  missing_rankings INTEGER := 0;
BEGIN
  -- Create missing wallet records
  WITH missing_wallet_users AS (
    INSERT INTO public.wallets (user_id, balance, points_balance, status)
    SELECT 
      p.user_id,
      0 as balance,
      COALESCE(pr.spa_points, 50) as points_balance,
      'active' as status
    FROM public.profiles p
    LEFT JOIN public.wallets w ON w.user_id = p.user_id
    LEFT JOIN public.player_rankings pr ON pr.user_id = p.user_id
    WHERE w.user_id IS NULL
    ON CONFLICT (user_id) DO NOTHING
    RETURNING user_id
  )
  SELECT COUNT(*) INTO missing_wallets FROM missing_wallet_users;

  -- Create missing player_rankings records
  WITH missing_ranking_users AS (
    INSERT INTO public.player_rankings (
      user_id, elo_points, spa_points, total_matches, wins, 
      daily_challenges, tournament_wins, rank_points, 
      average_opponent_strength, performance_quality, club_verified, is_visible
    )
    SELECT 
      p.user_id,
      1000 as elo_points,
      COALESCE(w.points_balance, 50) as spa_points,
      0 as total_matches,
      0 as wins,
      0 as daily_challenges,
      0 as tournament_wins,
      0 as rank_points,
      0 as average_opponent_strength,
      0 as performance_quality,
      false as club_verified,
      true as is_visible
    FROM public.profiles p
    LEFT JOIN public.player_rankings pr ON pr.user_id = p.user_id
    LEFT JOIN public.wallets w ON w.user_id = p.user_id
    WHERE pr.user_id IS NULL
    ON CONFLICT (user_id) DO NOTHING
    RETURNING user_id
  )
  SELECT COUNT(*) INTO missing_rankings FROM missing_ranking_users;

  -- Sync mismatched data between wallets and player_rankings
  WITH synced_data AS (
    UPDATE public.player_rankings 
    SET spa_points = w.points_balance,
        updated_at = now()
    FROM public.wallets w
    WHERE player_rankings.user_id = w.user_id
    AND player_rankings.spa_points != w.points_balance
    RETURNING player_rankings.user_id
  )
  SELECT COUNT(*) INTO sync_count FROM synced_data;

  -- Log the sync operation
  RAISE NOTICE 'SPA Data Sync Complete: % wallets created, % rankings created, % records synced', 
    missing_wallets, missing_rankings, sync_count;
    
  -- Broadcast sync completion
  PERFORM pg_notify('spa_sync_completed', json_build_object(
    'missing_wallets', missing_wallets,
    'missing_rankings', missing_rankings,
    'synced_records', sync_count,
    'timestamp', extract(epoch from now())
  )::text);
END;
$$;