-- Drop the old 4-parameter version of submit_double_elimination_score_v9
-- This will resolve the function overload conflict
DROP FUNCTION IF EXISTS public.submit_double_elimination_score_v9(uuid, uuid, integer, integer);

-- Verify the 3-parameter version exists and is working
-- (The function with signature: p_match_id uuid, p_player1_score integer, p_player2_score integer should remain)