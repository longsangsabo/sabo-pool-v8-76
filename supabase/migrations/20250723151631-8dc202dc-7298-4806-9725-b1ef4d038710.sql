-- 🔥 COMPREHENSIVE RANKING VERIFICATION SYSTEM FIX PLAN (Fixed Dependencies)
-- Addresses security, data integrity, and duplicate logic issues

-- ===============================================
-- 1. SECURITY FIXES - Add missing search_path to all security definer functions
-- ===============================================

-- Fix handle_new_rank_request function
CREATE OR REPLACE FUNCTION public.handle_new_rank_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_club_owner_id UUID;
  v_player_name TEXT;
  v_club_name TEXT;
BEGIN
  -- Get club owner and info
  SELECT cp.user_id, cp.club_name INTO v_club_owner_id, v_club_name
  FROM public.club_profiles cp
  WHERE cp.id = NEW.club_id;

  -- Get player name
  SELECT COALESCE(p.full_name, p.display_name, 'Người chơi') INTO v_player_name
  FROM public.profiles p
  WHERE p.user_id = NEW.user_id;

  -- Create notification for club owner
  IF v_club_owner_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      priority,
      action_url,
      auto_popup
    ) VALUES (
      v_club_owner_id,
      'Yêu cầu xác thực hạng mới',
      format('Có yêu cầu xác thực hạng %s từ %s tại CLB %s', 
             NEW.requested_rank, 
             v_player_name,
             v_club_name),
      'rank_request',
      'high',
      '/club-dashboard?tab=rank-verification',
      true
    );
  END IF;

  -- Send realtime notification
  PERFORM pg_notify(
    'rank_request_created',
    json_build_object(
      'club_id', NEW.club_id,
      'request_id', NEW.id,
      'user_name', v_player_name,
      'requested_rank', NEW.requested_rank,
      'created_at', NEW.created_at
    )::text
  );

  RETURN NEW;
END;
$$;

-- Fix handle_rank_request_status_update function
CREATE OR REPLACE FUNCTION public.handle_rank_request_status_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_player_name TEXT;
  v_club_name TEXT;
  v_status_text TEXT;
  v_spa_reward INTEGER := 0;
BEGIN
  -- Only trigger on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get player and club names
  SELECT COALESCE(p.full_name, p.display_name, 'Bạn') INTO v_player_name
  FROM public.profiles p
  WHERE p.user_id = NEW.user_id;

  SELECT cp.club_name INTO v_club_name
  FROM public.club_profiles cp
  WHERE cp.id = NEW.club_id;

  -- Determine status text and SPA reward
  CASE NEW.status
    WHEN 'approved' THEN 
      v_status_text := 'đã được phê duyệt';
      -- Calculate SPA reward based on rank
      CASE NEW.requested_rank
        WHEN '9K' THEN v_spa_reward := 50;
        WHEN '8K' THEN v_spa_reward := 75;
        WHEN '7K' THEN v_spa_reward := 100;
        WHEN '6K' THEN v_spa_reward := 125;
        WHEN '5K' THEN v_spa_reward := 150;
        WHEN '4K' THEN v_spa_reward := 175;
        WHEN '3K' THEN v_spa_reward := 200;
        WHEN '2K' THEN v_spa_reward := 225;
        WHEN '1K' THEN v_spa_reward := 250;
        WHEN '1D' THEN v_spa_reward := 300;
        WHEN '2D' THEN v_spa_reward := 350;
        WHEN '3D' THEN v_spa_reward := 400;
        WHEN '4D' THEN v_spa_reward := 450;
        WHEN '5D' THEN v_spa_reward := 500;
        WHEN '6D' THEN v_spa_reward := 550;
        WHEN '7D' THEN v_spa_reward := 600;
        ELSE v_spa_reward := 25; -- Default for other ranks
      END CASE;
    WHEN 'rejected' THEN v_status_text := 'đã bị từ chối';
    ELSE v_status_text := 'đã được cập nhật';
  END CASE;

  -- Create notification for user
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    priority,
    action_url,
    auto_popup,
    metadata
  ) VALUES (
    NEW.user_id,
    'Kết quả xác thực hạng',
    format('Yêu cầu xác thực hạng %s tại CLB %s %s', 
           NEW.requested_rank,
           v_club_name,
           v_status_text),
    'rank_result',
    'high',
    '/profile?tab=ranking',
    true,
    CASE WHEN NEW.status = 'approved' THEN
      jsonb_build_object(
        'rank', NEW.requested_rank,
        'spa_reward', v_spa_reward,
        'club_name', v_club_name
      )
    ELSE
      jsonb_build_object(
        'rank', NEW.requested_rank,
        'club_name', v_club_name
      )
    END
  );

  -- Update user's verified rank and award SPA points if approved
  IF NEW.status = 'approved' THEN
    -- Update verified rank in profiles
    UPDATE public.profiles 
    SET verified_rank = NEW.requested_rank,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    -- Award SPA points
    INSERT INTO public.player_rankings (user_id, spa_points, total_matches, wins, losses, updated_at)
    VALUES (NEW.user_id, v_spa_reward, 0, 0, 0, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      spa_points = player_rankings.spa_points + v_spa_reward,
      updated_at = NOW();
      
    -- Log SPA transaction
    INSERT INTO public.spa_transactions (
      user_id,
      amount,
      transaction_type,
      description,
      reference_id,
      status
    ) VALUES (
      NEW.user_id,
      v_spa_reward,
      'rank_verification',
      format('Rank verification reward for %s rank', NEW.requested_rank),
      NEW.id,
      'completed'
    );
  END IF;

  -- Send realtime notification
  PERFORM pg_notify(
    'rank_request_updated',
    json_build_object(
      'request_id', NEW.id,
      'user_id', NEW.user_id,
      'status', NEW.status,
      'requested_rank', NEW.requested_rank,
      'spa_reward', v_spa_reward,
      'updated_at', NEW.updated_at
    )::text
  );

  RETURN NEW;
END;
$$;

-- ===============================================
-- 2. DATA INTEGRITY FIXES
-- ===============================================

-- Add unique constraint to prevent multiple pending requests per user-club combination
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'rank_requests' 
    AND constraint_name = 'unique_user_club_pending_request'
  ) THEN
    ALTER TABLE public.rank_requests DROP CONSTRAINT unique_user_club_pending_request;
  END IF;
  
  -- Add the unique constraint for pending requests only
  ALTER TABLE public.rank_requests 
  ADD CONSTRAINT unique_user_club_pending_request 
  EXCLUDE (user_id WITH =, club_id WITH =) WHERE (status = 'pending');
  
  RAISE NOTICE 'Added unique constraint for pending rank requests';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error adding unique constraint: %', SQLERRM;
END $$;

-- ===============================================
-- 3. NOTIFICATION SYSTEM FIXES
-- ===============================================

-- Add metadata column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN metadata jsonb DEFAULT '{}';
    RAISE NOTICE 'Added metadata column to notifications table';
  END IF;
END $$;

-- Drop existing check constraint on notifications type
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add comprehensive notification types constraint
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'info', 'warning', 'error', 'success',
  'rank_request', 'rank_result', 'rank_approved',
  'tournament_start', 'tournament_end', 'tournament_registration',
  'match_scheduled', 'match_completed', 'match_reminder',
  'challenge_received', 'challenge_accepted', 'challenge_completed',
  'club_invitation', 'club_approved', 'club_rejected',
  'payment_success', 'payment_failed', 'payment_reminder',
  'maintenance', 'system_update', 'promotion'
));

-- ===============================================
-- 4. CLEANUP DEPRECATED FUNCTIONS AND TRIGGERS
-- ===============================================

-- Drop old triggers first to avoid dependency issues
DROP TRIGGER IF EXISTS trigger_notify_club_on_rank_request ON public.rank_requests;
DROP TRIGGER IF EXISTS rank_request_created_trigger ON public.rank_requests;
DROP TRIGGER IF EXISTS rank_request_updated_trigger ON public.rank_requests;
DROP TRIGGER IF EXISTS rank_request_status_change_trigger ON public.rank_requests;

-- Drop old/conflicting functions
DROP FUNCTION IF EXISTS public.handle_rank_request_approval() CASCADE;
DROP FUNCTION IF EXISTS public.notify_club_on_rank_request() CASCADE;

-- ===============================================
-- 5. ENSURE TRIGGERS ARE PROPERLY SET
-- ===============================================

-- Create the correct triggers
CREATE TRIGGER rank_request_created_trigger
  AFTER INSERT ON public.rank_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_rank_request();

CREATE TRIGGER rank_request_updated_trigger
  AFTER UPDATE ON public.rank_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_rank_request_status_update();