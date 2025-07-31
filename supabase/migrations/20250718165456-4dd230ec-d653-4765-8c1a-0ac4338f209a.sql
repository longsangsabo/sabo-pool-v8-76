-- Clean up the duplicate/broken final match and complete tournament
DELETE FROM tournament_matches 
WHERE id = '341d5a75-92d5-4bbd-9110-37b3f0259793'
AND tournament_id = '917c205b-ac34-4dc1-b84a-6477a562913b'
AND status = 'pending'
AND player2_id IS NULL;

-- Update tournament status to completed to trigger results processing
UPDATE tournaments 
SET status = 'completed',
    updated_at = now()
WHERE id = '917c205b-ac34-4dc1-b84a-6477a562913b'
AND status = 'registration_open';