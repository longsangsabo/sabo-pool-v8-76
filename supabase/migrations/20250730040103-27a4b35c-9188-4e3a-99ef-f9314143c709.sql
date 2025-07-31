-- Enable realtime for tournament_matches table to ensure real-time updates work
ALTER TABLE tournament_matches REPLICA IDENTITY FULL;

-- Add tournament_matches to realtime publication if not already added
-- This ensures real-time subscriptions work properly
SELECT publication_tables.tablename 
FROM pg_publication_tables publication_tables 
WHERE publication_tables.pubname = 'supabase_realtime' 
AND publication_tables.tablename = 'tournament_matches';

-- Add the table to realtime if it's not already there
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'tournament_matches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tournament_matches;
    RAISE NOTICE 'Added tournament_matches to realtime publication';
  ELSE
    RAISE NOTICE 'tournament_matches already in realtime publication';
  END IF;
END $$;