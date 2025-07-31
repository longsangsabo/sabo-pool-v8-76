-- Look for any functions that might be causing the tournament_id error
-- Check process_tournament_results function since it was mentioned in the schema

-- View the process_tournament_results function to see if it has tournament_id references
SELECT p.proname, p.prosrc 
FROM pg_proc p 
JOIN pg_namespace n ON n.oid = p.pronamespace 
WHERE n.nspname = 'public' 
AND p.proname LIKE '%tournament%';