-- 🔧 FIX SPA_TRANSACTIONS TABLE STRUCTURE
-- Add missing transaction_type column and update function

-- Check if spa_transactions table exists and add missing columns
DO $$
BEGIN
  -- Add transaction_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'spa_transactions' AND column_name = 'transaction_type'
  ) THEN
    ALTER TABLE public.spa_transactions ADD COLUMN transaction_type text DEFAULT 'rank_verification';
    RAISE NOTICE 'Added transaction_type column to spa_transactions table';
  END IF;
  
  -- Add reference_id column if it doesn't exist 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'spa_transactions' AND column_name = 'reference_id'
  ) THEN
    ALTER TABLE public.spa_transactions ADD COLUMN reference_id uuid;
    RAISE NOTICE 'Added reference_id column to spa_transactions table';
  END IF;
  
  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'spa_transactions' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.spa_transactions ADD COLUMN status text DEFAULT 'completed';
    RAISE NOTICE 'Added status column to spa_transactions table';
  END IF;
  
  -- Add description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'spa_transactions' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.spa_transactions ADD COLUMN description text;
    RAISE NOTICE 'Added description column to spa_transactions table';
  END IF;
END $$;

-- Update the trigger function to handle spa_transactions properly
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
      
    -- Log SPA transaction (only if amount > 0)
    IF v_spa_reward > 0 THEN
      INSERT INTO public.spa_transactions (
        user_id,
        amount,
        transaction_type,
        description,
        reference_id,
        status,
        created_at
      ) VALUES (
        NEW.user_id,
        v_spa_reward,
        'rank_verification',
        format('Rank verification reward for %s rank', NEW.requested_rank),
        NEW.id,
        'completed',
        NOW()
      );
    END IF;
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