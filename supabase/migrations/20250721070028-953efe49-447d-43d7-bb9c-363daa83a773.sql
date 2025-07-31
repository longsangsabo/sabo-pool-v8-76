-- Create missing tables that appear in console errors

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read boolean DEFAULT false,
  action_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create tournaments table  
CREATE TABLE public.tournaments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  club_id uuid,
  max_participants integer DEFAULT 16,
  entry_fee integer DEFAULT 0,
  prize_pool integer DEFAULT 0,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  tournament_type text DEFAULT 'single_elimination',
  registration_start timestamp with time zone,
  registration_end timestamp with time zone,
  tournament_start timestamp with time zone,
  tournament_end timestamp with time zone,
  venue_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create clubs table (clubs was referenced in tournaments relationship error)
CREATE TABLE public.clubs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  address text,
  contact_info text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add foreign key relationship for tournaments-clubs
ALTER TABLE public.tournaments 
ADD CONSTRAINT tournaments_club_id_fkey 
FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- RLS policies for tournaments (public read, owner write)
CREATE POLICY "Anyone can view tournaments" 
ON public.tournaments FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Club owners can manage their tournaments" 
ON public.tournaments FOR ALL 
TO authenticated
USING (
  club_id IN (
    SELECT id FROM public.clubs WHERE owner_id = auth.uid()
  )
);

-- RLS policies for clubs
CREATE POLICY "Anyone can view active clubs" 
ON public.clubs FOR SELECT 
TO authenticated
USING (status = 'active');

CREATE POLICY "Club owners can manage their clubs" 
ON public.clubs FOR ALL 
TO authenticated
USING (auth.uid() = owner_id);

-- Add triggers for timestamp updates
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clubs_updated_at
  BEFORE UPDATE ON public.clubs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();