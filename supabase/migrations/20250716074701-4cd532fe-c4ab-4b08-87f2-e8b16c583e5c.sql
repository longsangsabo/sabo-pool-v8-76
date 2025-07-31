-- Check what data exists for tournament sabo1
SELECT 'tournament' as table_name, count(*) as count FROM tournaments WHERE id = '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa'
UNION ALL
SELECT 'registrations' as table_name, count(*) as count FROM tournament_registrations WHERE tournament_id = '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa'  
UNION ALL
SELECT 'results' as table_name, count(*) as count FROM tournament_results WHERE tournament_id = '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa'
UNION ALL  
SELECT 'matches' as table_name, count(*) as count FROM tournament_matches WHERE tournament_id = '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa';