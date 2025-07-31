-- PART 1: Tournament SPA Points System

-- Function to calculate tournament SPA based on rank and position
CREATE OR REPLACE FUNCTION calculate_tournament_spa(
  p_position INTEGER,
  p_player_rank TEXT,
  p_tournament_type TEXT DEFAULT 'normal'
) RETURNS INTEGER AS $$
DECLARE
  v_base_points INTEGER;
  v_multiplier NUMERIC;
BEGIN
  -- Base points by position and rank (from SABO table)
  CASE 
    WHEN p_position = 1 THEN -- Champion
      CASE p_player_rank
        WHEN 'E+', 'E' THEN v_base_points := 1500;
        WHEN 'F+', 'F' THEN v_base_points := 1350;
        WHEN 'G+', 'G' THEN v_base_points := 1200;
        WHEN 'H+', 'H' THEN v_base_points := 1100;
        WHEN 'I+', 'I' THEN v_base_points := 1000;
        ELSE v_base_points := 900; -- K ranks
      END CASE;
      
    WHEN p_position = 2 THEN -- Runner-up
      CASE p_player_rank
        WHEN 'E+', 'E' THEN v_base_points := 1100;
        WHEN 'F+', 'F' THEN v_base_points := 1000;
        WHEN 'G+', 'G' THEN v_base_points := 900;
        WHEN 'H+', 'H' THEN v_base_points := 850;
        WHEN 'I+', 'I' THEN v_base_points := 800;
        ELSE v_base_points := 700;
      END CASE;
      
    WHEN p_position = 3 THEN -- 3rd place
      CASE p_player_rank
        WHEN 'E+', 'E' THEN v_base_points := 900;
        WHEN 'F+', 'F' THEN v_base_points := 800;
        WHEN 'G+', 'G' THEN v_base_points := 700;
        WHEN 'H+', 'H' THEN v_base_points := 650;
        WHEN 'I+', 'I' THEN v_base_points := 600;
        ELSE v_base_points := 500;
      END CASE;
      
    WHEN p_position = 4 THEN -- 4th place
      CASE p_player_rank
        WHEN 'E+', 'E' THEN v_base_points := 650;
        WHEN 'F+', 'F' THEN v_base_points := 550;
        WHEN 'G+', 'G' THEN v_base_points := 500;
        WHEN 'H+', 'H' THEN v_base_points := 450;
        WHEN 'I+', 'I' THEN v_base_points := 400;
        ELSE v_base_points := 350;
      END CASE;
      
    WHEN p_position <= 8 THEN -- Top 8
      CASE p_player_rank
        WHEN 'E+', 'E' THEN v_base_points := 320;
        WHEN 'F+', 'F' THEN v_base_points := 280;
        WHEN 'G+', 'G' THEN v_base_points := 250;
        WHEN 'H+', 'H' THEN v_base_points := 200;
        WHEN 'I+', 'I' THEN v_base_points := 150;
        ELSE v_base_points := 120;
      END CASE;
      
    ELSE -- Participation only
      CASE p_player_rank
        WHEN 'E+', 'E' THEN v_base_points := 120;
        WHEN 'F+', 'F' THEN v_base_points := 110;
        ELSE v_base_points := 100;
      END CASE;
  END CASE;
  
  -- Apply tournament type multiplier
  v_multiplier := CASE p_tournament_type
    WHEN 'season' THEN 1.5
    WHEN 'open' THEN 2.0
    ELSE 1.0
  END CASE;
  
  RETURN FLOOR(v_base_points * v_multiplier);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Update existing tournament completion function
CREATE OR REPLACE FUNCTION complete_tournament_with_spa()
RETURNS TRIGGER AS $$
DECLARE
  v_participant RECORD;
  v_spa_points INTEGER;
  v_rank_code TEXT;
BEGIN
  SET search_path = '';
  
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Process each participant
    FOR v_participant IN 
      SELECT 
        tr.*,
        r.code as rank_code
      FROM public.tournament_results tr
      JOIN public.player_rankings pr ON tr.player_id = pr.player_id
      JOIN public.ranks r ON pr.current_rank_id = r.id
      WHERE tr.tournament_id = NEW.id
    LOOP
      -- Calculate SPA points
      v_spa_points := calculate_tournament_spa(
        v_participant.position,
        v_participant.rank_code,
        NEW.tournament_type
      );
      
      -- Award SPA points
      PERFORM credit_spa_points(
        v_participant.player_id,
        v_spa_points,
        'tournament',
        format('Giải %s - Hạng %s', NEW.name, v_participant.position),
        NEW.id
      );
      
      -- Also award rank progression points for top 4
      IF v_participant.position <= 4 THEN
        UPDATE public.player_rankings
        SET rank_points = rank_points + 
          CASE v_participant.position
            WHEN 1 THEN 1.0
            WHEN 2 THEN 0.5
            WHEN 3 THEN 0.25
            WHEN 4 THEN 0.125
          END
        WHERE player_id = v_participant.player_id;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- PART 2: Challenge SPA Points with Daily Limits

-- Track daily challenges
CREATE TABLE IF NOT EXISTS public.daily_challenge_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL,
  challenge_date DATE NOT NULL,
  challenge_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, challenge_date)
);

-- Enable RLS on daily_challenge_stats
ALTER TABLE public.daily_challenge_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_challenge_stats
CREATE POLICY "Users can view their own daily stats" ON public.daily_challenge_stats
FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "System can manage daily stats" ON public.daily_challenge_stats
FOR ALL USING (true);

-- Challenge SPA calculation with daily limits
CREATE OR REPLACE FUNCTION calculate_challenge_spa(
  p_winner_id UUID,
  p_loser_id UUID,
  p_wager_amount INTEGER,
  p_race_to INTEGER
) RETURNS TABLE (
  winner_spa INTEGER,
  loser_spa INTEGER,
  daily_count INTEGER,
  reduction_applied BOOLEAN
) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_daily_count INTEGER;
  v_winner_rank_level INTEGER;
  v_loser_rank_level INTEGER;
  v_rank_diff INTEGER;
  v_base_winner_spa INTEGER;
  v_multiplier NUMERIC := 1.0;
BEGIN
  SET search_path = '';
  
  -- Get today's challenge count for winner
  SELECT challenge_count INTO v_daily_count
  FROM public.daily_challenge_stats
  WHERE player_id = p_winner_id AND challenge_date = v_today;
  
  IF v_daily_count IS NULL THEN
    v_daily_count := 0;
  END IF;
  
  -- Increment challenge count
  INSERT INTO public.daily_challenge_stats (player_id, challenge_date, challenge_count)
  VALUES (p_winner_id, v_today, 1)
  ON CONFLICT (player_id, challenge_date) 
  DO UPDATE SET 
    challenge_count = public.daily_challenge_stats.challenge_count + 1,
    updated_at = NOW();
  
  -- Get rank levels
  SELECT r.level INTO v_winner_rank_level
  FROM public.player_rankings pr
  JOIN public.ranks r ON pr.current_rank_id = r.id
  WHERE pr.player_id = p_winner_id;
  
  SELECT r.level INTO v_loser_rank_level
  FROM public.player_rankings pr
  JOIN public.ranks r ON pr.current_rank_id = r.id
  WHERE pr.player_id = p_loser_id;
  
  v_rank_diff := COALESCE(v_loser_rank_level, 1) - COALESCE(v_winner_rank_level, 1);
  
  -- Calculate base SPA based on wager and race-to
  CASE 
    WHEN p_wager_amount BETWEEN 600 AND 650 AND p_race_to = 22 THEN
      v_base_winner_spa := CASE 
        WHEN v_rank_diff <= 0 THEN 350
        WHEN v_rank_diff >= 1 THEN 400
        ELSE 350
      END;
    WHEN p_wager_amount BETWEEN 500 AND 550 AND p_race_to = 18 THEN
      v_base_winner_spa := CASE
        WHEN v_rank_diff <= 0 THEN 300
        WHEN v_rank_diff >= 1 THEN 340
        ELSE 300
      END;
    WHEN p_wager_amount BETWEEN 400 AND 450 AND p_race_to = 16 THEN
      v_base_winner_spa := CASE
        WHEN v_rank_diff <= 0 THEN 260
        WHEN v_rank_diff >= 1 THEN 300
        ELSE 260
      END;
    ELSE
      v_base_winner_spa := p_wager_amount / 2; -- Default 50% of wager
  END CASE;
  
  -- Apply daily limit reduction
  IF v_daily_count >= 2 THEN
    v_multiplier := 0.3; -- 30% for 3rd+ challenge
    reduction_applied := TRUE;
  ELSE
    reduction_applied := FALSE;
  END IF;
  
  -- Apply rank difference bonus (25% for beating higher rank)
  IF v_rank_diff > 0 THEN
    v_multiplier := v_multiplier * 1.25;
  END IF;
  
  winner_spa := FLOOR(v_base_winner_spa * v_multiplier);
  loser_spa := -FLOOR(p_wager_amount * 0.5); -- Loser always loses 50% of wager
  daily_count := v_daily_count + 1;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Enhanced challenge completion with SPA calculation
CREATE OR REPLACE FUNCTION complete_challenge_with_daily_limits(
  p_match_id UUID,
  p_winner_id UUID,
  p_loser_id UUID,
  p_wager_amount INTEGER,
  p_race_to INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_spa_calc RECORD;
  v_breakdown JSONB;
BEGIN
  SET search_path = '';
  
  -- Calculate SPA with daily limits
  SELECT * INTO v_spa_calc
  FROM calculate_challenge_spa(p_winner_id, p_loser_id, p_wager_amount, p_race_to);
  
  -- Award winner SPA
  PERFORM credit_spa_points(
    p_winner_id,
    v_spa_calc.winner_spa,
    'challenge_win',
    CASE 
      WHEN v_spa_calc.reduction_applied THEN 
        format('Thắng kèo (giảm điểm - kèo thứ %s)', v_spa_calc.daily_count)
      ELSE 'Thắng kèo thách đấu'
    END,
    p_match_id
  );
  
  -- Deduct loser SPA
  PERFORM debit_spa_points(
    p_loser_id,
    ABS(v_spa_calc.loser_spa),
    'challenge_loss',
    'Thua kèo thách đấu',
    p_match_id
  );
  
  -- Build breakdown for UI
  v_breakdown := jsonb_build_object(
    'winner_spa', v_spa_calc.winner_spa,
    'loser_spa', v_spa_calc.loser_spa,
    'daily_count', v_spa_calc.daily_count,
    'reduction_applied', v_spa_calc.reduction_applied,
    'wager_amount', p_wager_amount,
    'race_to', p_race_to
  );
  
  RETURN v_breakdown;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';