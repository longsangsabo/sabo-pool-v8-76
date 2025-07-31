-- Update tournament status to completed properly
UPDATE tournaments 
SET status = 'completed',
    updated_at = now()
WHERE id = '917c205b-ac34-4dc1-b84a-6477a562913b';