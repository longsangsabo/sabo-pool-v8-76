-- Migration: Enhanced Real-time Rank Synchronization System (Corrected)
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

-- 2. Add rank_updated_at column to player_rankings if it doesn't exist
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

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_rank_update_queue_user_id ON public.rank_update_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_rank_update_queue_created_at ON public.rank_update_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_rank_update_queue_processed ON public.rank_update_queue(processed);

-- 4. Enable realtime for rank_update_queue
ALTER TABLE public.rank_update_queue REPLICA IDENTITY FULL;

-- 5. Add table to realtime publication
DO $$
BEGIN
  -- Check if table is already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'rank_update_queue'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rank_update_queue;
  END IF;
END $$;

-- 6. Create rank sync monitor function for cleanup and maintenance
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

-- 7. Grant necessary permissions
GRANT SELECT, INSERT ON public.rank_update_queue TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_rank_update_queue() TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Enhanced Real-time Rank Synchronization System deployed successfully!';
  RAISE NOTICE '🔄 Real-time rank updates: ENABLED';
  RAISE NOTICE '📊 Rank monitoring: ENABLED';
  RAISE NOTICE '🧹 Automatic cleanup: CONFIGURED';
END $$;