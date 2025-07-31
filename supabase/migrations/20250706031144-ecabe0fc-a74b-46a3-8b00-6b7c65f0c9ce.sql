-- PHASE 1: SABO Pool Ranking System Database Schema (Fixed)

-- 1. Master rank definitions (K to E+)
CREATE TABLE IF NOT EXISTS public.ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(3) UNIQUE NOT NULL, -- 'K', 'K+', 'I', 'I+', etc
  name TEXT NOT NULL,
  level INTEGER UNIQUE NOT NULL, -- K=1, K+=2, I=3... E+=12
  skill_description TEXT,
  requirements JSONB DEFAULT '{}', -- Detailed skill requirements
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;

-- Everyone can view ranks
CREATE POLICY "Everyone can view ranks" ON public.ranks FOR SELECT USING (true);

-- Only admins can manage ranks
CREATE POLICY "Admins can manage ranks" ON public.ranks FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true));

-- 2. Player current ranking & points
CREATE TABLE IF NOT EXISTS public.player_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.profiles(user_id) UNIQUE,
  current_rank_id UUID REFERENCES public.ranks(id),
  rank_points DECIMAL(3,2) DEFAULT 0, -- Points toward next rank (0-1.0)
  spa_points INTEGER DEFAULT 0, -- Total SPA points
  season_start DATE DEFAULT CURRENT_DATE,
  total_matches INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  verified_by UUID REFERENCES public.club_profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.player_rankings ENABLE ROW LEVEL SECURITY;

-- Everyone can view player rankings
CREATE POLICY "Everyone can view player rankings" ON public.player_rankings FOR SELECT USING (true);

-- Players can update their own rankings (through system functions)
CREATE POLICY "Players can manage own rankings" ON public.player_rankings FOR ALL 
USING (auth.uid() = player_id);

-- Club owners can update rankings they verified
CREATE POLICY "Club owners can update verified rankings" ON public.player_rankings FOR UPDATE
USING (auth.uid() IN (SELECT user_id FROM public.club_profiles WHERE id = verified_by));

-- 3. SPA points tracking (separate tournament vs challenge)
CREATE TABLE IF NOT EXISTS public.spa_points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.profiles(user_id),
  source_type TEXT CHECK (source_type IN ('tournament', 'challenge', 'checkin', 'video', 'decay')),
  source_id UUID, -- tournament_id or challenge_id
  points_earned INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.spa_points_log ENABLE ROW LEVEL SECURITY;

-- Players can view their own points log
CREATE POLICY "Players can view own points log" ON public.spa_points_log FOR SELECT 
USING (auth.uid() = player_id);

-- Everyone can view points log (for transparency)
CREATE POLICY "Everyone can view points log" ON public.spa_points_log FOR SELECT USING (true);

-- System can insert points log
CREATE POLICY "System can insert points log" ON public.spa_points_log FOR INSERT WITH CHECK (true);

-- 4. Ranking history (for tracking progression)
CREATE TABLE IF NOT EXISTS public.ranking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.profiles(user_id),
  old_rank_id UUID REFERENCES public.ranks(id),
  new_rank_id UUID REFERENCES public.ranks(id),
  promotion_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_points_earned DECIMAL(3,2),
  season INTEGER
);

-- Enable RLS
ALTER TABLE public.ranking_history ENABLE ROW LEVEL SECURITY;

-- Players can view their own ranking history
CREATE POLICY "Players can view own ranking history" ON public.ranking_history FOR SELECT 
USING (auth.uid() = player_id);

-- Everyone can view ranking history
CREATE POLICY "Everyone can view ranking history" ON public.ranking_history FOR SELECT USING (true);

-- System can insert ranking history
CREATE POLICY "System can insert ranking history" ON public.ranking_history FOR INSERT WITH CHECK (true);

-- Insert all 12 ranks from K to E+
INSERT INTO public.ranks (code, name, level, skill_description, requirements) VALUES
('K', 'Beginner', 1, 'Đi 2-4 bi (phần lớn ăn may), chưa nắm kỹ thuật', '{"min_consecutive_balls": 2, "max_consecutive_balls": 4, "clear_rate": 0.1}'),
('K+', 'Beginner+', 2, 'Đi 3-4 bi khi hình dễ, hiểu luật và kỹ thuật cơ bản', '{"min_consecutive_balls": 3, "max_consecutive_balls": 4, "clear_rate": 0.15}'),
('I', 'Novice', 3, 'Đi 3-5 bi tùy hình, chưa clear chấm', '{"min_consecutive_balls": 3, "max_consecutive_balls": 5, "clear_rate": 0.2}'),
('I+', 'Novice+', 4, 'Đi 4-5 bi, nhắm & kê cơ ngày càng chắc', '{"min_consecutive_balls": 4, "max_consecutive_balls": 5, "clear_rate": 0.25}'),
('H', 'Intermediate', 5, 'Đi 5-6 bi, có thể clear 1 chấm "rùa" hình thuận', '{"min_consecutive_balls": 5, "max_consecutive_balls": 6, "clear_rate": 0.3}'),
('H+', 'Intermediate+', 6, 'Đi 6-8 bi liên tục, có thể clear 1 chấm trong hình dễ', '{"min_consecutive_balls": 6, "max_consecutive_balls": 8, "clear_rate": 0.4}'),
('G', 'Advanced', 7, 'Clear 1 chấm + 3-7 bi kế tiếp', '{"min_consecutive_balls": 7, "max_consecutive_balls": 10, "clear_rate": 0.5}'),
('G+', 'Advanced+', 8, 'Clear 1 chấm + thêm 3-7 bi, có thể phá 2 chấm hình đẹp', '{"min_consecutive_balls": 8, "max_consecutive_balls": 12, "clear_rate": 0.6}'),
('F', 'Expert', 9, 'Clear 1 chấm ≈ 60%, điều bi & safety cơ bản chắc tay', '{"min_consecutive_balls": 10, "max_consecutive_balls": 15, "clear_rate": 0.6}'),
('F+', 'Expert+', 10, 'Clear 1 chấm > 70%, bắt đầu phá 2 chấm khi bi dàn trải', '{"min_consecutive_balls": 12, "max_consecutive_balls": 18, "clear_rate": 0.7}'),
('E', 'Master', 11, 'Clear 1 chấm rất ổn định, có thể phá 2 chấm khi hình thuận', '{"min_consecutive_balls": 15, "max_consecutive_balls": 25, "clear_rate": 0.8}'),
('E+', 'Master+', 12, 'Clear 1 chấm > 90%, phá 2 chấm ở hầu hết tình huống', '{"min_consecutive_balls": 20, "max_consecutive_balls": 50, "clear_rate": 0.9}')
ON CONFLICT (code) DO NOTHING;

-- Function to award tournament points
CREATE OR REPLACE FUNCTION public.award_tournament_points(
  p_tournament_id UUID,
  p_player_id UUID,
  p_position INTEGER,
  p_player_rank VARCHAR(3)
) RETURNS INTEGER AS $$
DECLARE
  v_base_points INTEGER;
  v_multiplier DECIMAL;
  v_final_points INTEGER;
BEGIN
  -- Get base points based on position and rank
  CASE p_position
    WHEN 1 THEN -- Champion
      CASE p_player_rank
        WHEN 'E+', 'E' THEN v_base_points := 1500;
        WHEN 'F+', 'F' THEN v_base_points := 1350;
        WHEN 'G+', 'G' THEN v_base_points := 1200;
        WHEN 'H+', 'H' THEN v_base_points := 1100;
        WHEN 'I+', 'I' THEN v_base_points := 1000;
        ELSE v_base_points := 900;
      END CASE;
    WHEN 2 THEN -- Runner-up (70% of champion points)
      CASE p_player_rank
        WHEN 'E+', 'E' THEN v_base_points := 1050;
        WHEN 'F+', 'F' THEN v_base_points := 945;
        WHEN 'G+', 'G' THEN v_base_points := 840;
        WHEN 'H+', 'H' THEN v_base_points := 770;
        WHEN 'I+', 'I' THEN v_base_points := 700;
        ELSE v_base_points := 630;
      END CASE;
    WHEN 3 THEN -- Third place (50% of champion points)
      CASE p_player_rank
        WHEN 'E+', 'E' THEN v_base_points := 750;
        WHEN 'F+', 'F' THEN v_base_points := 675;
        WHEN 'G+', 'G' THEN v_base_points := 600;
        WHEN 'H+', 'H' THEN v_base_points := 550;
        WHEN 'I+', 'I' THEN v_base_points := 500;
        ELSE v_base_points := 450;
      END CASE;
    ELSE -- Participation (20% of champion points)
      CASE p_player_rank
        WHEN 'E+', 'E' THEN v_base_points := 300;
        WHEN 'F+', 'F' THEN v_base_points := 270;
        WHEN 'G+', 'G' THEN v_base_points := 240;
        WHEN 'H+', 'H' THEN v_base_points := 220;
        WHEN 'I+', 'I' THEN v_base_points := 200;
        ELSE v_base_points := 180;
      END CASE;
  END CASE;

  -- Apply tournament type multiplier (default 1.0 if tournaments table doesn't exist yet)
  SELECT COALESCE(
    CASE 
      WHEN metadata->>'season' = 'true' THEN 1.5
      WHEN metadata->>'type' = 'open' THEN 2.0
      ELSE 1.0
    END, 1.0
  ) INTO v_multiplier;

  v_final_points := ROUND(v_base_points * v_multiplier);

  -- Log the points
  INSERT INTO public.spa_points_log (player_id, source_type, source_id, points_earned, description)
  VALUES (p_player_id, 'tournament', p_tournament_id, v_final_points, 
          format('Tournament position %s points (rank %s)', p_position, p_player_rank));

  -- Update player's SPA points
  INSERT INTO public.player_rankings (player_id, spa_points, total_matches)
  VALUES (p_player_id, v_final_points, 1)
  ON CONFLICT (player_id) DO UPDATE SET
    spa_points = player_rankings.spa_points + v_final_points,
    total_matches = player_rankings.total_matches + 1,
    updated_at = NOW();

  RETURN v_final_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award challenge points with daily limits
CREATE OR REPLACE FUNCTION public.award_challenge_points(
  p_winner_id UUID,
  p_loser_id UUID,
  p_wager_points INTEGER,
  p_rank_difference DECIMAL DEFAULT 0
) RETURNS INTEGER AS $$
DECLARE
  v_winner_points INTEGER;
  v_loser_points INTEGER;
  v_multiplier DECIMAL := 1.0;
  v_daily_count INTEGER;
BEGIN
  -- Check daily challenge count for winner
  SELECT COUNT(*) INTO v_daily_count
  FROM public.spa_points_log
  WHERE player_id = p_winner_id
    AND source_type = 'challenge'
    AND created_at >= CURRENT_DATE;

  -- Apply daily limit multiplier
  IF v_daily_count >= 2 THEN
    v_multiplier := 0.3; -- 3rd+ challenge gets 30% points
  END IF;

  -- Calculate winner points
  v_winner_points := p_wager_points;
  
  -- Rank difference bonus (25% bonus for beating higher rank)
  IF p_rank_difference >= 0.5 THEN
    v_winner_points := ROUND(v_winner_points * 1.25);
  END IF;

  -- Apply daily multiplier
  v_winner_points := ROUND(v_winner_points * v_multiplier);

  -- Calculate loser points (loses 50% of wager)
  v_loser_points := -ROUND(p_wager_points * 0.5);

  -- Log winner points
  INSERT INTO public.spa_points_log (player_id, source_type, points_earned, description)
  VALUES (p_winner_id, 'challenge', v_winner_points, 
          format('Won challenge (%s daily)', v_daily_count + 1));

  -- Log loser points
  INSERT INTO public.spa_points_log (player_id, source_type, points_earned, description)
  VALUES (p_loser_id, 'challenge', v_loser_points, 'Lost challenge');

  -- Update player SPA points
  INSERT INTO public.player_rankings (player_id, spa_points, total_matches, wins)
  VALUES (p_winner_id, v_winner_points, 1, 1)
  ON CONFLICT (player_id) DO UPDATE SET
    spa_points = player_rankings.spa_points + v_winner_points,
    total_matches = player_rankings.total_matches + 1,
    wins = player_rankings.wins + 1,
    updated_at = NOW();

  INSERT INTO public.player_rankings (player_id, spa_points, total_matches)
  VALUES (p_loser_id, v_loser_points, 1)
  ON CONFLICT (player_id) DO UPDATE SET
    spa_points = GREATEST(0, player_rankings.spa_points + v_loser_points), -- Don't go below 0
    total_matches = player_rankings.total_matches + 1,
    updated_at = NOW();

  RETURN v_winner_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and promote rank based on SPA points (Fixed)
CREATE OR REPLACE FUNCTION public.check_rank_promotion(p_player_id UUID) 
RETURNS BOOLEAN AS $$
DECLARE
  v_current_rank_id UUID;
  v_current_rank_level INTEGER;
  v_current_rank_code VARCHAR(3);
  v_next_rank_id UUID;
  v_next_rank_code VARCHAR(3);
  v_spa_points INTEGER;
  v_promoted BOOLEAN := FALSE;
BEGIN
  -- Get current player ranking info
  SELECT pr.spa_points, pr.current_rank_id, r.level, r.code
  INTO v_spa_points, v_current_rank_id, v_current_rank_level, v_current_rank_code
  FROM public.player_rankings pr
  LEFT JOIN public.ranks r ON pr.current_rank_id = r.id
  WHERE pr.player_id = p_player_id;

  -- If no ranking exists, start with K rank
  IF v_current_rank_id IS NULL THEN
    SELECT id INTO v_current_rank_id FROM public.ranks WHERE code = 'K';
    
    INSERT INTO public.player_rankings (player_id, current_rank_id, spa_points)
    VALUES (p_player_id, v_current_rank_id, COALESCE(v_spa_points, 0))
    ON CONFLICT (player_id) DO UPDATE SET current_rank_id = v_current_rank_id;
    
    RETURN FALSE;
  END IF;

  -- Check if eligible for promotion (need 1000+ SPA points for next rank)
  IF v_spa_points >= 1000 THEN
    -- Get next rank
    SELECT id, code INTO v_next_rank_id, v_next_rank_code
    FROM public.ranks 
    WHERE level = v_current_rank_level + 1;

    IF v_next_rank_id IS NOT NULL THEN
      -- Promote player
      UPDATE public.player_rankings 
      SET current_rank_id = v_next_rank_id,
          spa_points = v_spa_points - 1000, -- Consume 1000 points for promotion
          updated_at = NOW()
      WHERE player_id = p_player_id;

      -- Log promotion history
      INSERT INTO public.ranking_history (player_id, old_rank_id, new_rank_id, total_points_earned)
      VALUES (p_player_id, v_current_rank_id, v_next_rank_id, 1.0);

      -- Create notification
      INSERT INTO public.notifications (user_id, type, title, message, action_url, priority)
      VALUES (p_player_id, 'rank_promotion', 'Chúc mừng thăng hạng!', 
              format('Bạn đã thăng hạng từ %s lên %s', v_current_rank_code, v_next_rank_code),
              '/profile?tab=ranking', 'high');

      v_promoted := TRUE;
    END IF;
  END IF;

  RETURN v_promoted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check rank promotion after SPA points update
CREATE OR REPLACE FUNCTION public.trigger_rank_promotion_check()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.check_rank_promotion(NEW.player_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_promotion_after_points_update
  AFTER INSERT OR UPDATE ON public.player_rankings
  FOR EACH ROW EXECUTE FUNCTION public.trigger_rank_promotion_check();

-- Add updated_at trigger for player_rankings
CREATE TRIGGER update_player_rankings_updated_at
  BEFORE UPDATE ON public.player_rankings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();