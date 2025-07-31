-- Add missing columns to tournaments table
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS management_status TEXT DEFAULT 'manual';

-- Add missing columns to profiles table  
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS member_since TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS completion_percentage NUMERIC(5,2) DEFAULT 0;

-- Create tournament_results table
CREATE TABLE IF NOT EXISTS public.tournament_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  final_position INTEGER NOT NULL,
  prize_amount NUMERIC(10,2) DEFAULT 0,
  spa_points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

-- Enable RLS on tournament_results
ALTER TABLE public.tournament_results ENABLE ROW LEVEL SECURITY;

-- Create policies for tournament_results
CREATE POLICY "Anyone can view tournament results" 
ON public.tournament_results FOR SELECT 
USING (true);

CREATE POLICY "System can manage tournament results" 
ON public.tournament_results FOR ALL 
WITH CHECK (true);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_tournament_results_tournament_id ON public.tournament_results(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_user_id ON public.tournament_results(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_final_position ON public.tournament_results(final_position);

-- Add trigger for updated_at
CREATE TRIGGER update_tournament_results_updated_at
  BEFORE UPDATE ON public.tournament_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add missing columns to matches table
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS played_at TIMESTAMP WITH TIME ZONE DEFAULT actual_end_time;

-- Add missing columns to club_profiles  
ALTER TABLE public.club_profiles
ADD COLUMN IF NOT EXISTS is_sabo_owned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS available_tables INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS priority_score NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2) DEFAULT 0;