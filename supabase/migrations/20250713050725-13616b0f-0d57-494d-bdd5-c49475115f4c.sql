-- Create missing foreign key constraints for challenges table
-- Set search path to public schema
SET search_path TO public;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  -- Add foreign key for challenger_id -> profiles(user_id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'challenges_challenger_id_fkey' 
    AND table_name = 'challenges'
  ) THEN
    ALTER TABLE public.challenges 
    ADD CONSTRAINT challenges_challenger_id_fkey 
    FOREIGN KEY (challenger_id) REFERENCES public.profiles(user_id);
    
    RAISE NOTICE 'Added foreign key constraint: challenges_challenger_id_fkey';
  ELSE
    RAISE NOTICE 'Foreign key constraint challenges_challenger_id_fkey already exists';
  END IF;

  -- Add foreign key for opponent_id -> profiles(user_id)  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'challenges_opponent_id_fkey' 
    AND table_name = 'challenges'
  ) THEN
    ALTER TABLE public.challenges 
    ADD CONSTRAINT challenges_opponent_id_fkey 
    FOREIGN KEY (opponent_id) REFERENCES public.profiles(user_id);
    
    RAISE NOTICE 'Added foreign key constraint: challenges_opponent_id_fkey';
  ELSE
    RAISE NOTICE 'Foreign key constraint challenges_opponent_id_fkey already exists';
  END IF;

  -- Add foreign key for club_id -> club_profiles(id) if needed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'challenges_club_id_fkey' 
    AND table_name = 'challenges'
  ) THEN
    ALTER TABLE public.challenges 
    ADD CONSTRAINT challenges_club_id_fkey 
    FOREIGN KEY (club_id) REFERENCES public.club_profiles(id);
    
    RAISE NOTICE 'Added foreign key constraint: challenges_club_id_fkey';
  ELSE
    RAISE NOTICE 'Foreign key constraint challenges_club_id_fkey already exists';
  END IF;

END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';