-- Recreate tournaments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tournaments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  tournament_type text NOT NULL DEFAULT 'single_elimination'::text,
  format text NOT NULL DEFAULT 'single_elimination'::text,
  status text NOT NULL DEFAULT 'registration_open'::text,
  max_participants integer,
  current_participants integer DEFAULT 0,
  entry_fee numeric DEFAULT 0,
  prize_pool numeric DEFAULT 0,
  tournament_start timestamp with time zone NOT NULL,
  tournament_end timestamp with time zone,
  registration_start timestamp with time zone DEFAULT now(),
  registration_end timestamp with time zone,
  location text,
  rules text,
  created_by uuid,
  club_id uuid,
  is_visible boolean DEFAULT true,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  winner_id uuid,
  runner_up_id uuid,
  third_place_id uuid,
  is_demo boolean DEFAULT false,
  bracket_generated boolean DEFAULT false,
  bracket_type text DEFAULT 'single_elimination'::text,
  round_robin_rounds integer,
  advancement_rule text DEFAULT 'elimination'::text,
  tiebreaker_rule text DEFAULT 'head_to_head'::text
);

-- Enable RLS
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Club owners can manage their tournaments" ON public.tournaments;
CREATE POLICY "Club owners can manage their tournaments" 
ON public.tournaments 
FOR ALL
USING (
  is_current_user_admin() OR 
  is_current_user_club_owner(club_id) OR
  club_id IN (
    SELECT cp.id 
    FROM public.club_profiles cp 
    WHERE cp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Everyone can view public tournaments" ON public.tournaments;
CREATE POLICY "Everyone can view public tournaments" 
ON public.tournaments 
FOR SELECT
USING (is_visible = true OR is_current_user_admin());

-- Also recreate tournament_registrations table if needed
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid NOT NULL,
  user_id uuid NOT NULL,
  registration_status text DEFAULT 'confirmed'::text,
  registered_at timestamp with time zone DEFAULT now(),
  payment_status text DEFAULT 'unpaid'::text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

-- Enable RLS for tournament_registrations
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies for tournament_registrations
DROP POLICY IF EXISTS "Users can manage their registrations" ON public.tournament_registrations;
CREATE POLICY "Users can manage their registrations" 
ON public.tournament_registrations 
FOR ALL
USING (
  auth.uid() = user_id OR 
  is_current_user_admin() OR
  tournament_id IN (
    SELECT t.id FROM public.tournaments t
    JOIN public.club_profiles cp ON cp.id = t.club_id
    WHERE cp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Everyone can view registrations" ON public.tournament_registrations;
CREATE POLICY "Everyone can view registrations" 
ON public.tournament_registrations 
FOR SELECT
USING (true);

-- Create tournament_matches table if needed
CREATE TABLE IF NOT EXISTS public.tournament_matches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid NOT NULL,
  round_number integer NOT NULL,
  match_number integer NOT NULL,
  bracket_type text DEFAULT 'winner'::text,
  branch_type text,
  player1_id uuid,
  player2_id uuid,
  score_player1 integer DEFAULT 0,
  score_player2 integer DEFAULT 0,
  winner_id uuid,
  status text DEFAULT 'pending'::text,
  scheduled_time timestamp with time zone,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  assigned_table_id uuid,
  table_released_at timestamp with time zone,
  score_status text DEFAULT 'pending'::text,
  score_confirmed_by uuid,
  score_confirmed_at timestamp with time zone,
  is_third_place_match boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for tournament_matches
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

-- Create policies for tournament_matches
DROP POLICY IF EXISTS "Tournament participants and organizers can view matches" ON public.tournament_matches;
CREATE POLICY "Tournament participants and organizers can view matches" 
ON public.tournament_matches 
FOR SELECT
USING (
  is_current_user_admin() OR
  tournament_id IN (
    SELECT t.id FROM public.tournaments t
    JOIN public.club_profiles cp ON cp.id = t.club_id
    WHERE cp.user_id = auth.uid()
  ) OR
  auth.uid() = player1_id OR
  auth.uid() = player2_id
);

DROP POLICY IF EXISTS "Tournament organizers can manage matches" ON public.tournament_matches;
CREATE POLICY "Tournament organizers can manage matches" 
ON public.tournament_matches 
FOR ALL
USING (
  is_current_user_admin() OR
  tournament_id IN (
    SELECT t.id FROM public.tournaments t
    JOIN public.club_profiles cp ON cp.id = t.club_id
    WHERE cp.user_id = auth.uid()
  )
);

-- Create tournament_results table if needed
CREATE TABLE IF NOT EXISTS public.tournament_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid NOT NULL,
  user_id uuid NOT NULL,
  final_position integer NOT NULL,
  total_matches integer DEFAULT 0,
  wins integer DEFAULT 0,
  losses integer DEFAULT 0,
  win_percentage numeric DEFAULT 0,
  total_score integer DEFAULT 0,
  prize_amount numeric DEFAULT 0,
  spa_points_awarded integer DEFAULT 0,
  elo_points_awarded integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

-- Enable RLS for tournament_results
ALTER TABLE public.tournament_results ENABLE ROW LEVEL SECURITY;

-- Create policies for tournament_results
DROP POLICY IF EXISTS "Admins and club owners can view tournament results" ON public.tournament_results;
CREATE POLICY "Admins and club owners can view tournament results" 
ON public.tournament_results 
FOR SELECT
USING (
  is_current_user_admin() OR 
  tournament_id IN (
    SELECT t.id 
    FROM public.tournaments t
    JOIN public.club_profiles cp ON cp.id = t.club_id
    WHERE cp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "System can insert tournament results" ON public.tournament_results;
CREATE POLICY "System can insert tournament results" 
ON public.tournament_results 
FOR INSERT
WITH CHECK (true);