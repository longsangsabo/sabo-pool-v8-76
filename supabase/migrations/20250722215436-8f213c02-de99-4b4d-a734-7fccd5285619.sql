-- Enable realtime for tournament_matches if not already enabled
ALTER TABLE IF EXISTS public.tournament_matches REPLICA IDENTITY FULL;

-- Add tournament_matches to realtime publication if not already added
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