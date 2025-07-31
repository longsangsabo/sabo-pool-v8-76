-- List all triggers and their functions for rank_verifications
SELECT 
    schemaname,
    tablename,
    triggername,
    definition
FROM pg_views 
WHERE schemaname = 'public' 
AND definition ILIKE '%rank_verifications%' 
AND definition ILIKE '%club_name%'

UNION ALL

SELECT 
    'trigger' as schemaname,
    'rank_verifications' as tablename,
    t.tgname as triggername,
    pg_get_triggerdef(t.oid) as definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'rank_verifications'
AND t.tgisinternal = false;