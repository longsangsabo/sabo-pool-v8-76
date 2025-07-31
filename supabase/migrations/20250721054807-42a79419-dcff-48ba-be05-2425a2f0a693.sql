
-- COMPREHENSIVE RANK APPROVAL AUTOMATION SYSTEM
-- This migration implements automatic profile updates, SPA points, and notifications

-- 1. Create comprehensive rank approval trigger function
CREATE OR REPLACE FUNCTION public.handle_rank_request_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_rank_text TEXT;
  v_spa_reward INTEGER;
  v_club_name TEXT;
  v_player_name TEXT;
BEGIN
  -- Only process approved requests
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Convert requested_rank number to SABO rank text
    v_rank_text := CASE NEW.requested_rank
      WHEN 1 THEN 'K'
      WHEN 2 THEN 'K+'
      WHEN 3 THEN 'I'
      WHEN 4 THEN 'I+'
      WHEN 5 THEN 'H'
      WHEN 6 THEN 'H+'
      WHEN 7 THEN 'G'
      WHEN 8 THEN 'G+'
      WHEN 9 THEN 'F'
      WHEN 10 THEN 'F+'
      WHEN 11 THEN 'E'
      WHEN 12 THEN 'E+'
      ELSE 'K'
    END;
    
    -- Calculate SPA reward based on rank (higher rank = more points)
    v_spa_reward := CASE NEW.requested_rank
      WHEN 12, 11 THEN 300  -- E+, E
      WHEN 10, 9 THEN 250   -- F+, F
      WHEN 8, 7 THEN 200    -- G+, G
      WHEN 6, 5 THEN 150    -- H+, H
      WHEN 4, 3 THEN 120    -- I+, I
      WHEN 2, 1 THEN 100    -- K+, K
      ELSE 100
    END;
    
    -- Get club and player names for notifications
    SELECT club_name INTO v_club_name 
    FROM public.club_profiles 
    WHERE user_id = NEW.club_id;
    
    SELECT full_name INTO v_player_name 
    FROM public.profiles 
    WHERE user_id = NEW.user_id;
    
    BEGIN
      -- 1. Update verified_rank in profiles table
      UPDATE public.profiles 
      SET 
        verified_rank = v_rank_text,
        rank_verified_at = NOW(),
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
      
      -- 2. Update/create player_rankings with SPA points
      INSERT INTO public.player_rankings (
        user_id, verified_rank, spa_points, elo_points, 
        verified_at, verified_by, club_verified,
        created_at, updated_at
      ) VALUES (
        NEW.user_id, v_rank_text, 
        COALESCE((SELECT spa_points FROM public.player_rankings WHERE user_id = NEW.user_id), 0) + v_spa_reward,
        COALESCE((SELECT elo_points FROM public.player_rankings WHERE user_id = NEW.user_id), 1000),
        NOW(), NEW.club_id, true, NOW(), NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        verified_rank = EXCLUDED.verified_rank,
        spa_points = COALESCE(player_rankings.spa_points, 0) + v_spa_reward,
        verified_at = EXCLUDED.verified_at,
        verified_by = EXCLUDED.verified_by,
        club_verified = EXCLUDED.club_verified,
        updated_at = NOW();
      
      -- 3. Update wallet with SPA points
      UPDATE public.wallets 
      SET 
        points_balance = COALESCE(points_balance, 0) + v_spa_reward,
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
      
      -- 4. Create SPA transaction record
      INSERT INTO public.spa_transactions (
        user_id, points, transaction_type, description, 
        reference_id, reference_type, created_at
      ) VALUES (
        NEW.user_id, v_spa_reward, 'rank_approval', 
        format('Rank %s approved by %s', v_rank_text, COALESCE(v_club_name, 'Club')),
        NEW.id, 'rank_request', NOW()
      );
      
      -- 5. Create success notification
      INSERT INTO public.notifications (
        user_id, type, title, message, priority, 
        metadata, created_at
      ) VALUES (
        NEW.user_id, 'rank_approved', 
        'Hạng đã được xác thực!',
        format('Chúc mừng! Hạng %s của bạn đã được CLB "%s" xác thực. Bạn nhận được %s SPA Points!', 
               v_rank_text, COALESCE(v_club_name, 'Unknown'), v_spa_reward),
        'high',
        jsonb_build_object(
          'rank', v_rank_text,
          'spa_reward', v_spa_reward,
          'club_name', v_club_name,
          'approved_by', NEW.club_id
        ),
        NOW()
      );
      
      RAISE NOTICE 'Rank approval successful: User % approved for rank % with % SPA points', 
                   NEW.user_id, v_rank_text, v_spa_reward;
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Rank approval automation failed: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create trigger on rank_requests table
DROP TRIGGER IF EXISTS trigger_handle_rank_approval ON public.rank_requests;
CREATE TRIGGER trigger_handle_rank_approval
  AFTER UPDATE ON public.rank_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_rank_request_approval();

-- 3. Create SPA transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.spa_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on spa_transactions
ALTER TABLE public.spa_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policy for spa_transactions
CREATE POLICY "Users can view their own SPA transactions"
  ON public.spa_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert SPA transactions"
  ON public.spa_transactions FOR INSERT
  WITH CHECK (true);

-- 4. Fix current SABO PRO TEAM user data
-- Update verified_rank to F (rank 9 from latest request)
UPDATE public.profiles 
SET 
  verified_rank = 'F',
  rank_verified_at = NOW(),
  updated_at = NOW()
WHERE user_id = 'b183caef-3ec8-4d3b-9d6a-d0ca4c14be72';

-- Update player_rankings with correct SPA points
INSERT INTO public.player_rankings (
  user_id, verified_rank, spa_points, elo_points, 
  verified_at, club_verified, created_at, updated_at
) VALUES (
  'b183caef-3ec8-4d3b-9d6a-d0ca4c14be72', 'F', 250, 1800,
  NOW(), true, NOW(), NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  verified_rank = 'F',
  spa_points = 250,
  elo_points = 1800,
  verified_at = NOW(),
  club_verified = true,
  updated_at = NOW();

-- Update wallet with SPA points
UPDATE public.wallets 
SET 
  points_balance = COALESCE(points_balance, 0) + 250,
  updated_at = NOW()
WHERE user_id = 'b183caef-3ec8-4d3b-9d6a-d0ca4c14be72';

-- Create notification for manual fix
INSERT INTO public.notifications (
  user_id, type, title, message, priority, 
  metadata, created_at
) VALUES (
  'b183caef-3ec8-4d3b-9d6a-d0ca4c14be72', 'rank_approved', 
  'Hạng đã được cập nhật!',
  'Hạng F của bạn đã được cập nhật thành công. Bạn nhận được 250 SPA Points!',
  'high',
  jsonb_build_object(
    'rank', 'F',
    'spa_reward', 250,
    'manual_fix', true
  ),
  NOW()
);

-- 5. Enable realtime for necessary tables
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.player_rankings REPLICA IDENTITY FULL;
ALTER TABLE public.wallets REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_rankings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;

-- Success message
SELECT 'Rank approval automation system deployed successfully!' as status;
