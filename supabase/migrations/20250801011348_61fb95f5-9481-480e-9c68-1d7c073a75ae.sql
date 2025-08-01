-- Drop the existing constraint and recreate with correct values
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the updated constraint that includes 'challenge_joined'
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'info', 
  'success', 
  'warning', 
  'error', 
  'tournament_update', 
  'match_result', 
  'challenge_received', 
  'challenge_accepted', 
  'challenge_declined', 
  'challenge_completed',
  'challenge_joined',
  'rank_promotion',
  'spa_reward',
  'system_maintenance'
));