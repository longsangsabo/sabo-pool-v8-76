
-- Ensure tournament_registrations table has all necessary columns
ALTER TABLE public.tournament_registrations 
ADD COLUMN IF NOT EXISTS player_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS registration_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS registration_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update tournaments table to track current participants
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS current_participants INTEGER DEFAULT 0;

-- Create function to update participant count
CREATE OR REPLACE FUNCTION update_tournament_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tournaments 
    SET current_participants = current_participants + 1
    WHERE id = NEW.tournament_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tournaments 
    SET current_participants = GREATEST(0, current_participants - 1)
    WHERE id = OLD.tournament_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update participant count
DROP TRIGGER IF EXISTS tournament_participant_count_trigger ON tournament_registrations;
CREATE TRIGGER tournament_participant_count_trigger
  AFTER INSERT OR DELETE ON tournament_registrations
  FOR EACH ROW EXECUTE FUNCTION update_tournament_participant_count();

-- Ensure RLS policies for tournament registrations
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Allow users to register for tournaments
CREATE POLICY "Users can register for tournaments" ON tournament_registrations
  FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Allow users to view their own registrations
CREATE POLICY "Users can view their registrations" ON tournament_registrations
  FOR SELECT USING (auth.uid() = player_id);

-- Allow organizers to view registrations for their tournaments
CREATE POLICY "Organizers can view tournament registrations" ON tournament_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tournaments t 
      WHERE t.id = tournament_registrations.tournament_id 
      AND t.created_by = auth.uid()
    )
  );
