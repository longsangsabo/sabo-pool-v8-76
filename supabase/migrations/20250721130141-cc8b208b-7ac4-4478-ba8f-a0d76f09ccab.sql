-- Stage 1: Add missing columns to tournament_registrations table
ALTER TABLE public.tournament_registrations 
ADD COLUMN IF NOT EXISTS bracket_position INTEGER,
ADD COLUMN IF NOT EXISTS registration_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add constraint for registration_status
ALTER TABLE public.tournament_registrations 
ADD CONSTRAINT IF NOT EXISTS tournament_registrations_registration_status_check 
CHECK (registration_status IN ('pending', 'approved', 'rejected', 'waiting_list'));

-- Add constraint for status
ALTER TABLE public.tournament_registrations 
ADD CONSTRAINT IF NOT EXISTS tournament_registrations_status_check 
CHECK (status IN ('active', 'inactive', 'cancelled'));

-- Create tournament_results table
CREATE TABLE IF NOT EXISTS public.tournament_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  position INTEGER NOT NULL,
  points_earned INTEGER DEFAULT 0,
  prize_amount NUMERIC DEFAULT 0,
  placement_type TEXT DEFAULT 'final' CHECK (placement_type IN ('final', 'semifinal', 'quarterfinal', 'preliminary')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Add trigger for tournament_results updated_at
CREATE OR REPLACE FUNCTION public.update_tournament_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_tournament_results_updated_at
  BEFORE UPDATE ON public.tournament_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tournament_results_updated_at();