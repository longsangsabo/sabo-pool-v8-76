-- Phase 1: Create tournament reward structures table
CREATE TABLE public.tournament_reward_structures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rank_code TEXT NOT NULL REFERENCES public.rank_definitions(rank_code),
  tournament_type TEXT NOT NULL CHECK (tournament_type IN ('regular', 'season', 'championship')),
  tournament_position INTEGER NOT NULL CHECK (tournament_position > 0),
  base_points INTEGER NOT NULL DEFAULT 0,
  multiplier NUMERIC NOT NULL DEFAULT 1.0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(rank_code, tournament_type, tournament_position)
);

-- Create SPA reward milestones table
CREATE TABLE public.spa_reward_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rank_code TEXT NOT NULL REFERENCES public.rank_definitions(rank_code),
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('tournament_win', 'tournament_position', 'match_win', 'achievement')),
  milestone_position INTEGER, -- For tournament positions (1st, 2nd, etc.)
  points_awarded INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.tournament_reward_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spa_reward_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tournament_reward_structures
CREATE POLICY "Everyone can view tournament reward structures"
ON public.tournament_reward_structures
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage tournament reward structures"
ON public.tournament_reward_structures
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- RLS Policies for spa_reward_milestones
CREATE POLICY "Everyone can view SPA reward milestones"
ON public.spa_reward_milestones
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage SPA reward milestones"
ON public.spa_reward_milestones
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Insert tournament reward data
INSERT INTO public.tournament_reward_structures (rank_code, tournament_type, tournament_position, base_points, multiplier, description) VALUES
-- Regular tournaments
('K', 'regular', 1, 1000, 1.0, 'Vô địch hạng K'),
('K', 'regular', 2, 700, 1.0, 'Á quân hạng K'),
('K', 'regular', 3, 500, 1.0, 'Hạng 3 hạng K'),
('K+', 'regular', 1, 1100, 1.0, 'Vô địch hạng K+'),
('K+', 'regular', 2, 750, 1.0, 'Á quân hạng K+'),
('K+', 'regular', 3, 550, 1.0, 'Hạng 3 hạng K+'),
('I', 'regular', 1, 1200, 1.0, 'Vô địch hạng I'),
('I', 'regular', 2, 800, 1.0, 'Á quân hạng I'),
('I', 'regular', 3, 600, 1.0, 'Hạng 3 hạng I'),
('I+', 'regular', 1, 1300, 1.0, 'Vô địch hạng I+'),
('I+', 'regular', 2, 850, 1.0, 'Á quân hạng I+'),
('I+', 'regular', 3, 650, 1.0, 'Hạng 3 hạng I+'),
('H', 'regular', 1, 1400, 1.0, 'Vô địch hạng H'),
('H', 'regular', 2, 900, 1.0, 'Á quân hạng H'),
('H', 'regular', 3, 700, 1.0, 'Hạng 3 hạng H'),
('H+', 'regular', 1, 1500, 1.0, 'Vô địch hạng H+'),
('H+', 'regular', 2, 950, 1.0, 'Á quân hạng H+'),
('H+', 'regular', 3, 750, 1.0, 'Hạng 3 hạng H+'),
('G', 'regular', 1, 1600, 1.0, 'Vô địch hạng G'),
('G', 'regular', 2, 1000, 1.0, 'Á quân hạng G'),
('G', 'regular', 3, 800, 1.0, 'Hạng 3 hạng G'),
('G+', 'regular', 1, 1700, 1.0, 'Vô địch hạng G+'),
('G+', 'regular', 2, 1050, 1.0, 'Á quân hạng G+'),
('G+', 'regular', 3, 850, 1.0, 'Hạng 3 hạng G+'),
('F', 'regular', 1, 1800, 1.0, 'Vô địch hạng F'),
('F', 'regular', 2, 1100, 1.0, 'Á quân hạng F'),
('F', 'regular', 3, 900, 1.0, 'Hạng 3 hạng F'),
('F+', 'regular', 1, 1900, 1.0, 'Vô địch hạng F+'),
('F+', 'regular', 2, 1150, 1.0, 'Á quân hạng F+'),
('F+', 'regular', 3, 950, 1.0, 'Hạng 3 hạng F+'),
('E', 'regular', 1, 2000, 1.0, 'Vô địch hạng E'),
('E', 'regular', 2, 1200, 1.0, 'Á quân hạng E'),
('E', 'regular', 3, 1000, 1.0, 'Hạng 3 hạng E'),
('E+', 'regular', 1, 2100, 1.0, 'Vô địch hạng E+'),
('E+', 'regular', 2, 1250, 1.0, 'Á quân hạng E+'),
('E+', 'regular', 3, 1050, 1.0, 'Hạng 3 hạng E+');

-- Insert SPA milestone rewards
INSERT INTO public.spa_reward_milestones (rank_code, milestone_type, milestone_position, points_awarded, description) VALUES
-- Tournament wins
('K', 'tournament_win', 1, 1000, 'Vô địch giải đấu hạng K'),
('K+', 'tournament_win', 1, 1100, 'Vô địch giải đấu hạng K+'),
('I', 'tournament_win', 1, 1200, 'Vô địch giải đấu hạng I'),
('I+', 'tournament_win', 1, 1300, 'Vô địch giải đấu hạng I+'),
('H', 'tournament_win', 1, 1400, 'Vô địch giải đấu hạng H'),
('H+', 'tournament_win', 1, 1500, 'Vô địch giải đấu hạng H+'),
('G', 'tournament_win', 1, 1600, 'Vô địch giải đấu hạng G'),
('G+', 'tournament_win', 1, 1700, 'Vô địch giải đấu hạng G+'),
('F', 'tournament_win', 1, 1800, 'Vô địch giải đấu hạng F'),
('F+', 'tournament_win', 1, 1900, 'Vô địch giải đấu hạng F+'),
('E', 'tournament_win', 1, 2000, 'Vô địch giải đấu hạng E'),
('E+', 'tournament_win', 1, 2100, 'Vô địch giải đấu hạng E+'),
-- Match wins (base rewards)
('K', 'match_win', NULL, 50, 'Thắng trận đấu hạng K'),
('K+', 'match_win', NULL, 55, 'Thắng trận đấu hạng K+'),
('I', 'match_win', NULL, 60, 'Thắng trận đấu hạng I'),
('I+', 'match_win', NULL, 65, 'Thắng trận đấu hạng I+'),
('H', 'match_win', NULL, 70, 'Thắng trận đấu hạng H'),
('H+', 'match_win', NULL, 75, 'Thắng trận đấu hạng H+'),
('G', 'match_win', NULL, 80, 'Thắng trận đấu hạng G'),
('G+', 'match_win', NULL, 85, 'Thắng trận đấu hạng G+'),
('F', 'match_win', NULL, 90, 'Thắng trận đấu hạng F'),
('F+', 'match_win', NULL, 95, 'Thắng trận đấu hạng F+'),
('E', 'match_win', NULL, 100, 'Thắng trận đấu hạng E'),
('E+', 'match_win', NULL, 105, 'Thắng trận đấu hạng E+');

-- Create indexes for performance
CREATE INDEX idx_tournament_reward_structures_rank_type ON public.tournament_reward_structures(rank_code, tournament_type);
CREATE INDEX idx_spa_reward_milestones_rank_type ON public.spa_reward_milestones(rank_code, milestone_type);