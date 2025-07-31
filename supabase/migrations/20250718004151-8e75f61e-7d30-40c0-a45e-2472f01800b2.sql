-- STEP 1: Backup existing data
CREATE TEMP TABLE tournament_matches_backup AS 
SELECT * FROM public.tournament_matches;

CREATE TEMP TABLE match_events_backup AS 
SELECT * FROM public.match_events WHERE match_id IN (SELECT id FROM public.tournament_matches);

-- STEP 2: Clear foreign key references BEFORE dropping table
UPDATE public.club_tables SET current_match_id = NULL WHERE current_match_id IS NOT NULL;

-- Drop all dependencies and constraints
DROP TRIGGER IF EXISTS release_table_on_match_complete ON public.tournament_matches;
DROP TRIGGER IF EXISTS update_tournament_matches_updated_at ON public.tournament_matches;

-- Drop foreign key constraints from other tables
ALTER TABLE IF EXISTS public.match_events DROP CONSTRAINT IF EXISTS match_events_match_id_fkey;
ALTER TABLE IF EXISTS public.club_tables DROP CONSTRAINT IF EXISTS club_tables_current_match_id_fkey;
ALTER TABLE IF EXISTS public.match_results DROP CONSTRAINT IF EXISTS match_results_match_id_fkey;

-- Drop indexes
DROP INDEX IF EXISTS idx_tournament_matches_tournament_id;
DROP INDEX IF EXISTS idx_tournament_matches_players;
DROP INDEX IF EXISTS idx_tournament_matches_status;

-- Drop RLS policies
DROP POLICY IF EXISTS "Everyone can view tournament matches" ON public.tournament_matches;
DROP POLICY IF EXISTS "Admins can manage tournament matches" ON public.tournament_matches;
DROP POLICY IF EXISTS "Players can view their matches" ON public.tournament_matches;
DROP POLICY IF EXISTS "Club owners can manage matches in their tournaments" ON public.tournament_matches;

-- STEP 3: Drop the table
DROP TABLE IF EXISTS public.tournament_matches CASCADE;

-- STEP 4: Create new tournament_matches table with clean structure (including existing bracket types)
CREATE TABLE public.tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  bracket_type TEXT DEFAULT 'main' CHECK (bracket_type IN ('main', 'winner', 'loser', 'semifinal', 'final', 'single')),
  branch_type TEXT CHECK (branch_type IN ('branch_a', 'branch_b')),
  is_third_place_match BOOLEAN DEFAULT false,
  
  -- Players
  player1_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  player2_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  winner_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  
  -- Scores
  score_player1 INTEGER DEFAULT 0,
  score_player2 INTEGER DEFAULT 0,
  
  -- Status and timing
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  scheduled_time TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Score confirmation
  score_status TEXT DEFAULT 'pending' CHECK (score_status IN ('pending', 'confirmed', 'disputed')),
  score_confirmed_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  score_confirmed_at TIMESTAMP WITH TIME ZONE,
  
  -- Officials and venue
  referee_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  assigned_table_id UUID,
  table_released_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT tournament_matches_round_match_unique UNIQUE (tournament_id, round_number, match_number),
  CONSTRAINT tournament_matches_valid_players CHECK (player1_id IS NOT NULL OR player2_id IS NOT NULL),
  CONSTRAINT tournament_matches_valid_winner CHECK (winner_id IS NULL OR winner_id = player1_id OR winner_id = player2_id),
  CONSTRAINT tournament_matches_valid_scores CHECK (score_player1 >= 0 AND score_player2 >= 0)
);

-- STEP 5: Restore data from backup (mapping old columns to new structure)
INSERT INTO public.tournament_matches (
  id, tournament_id, round_number, match_number, bracket_type, branch_type, is_third_place_match,
  player1_id, player2_id, winner_id, score_player1, score_player2,
  status, scheduled_time, started_at, completed_at, score_status, score_confirmed_by, score_confirmed_at,
  referee_id, notes, created_at, updated_at
)
SELECT 
  id, tournament_id, round_number, match_number, 
  COALESCE(bracket_type, 'main'), branch_type, COALESCE(is_third_place_match, false),
  player1_id, player2_id, winner_id, 
  COALESCE(score_player1, 0), COALESCE(score_player2, 0),
  COALESCE(status, 'scheduled'), scheduled_time, 
  actual_start_time, actual_end_time, -- Map old timing columns
  COALESCE(score_status, 'pending'), score_confirmed_by, score_confirmed_at,
  referee_id, COALESCE(notes, match_notes), -- Map notes fields
  COALESCE(created_at, now()), COALESCE(updated_at, now())
FROM tournament_matches_backup;

-- STEP 6: Enable RLS
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

-- STEP 7: Create RLS policies
CREATE POLICY "Everyone can view tournament matches" 
ON public.tournament_matches FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage tournament matches" 
ON public.tournament_matches FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Players can view their matches" 
ON public.tournament_matches FOR SELECT 
USING (
  auth.uid() = player1_id OR auth.uid() = player2_id OR auth.uid() = referee_id
);

CREATE POLICY "Club owners can manage matches in their tournaments"
ON public.tournament_matches FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    INNER JOIN public.club_profiles cp ON cp.id = t.club_id
    WHERE t.id = tournament_matches.tournament_id AND cp.user_id = auth.uid()
  )
);

-- STEP 8: Create indexes for performance
CREATE INDEX idx_tournament_matches_tournament_id ON public.tournament_matches(tournament_id);
CREATE INDEX idx_tournament_matches_players ON public.tournament_matches(player1_id, player2_id);
CREATE INDEX idx_tournament_matches_status ON public.tournament_matches(status);
CREATE INDEX idx_tournament_matches_bracket ON public.tournament_matches(tournament_id, bracket_type, round_number);
CREATE INDEX idx_tournament_matches_winner ON public.tournament_matches(winner_id) WHERE winner_id IS NOT NULL;

-- STEP 9: Create updated_at trigger
CREATE TRIGGER update_tournament_matches_updated_at 
  BEFORE UPDATE ON public.tournament_matches 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- STEP 10: Create table release trigger
CREATE TRIGGER release_table_on_match_complete
  BEFORE UPDATE ON public.tournament_matches
  FOR EACH ROW EXECUTE FUNCTION release_table_on_match_complete();

-- STEP 11: Restore foreign key constraints to other tables
ALTER TABLE public.match_events 
ADD CONSTRAINT match_events_match_id_fkey 
FOREIGN KEY (match_id) REFERENCES public.tournament_matches(id) ON DELETE CASCADE;

ALTER TABLE public.club_tables 
ADD CONSTRAINT club_tables_current_match_id_fkey 
FOREIGN KEY (current_match_id) REFERENCES public.tournament_matches(id) ON DELETE SET NULL;

-- STEP 12: Restore match_events data
INSERT INTO public.match_events
SELECT * FROM match_events_backup;

-- Clean up temp tables
DROP TABLE tournament_matches_backup;
DROP TABLE match_events_backup;