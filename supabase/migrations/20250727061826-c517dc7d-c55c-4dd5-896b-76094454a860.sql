-- Step 1: Fix display_name NULL issues
UPDATE public.profiles 
SET display_name = full_name, 
    updated_at = NOW()
WHERE display_name IS NULL 
  AND full_name IS NOT NULL;

-- Step 2: Standardize bracket_type values
UPDATE public.tournament_matches 
SET bracket_type = CASE 
  WHEN bracket_type IS NULL THEN 'winner'
  WHEN bracket_type = 'winners' THEN 'winner'
  WHEN bracket_type = 'losers' THEN 'loser'
  WHEN bracket_type = 'grand_final' THEN 'final'
  WHEN bracket_type = 'semifinal' THEN 'winner'
  WHEN bracket_type = 'single_elimination' THEN 'winner'
  ELSE bracket_type
END;

-- Step 3: Delete incorrect matches from hong1 tournament (round > 3)
DELETE FROM public.tournament_matches 
WHERE tournament_id = '4847643a-316a-428b-9ac5-6f20e13d2ab3'
  AND round_number > 3;

-- Step 4: Now repair the double elimination bracket for hong1
SELECT public.repair_double_elimination_bracket('4847643a-316a-428b-9ac5-6f20e13d2ab3');