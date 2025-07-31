-- Now safely fix the tournament completion and remove extra match
-- First, mark tournament as completed
UPDATE tournaments 
SET status = 'completed',
    updated_at = NOW()
WHERE id = '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa';

-- Remove the incorrectly created Round 5 match
DELETE FROM tournament_matches 
WHERE tournament_id = '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa' 
AND round_number = 5;