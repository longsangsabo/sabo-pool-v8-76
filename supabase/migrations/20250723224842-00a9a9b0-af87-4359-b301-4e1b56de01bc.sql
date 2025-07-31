-- Enable real-time for notifications table if not already enabled
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Enable real-time for tournament_matches table if not already enabled  
ALTER TABLE public.tournament_matches REPLICA IDENTITY FULL;

-- Add these tables to the supabase_realtime publication to enable real-time functionality
-- This will allow the application to listen for real-time changes on these tables

-- Check if notifications is already in publication, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- Check if tournament_matches is already in publication, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'tournament_matches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_matches;
  END IF;
END $$;