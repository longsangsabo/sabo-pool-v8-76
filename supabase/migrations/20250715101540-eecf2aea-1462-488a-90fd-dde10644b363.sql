-- Fix data inconsistency: Reset assigned_table_number for matches without assigned_table_id
UPDATE public.tournament_matches 
SET assigned_table_number = NULL, updated_at = NOW()
WHERE assigned_table_number IS NOT NULL 
AND assigned_table_id IS NULL;

-- Ensure all tables are properly released if they don't have current_match_id
UPDATE public.club_tables 
SET status = 'available', updated_at = NOW()
WHERE status = 'occupied' 
AND current_match_id IS NULL;