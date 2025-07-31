-- Create tournament_brackets table
CREATE TABLE public.tournament_brackets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL,
  bracket_data JSONB DEFAULT '{}',
  total_rounds INTEGER NOT NULL DEFAULT 0,
  bracket_type TEXT DEFAULT 'single_elimination',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tournament_matches table
CREATE TABLE public.tournament_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL,
  round_number INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id UUID,
  player2_id UUID,
  winner_id UUID,
  score_player1 INTEGER,
  score_player2 INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_time TIMESTAMP WITH TIME ZONE,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  score_input_by UUID,
  score_submitted_at TIMESTAMP WITH TIME ZONE,
  score_confirmed_by UUID,
  score_confirmed_at TIMESTAMP WITH TIME ZONE,
  score_status TEXT DEFAULT 'pending',
  is_third_place_match BOOLEAN DEFAULT false,
  assigned_table_id UUID,
  assigned_table_number INTEGER,
  bracket_type TEXT,
  branch_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create club_tables table
CREATE TABLE public.club_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL,
  table_number INTEGER NOT NULL,
  table_name TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  current_match_id UUID,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(club_id, table_number)
);

-- Enable RLS
ALTER TABLE public.tournament_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_tables ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tournament_brackets
CREATE POLICY "Users can view tournament brackets" ON public.tournament_brackets
FOR SELECT USING (true);

CREATE POLICY "Club owners can manage tournament brackets" ON public.tournament_brackets
FOR ALL USING (tournament_id IN (
  SELECT t.id FROM public.tournaments t
  LEFT JOIN public.club_profiles cp ON t.club_id = cp.id
  WHERE cp.user_id = auth.uid() OR t.created_by = auth.uid()
));

-- Create RLS policies for tournament_matches
CREATE POLICY "Users can view tournament matches" ON public.tournament_matches
FOR SELECT USING (true);

CREATE POLICY "Club owners can manage tournament matches" ON public.tournament_matches
FOR ALL USING (tournament_id IN (
  SELECT t.id FROM public.tournaments t
  LEFT JOIN public.club_profiles cp ON t.club_id = cp.id
  WHERE cp.user_id = auth.uid() OR t.created_by = auth.uid()
));

-- Create RLS policies for club_tables
CREATE POLICY "Users can view club tables" ON public.club_tables
FOR SELECT USING (true);

CREATE POLICY "Club owners can manage their tables" ON public.club_tables
FOR ALL USING (club_id IN (
  SELECT id FROM public.club_profiles WHERE user_id = auth.uid()
));

-- Create indexes
CREATE INDEX idx_tournament_brackets_tournament_id ON public.tournament_brackets(tournament_id);
CREATE INDEX idx_tournament_matches_tournament_id ON public.tournament_matches(tournament_id);
CREATE INDEX idx_tournament_matches_round_match ON public.tournament_matches(tournament_id, round_number, match_number);
CREATE INDEX idx_club_tables_club_id ON public.club_tables(club_id);

-- Create update timestamp trigger
CREATE TRIGGER update_tournament_brackets_updated_at
  BEFORE UPDATE ON public.tournament_brackets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournament_matches_updated_at
  BEFORE UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_club_tables_updated_at
  BEFORE UPDATE ON public.club_tables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();