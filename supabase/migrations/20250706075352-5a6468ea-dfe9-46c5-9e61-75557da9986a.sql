-- Check for triggers on rank_verifications table that might cause the ambiguous column reference
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.action_timing,
    t.action_statement,
    p.prosrc as function_body
FROM information_schema.triggers t
LEFT JOIN pg_proc p ON p.proname = REPLACE(t.action_statement, 'EXECUTE FUNCTION ', '')
                    OR p.proname = REPLACE(REPLACE(t.action_statement, 'EXECUTE PROCEDURE ', ''), '()', '')
WHERE t.event_object_table = 'rank_verifications'
ORDER BY t.trigger_name;