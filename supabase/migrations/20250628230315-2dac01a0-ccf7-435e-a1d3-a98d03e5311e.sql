
-- Update club_bookings table to match the exact schema provided
ALTER TABLE public.club_bookings 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 120,
ADD COLUMN IF NOT EXISTS table_number INTEGER,
ADD COLUMN IF NOT EXISTS booking_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS club_notified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS players_notified BOOLEAN DEFAULT FALSE;

-- Update notifications table to match the exact schema provided
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS challenge_id UUID REFERENCES public.challenges(id),
ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES public.clubs(id),
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Add indexes for better performance on the new columns
CREATE INDEX IF NOT EXISTS idx_club_bookings_duration ON public.club_bookings(duration_minutes);
CREATE INDEX IF NOT EXISTS idx_club_bookings_table_number ON public.club_bookings(table_number);
CREATE INDEX IF NOT EXISTS idx_club_bookings_club_notified ON public.club_bookings(club_notified);
CREATE INDEX IF NOT EXISTS idx_club_bookings_players_notified ON public.club_bookings(players_notified);

CREATE INDEX IF NOT EXISTS idx_notifications_challenge_id ON public.notifications(challenge_id);
CREATE INDEX IF NOT EXISTS idx_notifications_club_id ON public.notifications(club_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Ensure the foreign key references are correct for user_id in notifications
-- (Note: The current notifications table references profiles via user_id, which should work)
