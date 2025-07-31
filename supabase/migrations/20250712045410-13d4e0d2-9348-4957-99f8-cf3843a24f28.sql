-- Fix SPA points synchronization issue
-- Update admin_credit_spa_points function to also update wallets table

CREATE OR REPLACE FUNCTION public.admin_credit_spa_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current_spa INTEGER;
  v_new_spa INTEGER;
  v_admin_check BOOLEAN;
  v_transaction_id UUID;
  v_current_wallet_balance INTEGER;
  v_new_wallet_balance INTEGER;
BEGIN
  -- Check if the calling user is an admin
  SELECT is_admin INTO v_admin_check
  FROM public.profiles
  WHERE user_id = p_admin_id;
  
  IF NOT COALESCE(v_admin_check, false) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can credit SPA points';
  END IF;
  
  -- Validate amount (must be positive for credits)
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive for credits';
  END IF;
  
  -- Get current SPA points from player_rankings
  SELECT COALESCE(spa_points, 0) INTO v_current_spa
  FROM public.player_rankings
  WHERE player_id = p_user_id;
  
  -- If player ranking doesn't exist, create it
  IF v_current_spa IS NULL THEN
    INSERT INTO public.player_rankings (player_id, spa_points, total_matches, wins, losses)
    VALUES (p_user_id, 0, 0, 0, 0);
    v_current_spa := 0;
  END IF;
  
  -- Get current wallet balance
  SELECT COALESCE(points_balance, 0) INTO v_current_wallet_balance
  FROM public.wallets
  WHERE user_id = p_user_id;
  
  -- If wallet doesn't exist, create it
  IF v_current_wallet_balance IS NULL THEN
    INSERT INTO public.wallets (user_id, points_balance, balance, status)
    VALUES (p_user_id, 0, 0, 'active');
    v_current_wallet_balance := 0;
  END IF;
  
  -- Calculate new amounts
  v_new_spa := v_current_spa + p_amount;
  v_new_wallet_balance := v_current_wallet_balance + p_amount;
  
  -- Update SPA points in player_rankings
  UPDATE public.player_rankings
  SET spa_points = v_new_spa,
      updated_at = NOW()
  WHERE player_id = p_user_id;
  
  -- Update wallet balance (THIS WAS MISSING BEFORE!)
  UPDATE public.wallets
  SET points_balance = v_new_wallet_balance,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log transaction in spa_transactions table with admin_id
  INSERT INTO public.spa_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    reference_id,
    status,
    admin_id
  ) VALUES (
    p_user_id,
    p_amount,
    'admin_credit',
    p_reason,
    'admin_' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'completed',
    p_admin_id
  ) RETURNING id INTO v_transaction_id;
  
  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'user_id', p_user_id,
    'old_spa_amount', v_current_spa,
    'new_spa_amount', v_new_spa,
    'old_wallet_balance', v_current_wallet_balance,
    'new_wallet_balance', v_new_wallet_balance,
    'amount_added', p_amount,
    'reason', p_reason,
    'admin_id', p_admin_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Create function to sync existing data (one-time fix)
CREATE OR REPLACE FUNCTION public.sync_spa_wallet_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_synced_count INTEGER := 0;
  v_created_count INTEGER := 0;
  v_user_record RECORD;
BEGIN
  -- Update existing wallets to match player_rankings spa_points
  FOR v_user_record IN 
    SELECT 
      pr.player_id,
      pr.spa_points,
      COALESCE(w.points_balance, 0) as current_wallet_balance
    FROM public.player_rankings pr
    LEFT JOIN public.wallets w ON pr.player_id = w.user_id
    WHERE pr.spa_points > 0
  LOOP
    -- Create wallet if it doesn't exist
    IF v_user_record.current_wallet_balance = 0 AND NOT EXISTS (
      SELECT 1 FROM public.wallets WHERE user_id = v_user_record.player_id
    ) THEN
      INSERT INTO public.wallets (user_id, points_balance, balance, status)
      VALUES (v_user_record.player_id, v_user_record.spa_points, 0, 'active');
      v_created_count := v_created_count + 1;
    ELSE
      -- Update existing wallet to match spa_points
      UPDATE public.wallets 
      SET points_balance = v_user_record.spa_points,
          updated_at = NOW()
      WHERE user_id = v_user_record.player_id
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

-- Create trigger to automatically sync when player_rankings.spa_points changes
CREATE OR REPLACE FUNCTION public.sync_wallet_on_spa_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only proceed if spa_points actually changed
  IF NEW.spa_points IS DISTINCT FROM OLD.spa_points THEN
    -- Update or create wallet entry
    INSERT INTO public.wallets (user_id, points_balance, balance, status, updated_at)
    VALUES (NEW.player_id, NEW.spa_points, 0, 'active', NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      points_balance = NEW.spa_points,
      updated_at = NOW()
    WHERE wallets.points_balance != NEW.spa_points;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_sync_wallet_on_spa_change ON public.player_rankings;
CREATE TRIGGER trigger_sync_wallet_on_spa_change
  AFTER UPDATE OF spa_points ON public.player_rankings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_wallet_on_spa_change();

-- Also create trigger for inserts
DROP TRIGGER IF EXISTS trigger_sync_wallet_on_spa_insert ON public.player_rankings;
CREATE TRIGGER trigger_sync_wallet_on_spa_insert
  AFTER INSERT ON public.player_rankings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_wallet_on_spa_change();

-- Create function to get SPA transaction history with proper admin info
CREATE OR REPLACE FUNCTION public.get_spa_transaction_history(
  p_admin_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  user_name TEXT,
  amount INTEGER,
  transaction_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  admin_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Verify admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_admin_id AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Return transaction history with user and admin names
  RETURN QUERY
  SELECT 
    st.id,
    st.user_id,
    COALESCE(up.full_name, up.display_name, 'Unknown User') as user_name,
    st.amount,
    st.transaction_type,
    COALESCE(st.description, '') as description,
    st.created_at,
    COALESCE(ap.full_name, ap.display_name, 'System') as admin_name
  FROM public.spa_transactions st
  LEFT JOIN public.profiles up ON st.user_id = up.user_id
  LEFT JOIN public.profiles ap ON st.admin_id = ap.user_id
  WHERE st.transaction_type = 'admin_credit'
  ORDER BY st.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.admin_credit_spa_points(UUID, INTEGER, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_spa_wallet_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_spa_transaction_history(UUID, INTEGER) TO authenticated;