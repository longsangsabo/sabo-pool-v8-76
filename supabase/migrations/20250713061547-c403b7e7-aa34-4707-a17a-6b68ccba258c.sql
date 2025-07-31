-- Fix sync_wallet_on_spa_change trigger function to use user_id instead of player_id
CREATE OR REPLACE FUNCTION public.sync_wallet_on_spa_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only proceed if spa_points actually changed
  IF NEW.spa_points IS DISTINCT FROM OLD.spa_points THEN
    -- Update or create wallet entry (FIXED: using user_id instead of player_id)
    INSERT INTO public.wallets (user_id, points_balance, balance, status, updated_at)
    VALUES (NEW.user_id, NEW.spa_points, 0, 'active', NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      points_balance = NEW.spa_points,
      updated_at = NOW()
    WHERE wallets.points_balance != NEW.spa_points;
  END IF;
  
  RETURN NEW;
END;
$$;