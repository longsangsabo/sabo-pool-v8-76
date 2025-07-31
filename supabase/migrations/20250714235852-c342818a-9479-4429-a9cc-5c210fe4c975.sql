-- Check for triggers on tournaments table with correct column names
SELECT t.tgname as trigger_name, 
       p.proname as function_name,
       c.relname as table_name
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_proc p ON p.oid = t.tgfoid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'tournaments' 
AND n.nspname = 'public'
AND NOT t.tgisinternal;