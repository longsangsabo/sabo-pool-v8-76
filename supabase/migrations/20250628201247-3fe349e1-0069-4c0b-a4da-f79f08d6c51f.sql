
-- First, let's create the updated user_profiles structure
-- Since we already have a 'profiles' table, we'll alter it to match your schema

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS total_matches INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS win_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;

-- Update existing columns to match your schema
ALTER TABLE public.profiles 
ALTER COLUMN ranking_points SET DEFAULT 1000,
ALTER COLUMN current_rank SET DEFAULT 'K1';

-- Rename ranking to match your schema (if needed)
-- ALTER TABLE public.profiles RENAME COLUMN current_rank TO ranking;

-- Update clubs table to match your schema
ALTER TABLE public.clubs 
ADD COLUMN IF NOT EXISTS is_sabo_owned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS monthly_payment DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS opening_hours JSONB,
ADD COLUMN IF NOT EXISTS available_tables INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Update challenges table to match your schema
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS proposed_club_id UUID REFERENCES public.clubs(id),
ADD COLUMN IF NOT EXISTS proposed_datetime TIMESTAMP,
ADD COLUMN IF NOT EXISTS confirmed_club_id UUID REFERENCES public.clubs(id),
ADD COLUMN IF NOT EXISTS confirmed_datetime TIMESTAMP,
ADD COLUMN IF NOT EXISTS challenger_score INTEGER,
ADD COLUMN IF NOT EXISTS challenged_score INTEGER;

-- Update club_bookings table to match your schema
ALTER TABLE public.club_bookings 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 120,
ADD COLUMN IF NOT EXISTS table_number INTEGER,
ADD COLUMN IF NOT EXISTS booking_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS club_notified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS players_notified BOOLEAN DEFAULT FALSE;

-- Update notifications table to match your schema
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS challenge_id UUID REFERENCES public.challenges(id),
ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES public.clubs(id),
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Create function to calculate club priority score
CREATE OR REPLACE FUNCTION public.calculate_club_priority(club_row clubs, user_lat DECIMAL DEFAULT NULL, user_lng DECIMAL DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  score INTEGER := 0;
  distance DECIMAL;
BEGIN
  -- SABO owned clubs get highest priority
  IF club_row.is_sabo_owned THEN
    score := score + 1000;
  END IF;
  
  -- Monthly payment amount (normalized to 0-500 points)
  score := score + LEAST(club_row.monthly_payment::INTEGER / 10, 500);
  
  -- Distance calculation (if coordinates provided)
  IF user_lat IS NOT NULL AND user_lng IS NOT NULL AND 
     club_row.latitude IS NOT NULL AND club_row.longitude IS NOT NULL THEN
    distance := SQRT(
      POWER(club_row.latitude - user_lat, 2) + 
      POWER(club_row.longitude - user_lng, 2)
    ) * 111; -- Rough km conversion
    score := score + GREATEST(0, 100 - distance::INTEGER);
  END IF;
  
  -- Available tables
  score := score + (club_row.available_tables * 2);
  
  RETURN score;
END;
$$;

-- Update priority scores for existing clubs
UPDATE public.clubs 
SET priority_score = public.calculate_club_priority(clubs.*) 
WHERE priority_score = 0;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_challenges_challenger_id ON public.challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenged_id ON public.challenges(challenged_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON public.challenges(status);
CREATE INDEX IF NOT EXISTS idx_club_bookings_club_id ON public.club_bookings(club_id);
CREATE INDEX IF NOT EXISTS idx_club_bookings_challenge_id ON public.club_bookings(challenge_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_clubs_priority_score ON public.clubs(priority_score);
CREATE INDEX IF NOT EXISTS idx_clubs_is_sabo_owned ON public.clubs(is_sabo_owned);
