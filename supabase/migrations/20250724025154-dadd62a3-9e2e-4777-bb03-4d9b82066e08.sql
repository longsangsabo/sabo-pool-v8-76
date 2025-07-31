-- Create missing tables and functions for tournament system

-- Create player_milestones table
CREATE TABLE IF NOT EXISTS public.player_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reward_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, milestone_id)
);

-- Create tournament_prize_tiers table
CREATE TABLE IF NOT EXISTS public.tournament_prize_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  position_name TEXT NOT NULL,
  cash_amount NUMERIC DEFAULT 0,
  elo_points INTEGER DEFAULT 0,
  spa_points INTEGER DEFAULT 0,
  physical_items JSONB DEFAULT '[]',
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tournament_id, position)
);

-- Create tournament_special_awards table  
CREATE TABLE IF NOT EXISTS public.tournament_special_awards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  award_name TEXT NOT NULL,
  description TEXT,
  cash_prize NUMERIC DEFAULT 0,
  criteria TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create spa_reward_milestones table if not exists
CREATE TABLE IF NOT EXISTS public.spa_reward_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone_name TEXT NOT NULL,
  milestone_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  spa_reward INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_repeatable BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.player_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_prize_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_special_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spa_reward_milestones ENABLE ROW LEVEL SECURITY;

-- RLS policies for player_milestones
CREATE POLICY "Users can view their own milestones" ON public.player_milestones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage milestones" ON public.player_milestones
  FOR ALL WITH CHECK (true);

-- RLS policies for tournament_prize_tiers
CREATE POLICY "Anyone can view tournament prize tiers" ON public.tournament_prize_tiers
  FOR SELECT USING (true);

CREATE POLICY "Tournament creators can manage prize tiers" ON public.tournament_prize_tiers
  FOR ALL USING (
    tournament_id IN (
      SELECT id FROM public.tournaments WHERE created_by = auth.uid()
    )
  );

-- RLS policies for tournament_special_awards
CREATE POLICY "Anyone can view tournament special awards" ON public.tournament_special_awards
  FOR SELECT USING (true);

CREATE POLICY "Tournament creators can manage special awards" ON public.tournament_special_awards
  FOR ALL USING (
    tournament_id IN (
      SELECT id FROM public.tournaments WHERE created_by = auth.uid()
    )
  );

-- RLS policies for spa_reward_milestones
CREATE POLICY "Anyone can view active milestones" ON public.spa_reward_milestones
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage milestones" ON public.spa_reward_milestones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Add missing functions
CREATE OR REPLACE FUNCTION public.force_generate_tournament_results(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_results_created INTEGER := 0;
  v_final_match RECORD;
  v_champion_id UUID;
  v_runner_up_id UUID;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Delete existing results
  DELETE FROM tournament_results WHERE tournament_id = p_tournament_id;
  
  -- Find final match
  SELECT * INTO v_final_match
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND round_number = (SELECT MAX(round_number) FROM tournament_matches WHERE tournament_id = p_tournament_id)
    AND match_number = 1
    AND status = 'completed'
    AND winner_id IS NOT NULL;
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Final match not found or not completed');
  END IF;
  
  v_champion_id := v_final_match.winner_id;
  v_runner_up_id := CASE 
    WHEN v_final_match.player1_id = v_champion_id THEN v_final_match.player2_id 
    ELSE v_final_match.player1_id 
  END;
  
  -- Create results for all participants
  WITH participant_stats AS (
    SELECT 
      tr.user_id,
      COUNT(tm.id) FILTER (WHERE (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id) AND tm.status = 'completed') as matches_played,
      COUNT(tm.id) FILTER (WHERE tm.winner_id = tr.user_id) as matches_won,
      COUNT(tm.id) FILTER (WHERE (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id) AND tm.status = 'completed' AND tm.winner_id != tr.user_id) as matches_lost
    FROM tournament_registrations tr
    LEFT JOIN tournament_matches tm ON tm.tournament_id = tr.tournament_id
    WHERE tr.tournament_id = p_tournament_id 
      AND tr.registration_status = 'confirmed'
    GROUP BY tr.user_id
  ),
  position_assigned AS (
    SELECT 
      ps.*,
      CASE 
        WHEN ps.user_id = v_champion_id THEN 1
        WHEN ps.user_id = v_runner_up_id THEN 2
        ELSE ROW_NUMBER() OVER (ORDER BY ps.matches_won DESC, ps.matches_lost ASC) + 2
      END as final_position,
      CASE 
        WHEN ps.matches_played > 0 THEN ROUND((ps.matches_won::numeric / ps.matches_played::numeric) * 100, 2)
        ELSE 0
      END as win_percentage
    FROM participant_stats ps
  )
  INSERT INTO tournament_results (
    tournament_id, user_id, final_position,
    matches_played, matches_won, matches_lost, win_percentage,
    spa_points_earned, elo_points_earned, prize_amount
  )
  SELECT 
    p_tournament_id,
    pa.user_id,
    pa.final_position,
    pa.matches_played,
    pa.matches_won,
    pa.matches_lost,
    pa.win_percentage,
    CASE pa.final_position
      WHEN 1 THEN 1500  
      WHEN 2 THEN 1000  
      WHEN 3 THEN 700   
      WHEN 4 THEN 500   
      ELSE 200          
    END as spa_points,
    CASE pa.final_position
      WHEN 1 THEN 100   
      WHEN 2 THEN 50    
      WHEN 3 THEN 30    
      WHEN 4 THEN 20    
      ELSE 10           
    END as elo_points,
    0 as prize_amount
  FROM position_assigned pa;
  
  GET DIAGNOSTICS v_results_created = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'results_created', v_results_created,
    'champion_id', v_champion_id,
    'runner_up_id', v_runner_up_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to generate tournament results: ' || SQLERRM
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.repair_tournament_advancement(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_fixed_matches INTEGER := 0;
  v_current_round INTEGER;
  v_max_round INTEGER;
BEGIN
  -- Get tournament round info
  SELECT 
    MIN(round_number) FILTER (WHERE status != 'completed'),
    MAX(round_number)
  INTO v_current_round, v_max_round
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id;
  
  -- Fix progression for each round
  FOR v_current_round IN 1..(v_max_round - 1) LOOP
    -- Find completed matches in current round that need advancement
    WITH completed_matches AS (
      SELECT id, winner_id, round_number
      FROM tournament_matches 
      WHERE tournament_id = p_tournament_id 
        AND round_number = v_current_round
        AND status = 'completed' 
        AND winner_id IS NOT NULL
    )
    UPDATE tournament_matches 
    SET player1_id = COALESCE(player1_id, cm.winner_id),
        player2_id = CASE 
          WHEN player1_id IS NOT NULL AND player1_id != cm.winner_id 
          THEN COALESCE(player2_id, cm.winner_id)
          ELSE player2_id 
        END,
        updated_at = NOW()
    FROM completed_matches cm
    WHERE tournament_matches.tournament_id = p_tournament_id
      AND tournament_matches.round_number = v_current_round + 1
      AND (tournament_matches.player1_id IS NULL OR tournament_matches.player2_id IS NULL);
      
    GET DIAGNOSTICS v_fixed_matches = ROW_COUNT;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'fixed_matches', v_fixed_matches,
    'message', 'Tournament advancement repaired'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to repair tournament advancement: ' || SQLERRM
    );
END;
$function$;