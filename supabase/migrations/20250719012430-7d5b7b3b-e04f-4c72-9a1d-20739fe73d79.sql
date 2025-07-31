-- Drop existing constraint and create new one properly
ALTER TABLE tournament_matches DROP CONSTRAINT IF EXISTS tournament_matches_unique_bracket_round_match;

-- Create unique constraint that treats NULL branch_type as distinct values
-- This allows multiple NULL branch_types in the same bracket_type/round/match combination
CREATE UNIQUE INDEX tournament_matches_unique_bracket_round_match 
ON tournament_matches (tournament_id, bracket_type, branch_type, round_number, match_number);