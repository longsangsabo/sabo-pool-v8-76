-- First, let's check what types are currently in the notifications table
SELECT DISTINCT type FROM notifications;

-- Drop the constraint completely
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add a more permissive constraint that allows existing data
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
  'system_maintenance',
  'match_update',
  'elo_update',
  'general'
));