-- Set SABO Billiards status back to pending for testing approval functionality
UPDATE clubs 
SET status = 'pending'
WHERE id = '391940df-3025-4fe9-872d-2fd99296128a' 
AND name = 'SABO Billiards';