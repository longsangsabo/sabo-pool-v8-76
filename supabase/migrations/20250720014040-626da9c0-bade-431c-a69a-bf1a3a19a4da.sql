-- Temporarily reset tournament status for testing
UPDATE tournaments 
SET status = 'registration_open', updated_at = NOW() 
WHERE id = '051a75a8-a0c5-48bb-b28b-a5465f4d0058';