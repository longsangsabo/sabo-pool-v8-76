-- Update user role to club_owner since they own a club
UPDATE profiles 
SET role = 'club_owner'
WHERE user_id = 'd7d6ce12-490f-4fff-b913-80044de5e169'
AND EXISTS (
  SELECT 1 FROM clubs 
  WHERE owner_id = 'd7d6ce12-490f-4fff-b913-80044de5e169' 
  AND status = 'active'
);