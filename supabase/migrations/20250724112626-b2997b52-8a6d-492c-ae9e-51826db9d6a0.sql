-- Consolidate double elimination functions - keep only essential ones
-- Drop redundant bracket generation functions
DROP FUNCTION IF EXISTS create_double_elimination_bracket_simplified(uuid);
DROP FUNCTION IF EXISTS create_double_elimination_bracket_simplified_fixed(uuid);
DROP FUNCTION IF EXISTS create_double_elimination_bracket_v2(uuid);
DROP FUNCTION IF EXISTS create_double_elimination_tournament(uuid);

-- Drop redundant advancement functions
DROP FUNCTION IF EXISTS advance_simplified_double_elimination(uuid, uuid);
DROP FUNCTION IF EXISTS get_double_elimination_next_winner_match(uuid, integer, integer);
DROP FUNCTION IF EXISTS get_double_elimination_next_loser_match(uuid, integer, integer);

-- Drop redundant repair and test functions
DROP FUNCTION IF EXISTS fix_double_elimination_comprehensive(uuid);
DROP FUNCTION IF EXISTS test_fixed_double_elimination();

-- Drop redundant validation functions
DROP FUNCTION IF EXISTS validate_double_elimination_assignments(uuid);

-- Drop redundant trigger functions
DROP FUNCTION IF EXISTS trigger_double_elimination_advancement();
DROP FUNCTION IF EXISTS trigger_simplified_double_elimination();

-- Keep these essential functions:
-- generate_double_elimination_bracket_complete (bracket generation)
-- advance_double_elimination_winner_comprehensive (winner advancement) 
-- advance_double_elimination_winner (wrapper for comprehensive)
-- advance_double_elimination_loser (loser handling)
-- submit_double_elimination_score (score submission)
-- get_double_elimination_status (status checking)
-- repair_double_elimination_bracket (repair functionality)
-- trigger_advance_double_elimination_winner (trigger automation)