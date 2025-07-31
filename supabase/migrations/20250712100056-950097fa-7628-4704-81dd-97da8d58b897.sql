-- Complete player_id to user_id cleanup migration

-- 1. Update rank_reports table (if not already done)
ALTER TABLE public.rank_reports 
DROP CONSTRAINT IF EXISTS rank_reports_reported_player_id_fkey;

-- Rename the column if it still exists as player_id
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'rank_reports' 
               AND column_name = 'reported_player_id') THEN
        ALTER TABLE public.rank_reports 
        RENAME COLUMN reported_player_id TO reported_user_id;
    END IF;
END $$;

-- Add proper foreign key constraint
ALTER TABLE public.rank_reports 
ADD CONSTRAINT rank_reports_reported_user_id_fkey 
FOREIGN KEY (reported_user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- 2. Update any remaining tournament_registrations foreign key names
ALTER TABLE public.tournament_registrations 
DROP CONSTRAINT IF EXISTS tournament_registrations_player_id_fkey;

-- Ensure proper constraint name
ALTER TABLE public.tournament_registrations 
ADD CONSTRAINT tournament_registrations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- 3. Update all database function parameters from p_player_id to p_user_id
-- Update get_available_demo_users function
DROP FUNCTION IF EXISTS public.get_available_demo_users(integer);
CREATE OR REPLACE FUNCTION public.get_available_demo_users(needed_count integer)
RETURNS TABLE(user_id uuid, full_name text, display_name text, skill_level text, elo integer, spa_points integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, 
    p.full_name, 
    p.display_name, 
    p.skill_level, 
    COALESCE(pr.elo_points, 1000),
    COALESCE(pr.spa_points, 50)
  FROM public.profiles p
  LEFT JOIN public.demo_user_pool dup ON dup.user_id = p.id
  LEFT JOIN public.player_rankings pr ON pr.player_id = p.id
  WHERE p.is_demo_user = true
  AND (dup.is_available = true OR dup.is_available IS NULL)
  ORDER BY COALESCE(pr.elo_points, 1000) DESC
  LIMIT needed_count;
END;
$function$;

-- 4. Update check_rank_promotion function (if it exists)
CREATE OR REPLACE FUNCTION public.check_rank_promotion(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    current_ranking RECORD;
    next_rank RECORD;
    verification_count INTEGER;
    min_verifications INTEGER := 3;
BEGIN
    -- Get current player ranking
    SELECT pr.*, r.level as current_level, r.code as current_code
    INTO current_ranking
    FROM public.player_rankings pr
    JOIN public.ranks r ON pr.current_rank_id = r.id
    WHERE pr.player_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if player meets basic promotion criteria
    IF current_ranking.elo < 1000 OR current_ranking.total_matches < 10 THEN
        RETURN FALSE;
    END IF;
    
    -- Get next rank
    SELECT * INTO next_rank 
    FROM public.ranks 
    WHERE level = current_ranking.current_level + 1 
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN FALSE; -- Already at highest rank
    END IF;
    
    -- Check verification count for higher ranks
    IF next_rank.level >= 3 THEN
        SELECT COUNT(*) INTO verification_count
        FROM public.match_results mr
        WHERE (mr.player1_id = p_user_id OR mr.player2_id = p_user_id)
        AND mr.result_status = 'verified'
        AND mr.created_at >= NOW() - INTERVAL '30 days';
        
        IF verification_count < min_verifications THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    -- Promote player
    UPDATE public.player_rankings
    SET current_rank_id = next_rank.id,
        updated_at = NOW()
    WHERE player_id = p_user_id;
    
    -- Log promotion
    INSERT INTO public.ranking_history (
        player_id, old_rank_id, new_rank_id, 
        promotion_type, total_points_earned
    ) VALUES (
        p_user_id, current_ranking.current_rank_id, next_rank.id,
        'automatic', 1.0
    );
    
    RETURN TRUE;
END;
$function$;

-- 5. Create detection functions for any remaining player_id references
CREATE OR REPLACE FUNCTION public.detect_player_id_columns()
RETURNS TABLE(table_name text, column_name text, data_type text)
LANGUAGE sql
SECURITY DEFINER
AS $function$
SELECT 
    t.table_name::text,
    c.column_name::text,
    c.data_type::text
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND c.column_name LIKE '%player_id%'
ORDER BY t.table_name, c.column_name;
$function$;

CREATE OR REPLACE FUNCTION public.detect_player_id_foreign_keys()
RETURNS TABLE(table_name text, constraint_name text, column_name text, foreign_table text, foreign_column text)
LANGUAGE sql
SECURITY DEFINER
AS $function$
SELECT 
    tc.table_name::text,
    tc.constraint_name::text,
    kcu.column_name::text,
    ccu.table_name::text as foreign_table,
    ccu.column_name::text as foreign_column
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND kcu.column_name LIKE '%player_id%';
$function$;

CREATE OR REPLACE FUNCTION public.detect_player_id_in_functions()
RETURNS TABLE(function_name text, function_definition text, parameter_names text[])
LANGUAGE sql
SECURITY DEFINER
AS $function$
SELECT 
    r.routine_name::text,
    r.routine_definition::text,
    ARRAY(
        SELECT p.parameter_name
        FROM information_schema.parameters p
        WHERE p.specific_name = r.specific_name
        AND p.parameter_name LIKE '%player_id%'
    ) as parameter_names
FROM information_schema.routines r
WHERE r.routine_schema = 'public'
AND (r.routine_definition LIKE '%player_id%' 
     OR EXISTS (
         SELECT 1 FROM information_schema.parameters p
         WHERE p.specific_name = r.specific_name
         AND p.parameter_name LIKE '%player_id%'
     ));
$function$;

-- 6. Update indexes that might reference player_id
DO $$
DECLARE
    idx_record RECORD;
BEGIN
    -- Find and recreate indexes with player_id references
    FOR idx_record IN 
        SELECT indexname, tablename, indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexdef LIKE '%player_id%'
    LOOP
        -- Drop old index
        EXECUTE 'DROP INDEX IF EXISTS public.' || idx_record.indexname;
        
        -- Recreate with user_id (simple string replacement for this migration)
        EXECUTE REPLACE(idx_record.indexdef, 'player_id', 'user_id');
    END LOOP;
END $$;