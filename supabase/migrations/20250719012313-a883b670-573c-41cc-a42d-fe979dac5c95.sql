-- Check current constraint
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'tournament_matches_unique_bracket_round_match';