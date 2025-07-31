-- Kiểm tra và sửa tất cả trigger còn dùng player_id

-- 1. Xóa trigger sync_wallet_on_spa_change nếu còn tồn tại
DROP TRIGGER IF EXISTS sync_wallet_on_spa_change ON public.player_rankings;

-- 2. Tạo lại trigger với user_id (đã fix)
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

-- 3. Tạo lại trigger
CREATE TRIGGER sync_wallet_on_spa_change
  AFTER UPDATE OF spa_points ON public.player_rankings
  FOR EACH ROW EXECUTE FUNCTION sync_wallet_on_spa_change();

-- 4. Kiểm tra xem có trigger nào khác không
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT trigger_name, event_object_table, action_statement 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
        AND action_statement LIKE '%player_id%'
    LOOP
        RAISE NOTICE 'Found trigger with player_id: % on table %', rec.trigger_name, rec.event_object_table;
    END LOOP;
END $$;

-- 5. Test function với dữ liệu thật
SELECT public.simple_grant_spa_points(
    'dc6705c7-6261-4caf-8f1b-2ec23ba87f05'::uuid,
    10,
    '3bd4ded0-2b7d-430c-b245-c10d079b333a'::uuid,
    'Test grant'
);