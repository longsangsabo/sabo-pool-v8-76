-- Step 1: Fix display_name NULL issues
UPDATE public.profiles 
SET display_name = full_name, 
    updated_at = NOW()
WHERE display_name IS NULL 
  AND full_name IS NOT NULL;

-- Step 2: Fix existing matches with NULL bracket_type first
UPDATE public.tournament_matches 
SET bracket_type = 'winner'
WHERE bracket_type IS NULL;

-- Step 3: Delete incorrect matches from hong1 tournament (round > 3)
DELETE FROM public.tournament_matches 
WHERE tournament_id = '4847643a-316a-428b-9ac5-6f20e13d2ab3'
  AND round_number > 3;

-- Step 4: Now we can safely add the constraint
ALTER TABLE public.tournament_matches 
ADD CONSTRAINT tournament_matches_bracket_type_not_null 
CHECK (bracket_type IS NOT NULL);

-- Step 5: Add constraint for valid bracket types  
ALTER TABLE public.tournament_matches 
ADD CONSTRAINT tournament_matches_valid_bracket_type 
CHECK (bracket_type IN ('winner', 'loser', 'final', 'third_place'));