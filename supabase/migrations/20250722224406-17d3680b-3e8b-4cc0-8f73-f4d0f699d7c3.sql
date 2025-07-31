
-- Fix tournament 12345 issues: match status consistency and progression
-- 1. Fix matches that have winners but incorrect status
UPDATE tournament_matches 
SET status = 'completed',
    updated_at = NOW()
WHERE tournament_id = (
  SELECT id FROM tournaments WHERE name ILIKE '%12345%' LIMIT 1
)
AND winner_id IS NOT NULL 
AND status != 'completed';

-- 2. Fix any progression issues by advancing completed match winners
DO $$
DECLARE
  tournament_uuid UUID;
  completed_match RECORD;
BEGIN
  -- Get tournament ID
  SELECT id INTO tournament_uuid 
  FROM tournaments 
  WHERE name ILIKE '%12345%' 
  LIMIT 1;
  
  -- Process each completed match that needs advancement
  FOR completed_match IN 
    SELECT id, winner_id, round_number, match_number
    FROM tournament_matches
    WHERE tournament_id = tournament_uuid
    AND status = 'completed'
    AND winner_id IS NOT NULL
    ORDER BY round_number, match_number
  LOOP
    -- Use the enhanced advancement function
    PERFORM advance_winner_to_next_round_enhanced(completed_match.id, true);
    RAISE NOTICE 'Advanced winner % from match %', completed_match.winner_id, completed_match.id;
  END LOOP;
END $$;

-- 3. Clean up any orphaned automation logs for better monitoring
DELETE FROM tournament_automation_log 
WHERE tournament_id = (
  SELECT id FROM tournaments WHERE name ILIKE '%12345%' LIMIT 1
)
AND created_at < NOW() - INTERVAL '1 hour';

-- 4. Reset any stuck tournament status if needed
UPDATE tournaments 
SET updated_at = NOW()
WHERE name ILIKE '%12345%'
AND status = 'ongoing';
