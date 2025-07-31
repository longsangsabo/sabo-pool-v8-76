-- Check all triggers on rank_verifications table
SELECT 
    t.tgname AS trigger_name,
    p.proname AS function_name,
    t.tgenabled,
    pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'rank_verifications'
AND t.tgisinternal = false;