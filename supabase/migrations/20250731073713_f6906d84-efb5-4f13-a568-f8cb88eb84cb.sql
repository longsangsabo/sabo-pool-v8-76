-- Tạo function để tự động tạo player_rankings khi có user mới
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Tạo player_rankings record với default values
  INSERT INTO public.player_rankings (
    user_id,
    elo_points,
    spa_points,
    total_matches,
    wins,
    losses,
    win_streak,
    current_rank,
    verified_rank,
    promotion_eligible,
    created_at,
    updated_at
  ) VALUES (
    NEW.user_id,
    1000,  -- Default ELO
    0,     -- Default SPA points
    0,     -- No matches yet
    0,     -- No wins yet
    0,     -- No losses yet
    0,     -- No win streak
    'K',   -- Default rank
    NULL,  -- No verified rank yet
    false, -- Not eligible for promotion
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO NOTHING; -- Avoid duplicates
  
  -- Tạo wallet record với default balance
  INSERT INTO public.wallets (
    user_id,
    points_balance,
    balance,
    total_earned,
    total_spent,
    status,
    created_at,
    updated_at
  ) VALUES (
    NEW.user_id,
    0,       -- Default points balance
    0,       -- Default balance
    0,       -- Total earned
    0,       -- Total spent
    'active', -- Default status
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO NOTHING; -- Avoid duplicates

  RETURN NEW;
END;
$$;

-- Tạo trigger để chạy function khi có profile mới
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Tạo player_rankings và wallets cho các user hiện có mà chưa có records
INSERT INTO public.player_rankings (
  user_id, elo_points, spa_points, total_matches, wins, losses, 
  win_streak, current_rank, verified_rank, promotion_eligible, created_at, updated_at
)
SELECT 
  p.user_id, 1000, 0, 0, 0, 0, 0, 'K', NULL, false, NOW(), NOW()
FROM public.profiles p
LEFT JOIN public.player_rankings pr ON p.user_id = pr.user_id
WHERE pr.user_id IS NULL;

INSERT INTO public.wallets (
  user_id, points_balance, balance, total_earned, total_spent, status, created_at, updated_at
)
SELECT 
  p.user_id, 0, 0, 0, 0, 'active', NOW(), NOW()
FROM public.profiles p
LEFT JOIN public.wallets w ON p.user_id = w.user_id
WHERE w.user_id IS NULL;