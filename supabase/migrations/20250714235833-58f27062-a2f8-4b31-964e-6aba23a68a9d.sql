-- Check and fix any triggers or functions that might be causing the tournament_id error
-- Look for triggers on tournaments table that might be referencing wrong field names

-- First, let's see what triggers exist on tournaments table
SELECT schemaname, tablename, triggername, tgfoid::regproc as function_name 
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'tournaments' AND n.nspname = 'public';