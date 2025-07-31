-- PHASE 5: FIX REMAINING DUPLICATES AND VERIFY SYSTEM
-- Fix the duplicate matches that still exist

-- Fix match 142fd01b-2a32-4d68-b23a-9da151371e83 (Losers R102 M2)
UPDATE tournament_matches 
SET player1_id = NULL, player2_id = NULL, status = 'pending'
WHERE id = '142fd01b-2a32-4d68-b23a-9da151371e83';

-- Fix match c92e95b9-2a44-4def-afb0-95e47109edfb (Losers R103 M1)  
UPDATE tournament_matches
SET player1_id = NULL, player2_id = NULL, status = 'pending'
WHERE id = 'c92e95b9-2a44-4def-afb0-95e47109edfb';

-- Now re-run advancement to populate these correctly
SELECT advance_sabo_tournament_fixed('2a6c88fe-07ec-4d29-bbf4-cc829439a7f8', NULL, NULL);

-- Add function comments to identify updated functions
COMMENT ON FUNCTION advance_sabo_tournament_fixed IS 'UPDATED: Uses double1_advancement_rules table for all advancement logic';
COMMENT ON FUNCTION advance_tournament_like_double1 IS 'UPDATED: Redirects to advance_sabo_tournament_fixed which uses rules table';
COMMENT ON FUNCTION advance_simplified_double_elimination IS 'UPDATED: Uses advance_sabo_tournament_fixed with rules table';
COMMENT ON FUNCTION submit_match_score IS 'UPDATED: Uses advance_sabo_tournament_fixed with rules table';