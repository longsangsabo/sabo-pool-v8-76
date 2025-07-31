-- Clear current_match_id from tables where the match doesn't have assigned_table_id pointing back to them
UPDATE public.club_tables 
SET current_match_id = NULL,
    status = 'available',
    updated_at = NOW()
WHERE current_match_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM tournament_matches tm 
  WHERE tm.id = club_tables.current_match_id 
  AND tm.assigned_table_id = club_tables.id
);

-- Also ensure any completed/cancelled matches release their tables
UPDATE public.club_tables 
SET current_match_id = NULL,
    status = 'available', 
    updated_at = NOW()
WHERE current_match_id IN (
  SELECT tm.id FROM tournament_matches tm 
  WHERE tm.status IN ('completed', 'cancelled')
);