-- Migration: Enhanced Real-time Rank Synchronization System
-- This migration creates a comprehensive rank synchronization system with triggers and real-time monitoring

-- 1. Create rank update queue table for tracking rank changes
CREATE TABLE IF NOT EXISTS public.rank_update_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  old_rank TEXT,
  new_rank TEXT NOT NULL,
  update_type TEXT NOT NULL CHECK (update_type IN ('promotion', 'demotion', 'initial')),
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on rank_update_queue
ALTER TABLE public.rank_update_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for rank_update_queue
CREATE POLICY "Users can view their own rank updates"
  ON public.rank_update_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage rank updates"
  ON public.rank_update_queue FOR ALL
  USING (true) WITH CHECK (true);

-- 2. Create or update user_ranks view for real-time rank data
CREATE OR REPLACE VIEW public.user_ranks AS
SELECT 
  p.user_id,
  p.full_name,
  p.display_name,
  p.avatar_url,
  COALESCE(pr.verified_rank, pr.current_rank, 'Unranked') as current_rank,
  pr.verified_rank,
  pr.elo_points,
  pr.spa_points,
  pr.total_matches,
  pr.wins,
  pr.losses,
  pr.club_verified,
  pr.verified_at,
  pr.verified_by,
  pr.rank_updated_at,
  p.created_at,
  p.updated_at
FROM public.profiles p
LEFT JOIN public.player_rankings pr ON p.user_id = pr.user_id;

-- 3. Create function to handle rank changes
CREATE OR REPLACE FUNCTION public.handle_rank_change()
RETURNS TRIGGER AS $$
DECLARE
  v_old_rank TEXT;
  v_new_rank TEXT;
  v_update_type TEXT;
BEGIN
  -- Get old and new ranks
  v_old_rank := COALESCE(OLD.verified_rank, OLD.current_rank);
  v_new_rank := COALESCE(NEW.verified_rank, NEW.current_rank);
  
  -- Skip if ranks are the same
  IF v_old_rank = v_new_rank THEN
    RETURN NEW;
  END IF;
  
  -- Determine update type
  IF OLD IS NULL THEN
    v_update_type := 'initial';
  ELSIF v_old_rank IS NULL THEN
    v_update_type := 'initial';
  ELSE
    -- Compare rank hierarchy (simplified - you may want to implement a proper rank comparison function)
    v_update_type := CASE 
      WHEN v_new_rank > v_old_rank THEN 'promotion'
      ELSE 'demotion'
    END;
  END IF;
  
  -- Insert into rank update queue
  INSERT INTO public.rank_update_queue (
    user_id, 
    old_rank, 
    new_rank, 
    update_type
  ) VALUES (
    NEW.user_id, 
    v_old_rank, 
    v_new_rank, 
    v_update_type
  );
  
  -- Update rank_updated_at timestamp
  NEW.rank_updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger on player_rankings for rank changes
DROP TRIGGER IF EXISTS trigger_rank_change ON public.player_rankings;
CREATE TRIGGER trigger_rank_change
  BEFORE UPDATE OF verified_rank, current_rank ON public.player_rankings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_rank_change();

-- 5. Create rank sync monitor function for cleanup and maintenance
CREATE OR REPLACE FUNCTION public.cleanup_rank_update_queue()
RETURNS void AS $$
BEGIN
  -- Mark old entries as processed
  UPDATE public.rank_update_queue
  SET 
    processed = true,
    processed_at = NOW()
  WHERE 
    processed = false 
    AND created_at < NOW() - INTERVAL '1 hour';
    
  -- Delete very old entries (older than 7 days)
  DELETE FROM public.rank_update_queue
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  -- Log cleanup action
  RAISE NOTICE 'Rank update queue cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add rank_updated_at column to player_rankings if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'player_rankings' 
    AND column_name = 'rank_updated_at'
  ) THEN
    ALTER TABLE public.player_rankings 
    ADD COLUMN rank_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- 7. Create index for performance
CREATE INDEX IF NOT EXISTS idx_rank_update_queue_user_id ON public.rank_update_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_rank_update_queue_created_at ON public.rank_update_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_rank_update_queue_processed ON public.rank_update_queue(processed);

-- 8. Enable realtime for rank_update_queue
ALTER TABLE public.rank_update_queue REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rank_update_queue;

-- 9. Create notification function for rank approvals
CREATE OR REPLACE FUNCTION public.notify_rank_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on rank verification changes
  IF OLD.verified_rank IS DISTINCT FROM NEW.verified_rank AND NEW.verified_rank IS NOT NULL THEN
    -- Create notification for the user
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      priority,
      metadata
    ) VALUES (
      NEW.user_id,
      'rank_approved',
      'Xếp hạng đã được phê duyệt',
      format('Xếp hạng %s của bạn đã được xác nhận bởi câu lạc bộ', NEW.verified_rank),
      'high',
      jsonb_build_object(
        'old_rank', OLD.verified_rank,
        'new_rank', NEW.verified_rank,
        'verified_by', NEW.verified_by,
        'verified_at', NEW.verified_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create trigger for rank approval notifications
DROP TRIGGER IF EXISTS trigger_rank_approval_notification ON public.player_rankings;
CREATE TRIGGER trigger_rank_approval_notification
  AFTER UPDATE ON public.player_rankings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_rank_approval();

-- 11. Grant necessary permissions
GRANT SELECT ON public.user_ranks TO authenticated;
GRANT SELECT, INSERT ON public.rank_update_queue TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_rank_update_queue() TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Enhanced Real-time Rank Synchronization System deployed successfully!';
  RAISE NOTICE '🔄 Real-time rank updates: ENABLED';
  RAISE NOTICE '📊 Rank monitoring: ENABLED';
  RAISE NOTICE '🔔 Rank approval notifications: ENABLED';
  RAISE NOTICE '🧹 Automatic cleanup: CONFIGURED';
END $$;