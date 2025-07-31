-- Search for all functions that might contain club_name references
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
WHERE pg_get_functiondef(p.oid) ILIKE '%club_name%'
AND p.proname NOT LIKE 'pg_%'
ORDER BY p.proname;