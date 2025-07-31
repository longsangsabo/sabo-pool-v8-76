-- Step 1: Fix display_name NULL issues
UPDATE public.profiles 
SET display_name = full_name, 
    updated_at = NOW()
WHERE display_name IS NULL 
  AND full_name IS NOT NULL;

-- Step 2: Delete incorrect matches from hong1 tournament
DELETE FROM public.tournament_matches 
WHERE tournament_id = '4847643a-316a-428b-9ac5-6f20e13d2ab3'
  AND (bracket_type IS NULL OR round_number > 3);

-- Step 3: Add constraint to prevent bracket_type NULL in future
ALTER TABLE public.tournament_matches 
ADD CONSTRAINT tournament_matches_bracket_type_not_null 
CHECK (bracket_type IS NOT NULL);

-- Step 4: Add constraint for valid bracket types
ALTER TABLE public.tournament_matches 
ADD CONSTRAINT tournament_matches_valid_bracket_type 
CHECK (bracket_type IN ('winner', 'loser', 'final', 'third_place'));

-- Step 5: Fix any existing matches with empty bracket_type
UPDATE public.tournament_matches 
SET bracket_type = CASE 
  WHEN round_number <= 3 AND bracket_type IS NULL THEN 'winner'
  ELSE bracket_type 
END
WHERE tournament_id = '4847643a-316a-428b-9ac5-6f20e13d2ab3'
  AND bracket_type IS NULL;