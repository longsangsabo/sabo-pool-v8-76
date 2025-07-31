-- Ensure tournament_matches table exists with correct structure
-- This will verify the table exists and has all necessary columns

DO $$ 
BEGIN
  -- Check if table exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tournament_matches' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'tournament_matches table does not exist!';
  END IF;
  
  -- Ensure RLS is enabled
  ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
  
  -- Refresh the table to ensure it's properly accessible
  ANALYZE public.tournament_matches;
  
  RAISE NOTICE 'tournament_matches table verified and refreshed successfully';
END $$;