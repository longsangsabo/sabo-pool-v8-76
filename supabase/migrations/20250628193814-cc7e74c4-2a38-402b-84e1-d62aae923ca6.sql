
-- Update user profiles table with gaming preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_play_times TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS min_bet_points INTEGER DEFAULT 10;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_bet_points INTEGER DEFAULT 100;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_club_id UUID REFERENCES clubs(id);

-- Update clubs table for priority system
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS is_sabo_owned BOOLEAN DEFAULT FALSE;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS monthly_payment DECIMAL(10,2) DEFAULT 0;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS opening_hours JSONB;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS available_tables INTEGER DEFAULT 10;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Create enhanced challenges table
DROP TABLE IF EXISTS challenges CASCADE;
CREATE TABLE challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id UUID REFERENCES profiles(user_id) NOT NULL,
  challenged_id UUID REFERENCES profiles(user_id) NOT NULL,
  
  -- Challenge Details
  bet_points INTEGER NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'completed', 'cancelled'
  
  -- Match Details (after acceptance)
  proposed_club_id UUID REFERENCES clubs(id),
  proposed_datetime TIMESTAMP,
  confirmed_club_id UUID REFERENCES clubs(id),
  confirmed_datetime TIMESTAMP,
  
  -- Results (after completion)
  winner_id UUID REFERENCES profiles(user_id),
  challenger_score INTEGER,
  challenged_score INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create club bookings table
CREATE TABLE club_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES clubs(id) NOT NULL,
  challenge_id UUID REFERENCES challenges(id) NOT NULL,
  
  -- Booking Details
  booking_datetime TIMESTAMP NOT NULL,
  duration_minutes INTEGER DEFAULT 120,
  table_number INTEGER,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
  booking_fee DECIMAL(10,2) DEFAULT 0,
  
  -- Notifications
  club_notified BOOLEAN DEFAULT FALSE,
  players_notified BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges
CREATE POLICY "Users can view their own challenges" ON challenges
  FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

CREATE POLICY "Users can create challenges" ON challenges
  FOR INSERT WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Users can update their own challenges" ON challenges
  FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- RLS Policies for club_bookings
CREATE POLICY "Users can view bookings for their challenges" ON club_bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM challenges 
      WHERE challenges.id = club_bookings.challenge_id 
      AND (challenges.challenger_id = auth.uid() OR challenges.challenged_id = auth.uid())
    )
  );

-- Function to calculate club priority
CREATE OR REPLACE FUNCTION calculate_club_priority(
  club_row clubs,
  user_lat DECIMAL DEFAULT NULL,
  user_lng DECIMAL DEFAULT NULL
) RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql;

-- Enable realtime for tables
ALTER TABLE challenges REPLICA IDENTITY FULL;
ALTER TABLE club_bookings REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE club_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
