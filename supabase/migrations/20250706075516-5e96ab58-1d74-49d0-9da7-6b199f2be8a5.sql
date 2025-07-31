-- Find all functions that might contain ambiguous club_name references
-- by searching in the function definitions
SELECT 
    p.proname as function_name,
    p.prosrc as function_body
FROM pg_proc p
WHERE p.prosrc ILIKE '%club_name%'
AND p.proname NOT LIKE 'pg_%'
AND p.proname NOT LIKE 'array_%'
ORDER BY p.proname;