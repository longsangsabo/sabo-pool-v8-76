-- Add the missing unique constraint that failed before
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'rank_verifications' 
    AND constraint_name = 'unique_user_club_verification'
  ) THEN
    -- Add the unique constraint
    ALTER TABLE public.rank_verifications 
    ADD CONSTRAINT unique_user_club_verification 
    UNIQUE (user_id, club_id);
    
    RAISE NOTICE 'Added unique constraint to rank_verifications table';
  ELSE
    RAISE NOTICE 'Unique constraint already exists on rank_verifications table';
  END IF;
END $$;