-- Check all versions of the function
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'create_double_elimination_bracket_v2';