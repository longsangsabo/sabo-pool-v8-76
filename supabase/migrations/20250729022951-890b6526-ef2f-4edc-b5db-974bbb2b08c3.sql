-- Phase 4: Database function cleanup - Fix function ambiguity and log correctly
-- Drop the specific old signatures
DROP FUNCTION IF EXISTS public.submit_double_elimination_score(p_match_id uuid, p_player1_score integer, p_player2_score integer) CASCADE;
DROP FUNCTION IF EXISTS public.submit_double_elimination_score(uuid, integer, integer, uuid) CASCADE;

-- Now try to add comment to the remaining function
DO $$
BEGIN
    -- Try to comment on the function if it exists
    PERFORM 1 FROM information_schema.routines 
    WHERE routine_name = 'submit_double_elimination_score' 
    AND routine_schema = 'public';
    
    IF FOUND THEN
        EXECUTE 'COMMENT ON FUNCTION public.submit_double_elimination_score IS ''Unified double elimination score submission with comprehensive advancement logic''';
    END IF;
END $$;