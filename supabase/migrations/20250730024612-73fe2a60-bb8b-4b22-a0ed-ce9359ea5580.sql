-- Drop old and conflicting functions to keep only the latest working version
DROP FUNCTION IF EXISTS public.submit_double_elimination_score(uuid, uuid, integer, integer);
DROP FUNCTION IF EXISTS public.submit_double_elimination_score_v9(uuid, uuid, integer, integer);
DROP FUNCTION IF EXISTS public.submit_match_score(uuid, uuid, integer, integer);
DROP FUNCTION IF EXISTS public.submit_sabo_match_score(uuid, integer, integer);

-- Keep only the latest working function:
-- public.submit_sabo_match_score(p_match_id uuid, p_player1_score integer, p_player2_score integer, p_submitted_by uuid)
-- This function should already exist and return TABLE format