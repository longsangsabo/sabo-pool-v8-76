-- Check what triggers exist on rank_verifications table
SELECT 
    trigger_name,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'rank_verifications'
AND trigger_schema = 'public';