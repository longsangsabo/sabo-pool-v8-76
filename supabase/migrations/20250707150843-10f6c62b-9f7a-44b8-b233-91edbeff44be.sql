-- Add elo_points_required column to ranks table
ALTER TABLE public.ranks 
ADD COLUMN IF NOT EXISTS elo_points_required NUMERIC DEFAULT 0;

-- Update ranks table with ELO points required for promotion
UPDATE public.ranks SET elo_points_required = 1 WHERE code = 'K';
UPDATE public.ranks SET elo_points_required = 2 WHERE code = 'K+';  
UPDATE public.ranks SET elo_points_required = 3 WHERE code = 'I';
UPDATE public.ranks SET elo_points_required = 4 WHERE code = 'I+';
UPDATE public.ranks SET elo_points_required = 5 WHERE code = 'H';
UPDATE public.ranks SET elo_points_required = 6 WHERE code = 'H+';
UPDATE public.ranks SET elo_points_required = 7 WHERE code = 'G';
UPDATE public.ranks SET elo_points_required = 8 WHERE code = 'G+';
UPDATE public.ranks SET elo_points_required = 9 WHERE code = 'E';

-- Add ELO points column to player_rankings if not exists
ALTER TABLE public.player_rankings 
ADD COLUMN IF NOT EXISTS elo_points NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_opponent_strength NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS performance_quality NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS club_verified BOOLEAN DEFAULT false;

-- Create function to calculate achievement points from tournament placement
CREATE OR REPLACE FUNCTION public.calculate_achievement_points(placement text)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  CASE placement
    WHEN 'CHAMPION' THEN RETURN 1.0;
    WHEN 'RUNNER_UP' THEN RETURN 0.5;
    WHEN 'THIRD_PLACE' THEN RETURN 0.25;
    WHEN 'FOURTH_PLACE' THEN RETURN 0.125;
    ELSE RETURN 0.0;
  END CASE;
END;
$$;

-- Create function to calculate average opponent strength
CREATE OR REPLACE FUNCTION public.calculate_average_opponent_strength(p_player_id uuid)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  avg_strength NUMERIC;
BEGIN
  SELECT AVG(
    CASE 
      WHEN mr.player1_id = p_player_id THEN mr.player2_elo_before
      ELSE mr.player1_elo_before
    END
  ) INTO avg_strength
  FROM public.match_results mr
  WHERE (mr.player1_id = p_player_id OR mr.player2_id = p_player_id)
  AND mr.result_status = 'verified'
  AND mr.match_date >= NOW() - INTERVAL '90 days';
  
  RETURN COALESCE(avg_strength, 0);
END;
$$;

-- Create function to calculate performance quality
CREATE OR REPLACE FUNCTION public.calculate_performance_quality(p_player_id uuid)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  total_matches INTEGER;
  wins INTEGER;
  win_rate NUMERIC;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE winner_id = p_player_id)
  INTO total_matches, wins
  FROM public.match_results mr
  WHERE (mr.player1_id = p_player_id OR mr.player2_id = p_player_id)
  AND mr.result_status = 'verified'
  AND mr.match_date >= NOW() - INTERVAL '90 days';
  
  IF total_matches = 0 THEN
    RETURN 0;
  END IF;
  
  win_rate := wins::NUMERIC / total_matches::NUMERIC;
  RETURN win_rate;
END;
$$;