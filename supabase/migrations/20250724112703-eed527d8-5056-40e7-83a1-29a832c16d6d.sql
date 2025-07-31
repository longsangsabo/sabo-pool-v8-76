-- Drop trigger and dependent functions with CASCADE
DROP TRIGGER IF EXISTS trigger_double_elimination_auto_advance ON tournament_matches CASCADE;
DROP FUNCTION IF EXISTS trigger_double_elimination_advancement() CASCADE;
DROP FUNCTION IF EXISTS trigger_simplified_double_elimination() CASCADE;

-- Now drop the other redundant functions
DROP FUNCTION IF EXISTS create_double_elimination_bracket_simplified(uuid);
DROP FUNCTION IF EXISTS create_double_elimination_bracket_simplified_fixed(uuid);
DROP FUNCTION IF EXISTS create_double_elimination_bracket_v2(uuid);
DROP FUNCTION IF EXISTS create_double_elimination_tournament(uuid);
DROP FUNCTION IF EXISTS advance_simplified_double_elimination(uuid, uuid);
DROP FUNCTION IF EXISTS get_double_elimination_next_winner_match(uuid, integer, integer);
DROP FUNCTION IF EXISTS get_double_elimination_next_loser_match(uuid, integer, integer);
DROP FUNCTION IF EXISTS fix_double_elimination_comprehensive(uuid);
DROP FUNCTION IF EXISTS test_fixed_double_elimination();
DROP FUNCTION IF EXISTS validate_double_elimination_assignments(uuid);

-- Keep only essential functions:
-- generate_double_elimination_bracket_complete (bracket generation)
-- advance_double_elimination_winner_comprehensive (winner advancement) 
-- advance_double_elimination_winner (wrapper for comprehensive)
-- advance_double_elimination_loser (loser handling)
-- submit_double_elimination_score (score submission)
-- get_double_elimination_status (status checking)
-- repair_double_elimination_bracket (repair functionality)
-- trigger_advance_double_elimination_winner (trigger automation)