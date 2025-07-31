-- Add missing notification type to constraint first
ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY[
  'challenge_received'::text, 'challenge_accepted'::text, 'challenge_rejected'::text, 
  'challenge_created'::text, 'challenge_response'::text, 'match_reminder'::text, 
  'match_result_request'::text, 'match_completed'::text, 'rank_verification_approved'::text, 
  'rank_verification_rejected'::text, 'rank_verified_approved'::text, 'rank_verified_rejected'::text, 
  'rank_verification_testing'::text, 'trust_score_warning'::text, 'penalty_received'::text, 
  'club_submitted'::text, 'club_approved'::text, 'club_rejected'::text, 
  'club_registration_pending'::text, 'club_registration_approved'::text, 'club_registration_rejected'::text, 
  'tournament_reminder'::text, 'tournament_registration'::text, 'tournament_bracket_generated'::text,
  'system_update'::text, 'welcome'::text, 'general'::text, 'announcement'::text, 
  'text'::text, 'streak'::text, 'achievement'::text
]));