-- Drop obsolete tournament advancement functions that reference deleted functions
DROP FUNCTION IF EXISTS advance_double_elimination_v9(uuid);
DROP FUNCTION IF EXISTS advance_simplified_double_elimination(uuid);  
DROP FUNCTION IF EXISTS advance_tournament_like_double1(uuid, uuid, uuid);

-- These functions are no longer needed as we now use sabo_tournament_coordinator
-- for all SABO tournament advancement logic