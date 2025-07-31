-- Fix notifications table check constraint to include missing notification types
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add updated check constraint with all required notification types
ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'challenge_received', 'challenge_accepted', 'challenge_rejected',
  'challenge_created', 'challenge_response',
  'match_reminder', 'match_result_request', 'match_completed',
  'rank_verification_approved', 'rank_verification_rejected',
  'rank_verified_approved', 'rank_verified_rejected', 'rank_verification_testing',
  'trust_score_warning', 'penalty_received',
  'club_submitted', 'club_approved', 'club_rejected',
  'club_registration_pending', 'club_registration_approved', 'club_registration_rejected',
  'tournament_reminder', 'tournament_registration',
  'system_update', 'welcome', 'general', 'announcement',
  'text', 'streak', 'achievement'
));