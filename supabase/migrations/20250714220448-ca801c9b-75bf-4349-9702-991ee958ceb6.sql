-- First check what triggers exist on tournaments table that might be causing the issue
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'tournaments';