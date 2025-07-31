-- Clean up duplicate/incorrect Loser's Branch A matches
-- Delete matches 22, 23, 25 which have incorrect data and are duplicates
-- Using direct tournament_id instead of lookup

DELETE FROM tournament_matches 
WHERE match_number IN (22, 23, 25)
  AND bracket_type = 'losers'
  AND tournament_id IN (
    SELECT id FROM tournaments 
    WHERE name ILIKE '%test%' 
    AND created_at > NOW() - INTERVAL '7 days'
  );