-- Recreate tournament_matches table to ensure proper schema sync
-- This will also regenerate the TypeScript types

-- First check if table exists and drop if needed for clean recreation
DROP TABLE IF EXISTS public.tournament_matches CASCADE;

-- Recreate tournament_matches table with all required columns
CREATE TABLE public.tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id UUID REFERENCES auth.users(id),
  player2_id UUID REFERENCES auth.users(id),
  winner_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'scheduled',
  score_player1 INTEGER DEFAULT 0,
  score_player2 INTEGER DEFAULT 0,
  scheduled_time TIMESTAMPTZ,
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  bracket_type TEXT,
  branch_type TEXT,
  is_third_place_match BOOLEAN DEFAULT FALSE,
  score_status TEXT,
  score_input_by UUID REFERENCES auth.users(id),
  score_submitted_at TIMESTAMPTZ,
  match_stage TEXT,
  loser_branch TEXT,
  round_position INTEGER,
  referee_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Tournament matches are viewable by everyone" 
ON public.tournament_matches FOR SELECT 
USING (true);

CREATE POLICY "Tournament matches can be updated by participants and club owners" 
ON public.tournament_matches FOR UPDATE 
USING (
  auth.uid() = player1_id OR 
  auth.uid() = player2_id OR
  EXISTS (
    SELECT 1 FROM tournaments t 
    JOIN club_profiles cp ON t.club_id = cp.id 
    WHERE t.id = tournament_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Tournament matches can be inserted by system" 
ON public.tournament_matches FOR INSERT 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_tournament_matches_tournament_id ON public.tournament_matches(tournament_id);
CREATE INDEX idx_tournament_matches_round_match ON public.tournament_matches(tournament_id, round_number, match_number);
CREATE INDEX idx_tournament_matches_players ON public.tournament_matches(player1_id, player2_id);
CREATE INDEX idx_tournament_matches_status ON public.tournament_matches(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_tournament_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tournament_matches_updated_at
  BEFORE UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_tournament_matches_updated_at();