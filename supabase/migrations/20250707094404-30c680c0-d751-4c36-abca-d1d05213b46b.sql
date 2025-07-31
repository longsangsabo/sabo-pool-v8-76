-- Create tournaments table if not exists
CREATE TABLE IF NOT EXISTS public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  tournament_type text NOT NULL DEFAULT 'single_elimination',
  game_format text NOT NULL DEFAULT '9_ball',
  max_participants integer NOT NULL DEFAULT 16,
  current_participants integer DEFAULT 0,
  tournament_start timestamp with time zone NOT NULL,
  tournament_end timestamp with time zone NOT NULL,
  registration_start timestamp with time zone NOT NULL,
  registration_end timestamp with time zone NOT NULL,
  venue_name text,
  venue_address text,
  entry_fee numeric DEFAULT 0,
  prize_pool numeric DEFAULT 0,
  first_prize numeric DEFAULT 0,
  second_prize numeric DEFAULT 0,
  third_prize numeric DEFAULT 0,
  rules text,
  contact_info text,
  banner_image text,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled')),
  tier text DEFAULT 'I' CHECK (tier IN ('G', 'H', 'I', 'K')),
  min_rank_requirement text,
  max_rank_requirement text,
  requires_approval boolean DEFAULT false,
  is_public boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  club_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view public tournaments"
ON public.tournaments
FOR SELECT
USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Authenticated users can create tournaments"
ON public.tournaments
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Tournament creators can update their tournaments"
ON public.tournaments
FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Tournament creators can delete their tournaments"
ON public.tournaments
FOR DELETE
USING (auth.uid() = created_by);

-- Create tournament registrations table
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registration_date timestamp with time zone DEFAULT now(),
  status text DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'cancelled', 'withdrawn')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

-- Enable RLS for registrations
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

-- RLS policies for registrations
CREATE POLICY "Users can view their own registrations"
ON public.tournament_registrations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can register for tournaments"
ON public.tournament_registrations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registrations"
ON public.tournament_registrations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Tournament creators can view all registrations for their tournaments
CREATE POLICY "Tournament creators can view registrations"
ON public.tournament_registrations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t 
    WHERE t.id = tournament_registrations.tournament_id 
    AND t.created_by = auth.uid()
  )
);

-- Create function to update tournament participant count
CREATE OR REPLACE FUNCTION update_tournament_participants()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tournaments 
    SET current_participants = current_participants + 1,
        updated_at = now()
    WHERE id = NEW.tournament_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tournaments 
    SET current_participants = GREATEST(0, current_participants - 1),
        updated_at = now()
    WHERE id = OLD.tournament_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for participant count
DROP TRIGGER IF EXISTS tournament_participant_count_trigger ON public.tournament_registrations;
CREATE TRIGGER tournament_participant_count_trigger
  AFTER INSERT OR DELETE ON public.tournament_registrations
  FOR EACH ROW EXECUTE FUNCTION update_tournament_participants();

-- Update tournaments status based on dates
CREATE OR REPLACE FUNCTION update_tournament_status()
RETURNS void AS $$
BEGIN
  UPDATE public.tournaments SET
    status = CASE
      WHEN now() < registration_start THEN 'upcoming'
      WHEN now() >= registration_start AND now() <= registration_end THEN 'registration_open'
      WHEN now() > registration_end AND now() < tournament_start THEN 'registration_closed'
      WHEN now() >= tournament_start AND now() <= tournament_end THEN 'ongoing'
      WHEN now() > tournament_end THEN 'completed'
      ELSE status
    END,
    updated_at = now()
  WHERE status NOT IN ('cancelled', 'completed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;