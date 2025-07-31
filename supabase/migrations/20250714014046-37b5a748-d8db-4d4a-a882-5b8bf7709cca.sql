-- Create player ratings table for club feedback system
CREATE TABLE IF NOT EXISTS public.player_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rated_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  rated_by_club_id UUID NOT NULL REFERENCES club_profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_player_ratings_user ON player_ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_player_ratings_club ON player_ratings(rated_by_club_id);
CREATE INDEX IF NOT EXISTS idx_player_ratings_challenge ON player_ratings(challenge_id);

-- Add unique constraint to prevent duplicate ratings for same user/challenge/club
CREATE UNIQUE INDEX IF NOT EXISTS idx_player_ratings_unique 
ON player_ratings(rated_user_id, challenge_id, rated_by_club_id);

-- Enable RLS
ALTER TABLE public.player_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Club owners can manage ratings for their club" 
ON public.player_ratings 
FOR ALL 
USING (
  rated_by_club_id IN (
    SELECT id FROM club_profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  rated_by_club_id IN (
    SELECT id FROM club_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own ratings" 
ON public.player_ratings 
FOR SELECT 
USING (rated_user_id = auth.uid());

CREATE POLICY "Anyone can view aggregated ratings" 
ON public.player_ratings 
FOR SELECT 
USING (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_player_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_player_ratings_updated_at
  BEFORE UPDATE ON public.player_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_player_ratings_updated_at();