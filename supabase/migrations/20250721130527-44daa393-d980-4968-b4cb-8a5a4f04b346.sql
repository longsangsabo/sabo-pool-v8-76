-- Stage 1: Add missing columns to tournament_registrations table (Fixed syntax)
ALTER TABLE public.tournament_registrations 
ADD COLUMN IF NOT EXISTS bracket_position INTEGER,
ADD COLUMN IF NOT EXISTS registration_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add constraints using DO block to handle IF NOT EXISTS
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tournament_registrations_registration_status_check'
  ) THEN
    ALTER TABLE public.tournament_registrations 
    ADD CONSTRAINT tournament_registrations_registration_status_check 
    CHECK (registration_status IN ('pending', 'approved', 'rejected', 'waiting_list'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tournament_registrations_status_check'
  ) THEN
    ALTER TABLE public.tournament_registrations 
    ADD CONSTRAINT tournament_registrations_status_check 
    CHECK (status IN ('active', 'inactive', 'cancelled'));
  END IF;
END $$;

-- Create tournament_results table
CREATE TABLE IF NOT EXISTS public.tournament_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  position INTEGER NOT NULL,
  points_earned INTEGER DEFAULT 0,
  prize_amount NUMERIC DEFAULT 0,
  placement_type TEXT DEFAULT 'final',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraint for placement_type using DO block
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tournament_results_placement_type_check'
  ) THEN
    ALTER TABLE public.tournament_results 
    ADD CONSTRAINT tournament_results_placement_type_check 
    CHECK (placement_type IN ('final', 'semifinal', 'quarterfinal', 'preliminary'));
  END IF;
END $$;

-- Enable RLS on tournament_results
ALTER TABLE public.tournament_results ENABLE ROW LEVEL SECURITY;

-- Create policies for tournament_results
CREATE POLICY "Anyone can view tournament results" 
ON public.tournament_results 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Tournament organizers can manage results" 
ON public.tournament_results 
FOR ALL 
TO authenticated
USING (
  tournament_id IN (
    SELECT t.id FROM tournaments t
    LEFT JOIN club_profiles cp ON t.club_id = cp.id
    WHERE cp.user_id = auth.uid() OR t.created_by = auth.uid()
  )
)
WITH CHECK (
  tournament_id IN (
    SELECT t.id FROM tournaments t
    LEFT JOIN club_profiles cp ON t.club_id = cp.id
    WHERE cp.user_id = auth.uid() OR t.created_by = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournament_results_tournament_id ON tournament_results(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_user_id ON tournament_results(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_position ON tournament_results(position);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_bracket_position ON tournament_registrations(bracket_position);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_status ON tournament_registrations(status);