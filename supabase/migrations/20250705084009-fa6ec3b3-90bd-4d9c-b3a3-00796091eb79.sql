-- Fix notifications table schema issues

-- First, drop problematic constraints
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_sender_id_fkey;

ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add sender_id column if it doesn't exist
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS sender_id UUID;

-- Add a more flexible check constraint for notification types
ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'challenge_received', 'challenge_accepted', 'challenge_rejected',
  'challenge_created', 'challenge_response',
  'match_reminder', 'match_result_request', 'match_completed',
  'rank_verification_approved', 'rank_verification_rejected',
  'trust_score_warning', 'penalty_received',
  'club_submitted', 'club_approved', 'club_rejected',
  'club_registration_pending', 'club_registration_approved', 'club_registration_rejected',
  'tournament_reminder', 'tournament_registration',
  'system_update', 'welcome', 'general', 'announcement',
  'text', 'streak', 'achievement'
));

-- Add foreign key constraint for sender_id if needed (optional)
ALTER TABLE notifications
ADD CONSTRAINT notifications_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES profiles(user_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);