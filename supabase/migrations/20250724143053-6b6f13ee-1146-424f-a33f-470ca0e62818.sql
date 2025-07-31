-- Clean up duplicate/incorrect Loser's Branch A matches
-- Delete matches 22, 23, 25 which have incorrect data and are duplicates
DELETE FROM tournament_matches 
WHERE id IN (
  SELECT id FROM tournament_matches 
  WHERE tournament_id = (
    SELECT id FROM tournaments 
    WHERE name ILIKE '%Development Test%' 
    ORDER BY created_at DESC 
    LIMIT 1
  )
  AND match_number IN (22, 23, 25)
  AND bracket_type = 'losers'
);

-- Log the cleanup
INSERT INTO tournament_automation_log (
  tournament_id,
  automation_type,
  status,
  details,
  completed_at
) VALUES (
  (SELECT id FROM tournaments WHERE name ILIKE '%Development Test%' ORDER BY created_at DESC LIMIT 1),
  'bracket_cleanup',
  'completed',
  jsonb_build_object(
    'action', 'deleted_duplicate_losers_matches',
    'deleted_matches', ARRAY[22, 23, 25],
    'reason', 'Cleanup duplicate/incorrect Loser Branch A matches'
  ),
  NOW()
);