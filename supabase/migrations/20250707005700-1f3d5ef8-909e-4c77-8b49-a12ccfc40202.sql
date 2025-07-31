-- Advanced SPA Points System with Bonuses and Milestones

-- 1. STREAK BONUS (Chuỗi thắng)
CREATE OR REPLACE FUNCTION calculate_streak_bonus(
  p_player_id UUID,
  p_base_points INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_current_streak INTEGER;
  v_bonus_percent INTEGER;
BEGIN
  -- Get current win streak
  SELECT COUNT(*) INTO v_current_streak
  FROM (
    SELECT * FROM matches 
    WHERE (player1_id = p_player_id OR player2_id = p_player_id)
    AND status = 'completed'
    ORDER BY played_at DESC
    LIMIT 10
  ) recent_matches
  WHERE winner_id = p_player_id;
  
  -- Calculate bonus: 5% per win, max 50%
  v_bonus_percent := LEAST(v_current_streak * 5, 50);
  
  RETURN p_base_points * v_bonus_percent / 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2. COMEBACK BONUS (Quay lại sau nghỉ dài)
CREATE OR REPLACE FUNCTION calculate_comeback_bonus(
  p_player_id UUID
) RETURNS INTEGER AS $$
BEGIN
  -- If inactive 14-30 days, give comeback bonus
  IF EXISTS (
    SELECT 1 FROM matches
    WHERE (player1_id = p_player_id OR player2_id = p_player_id)
    AND played_at < NOW() - INTERVAL '14 days'
    AND played_at > NOW() - INTERVAL '30 days'
  ) THEN
    RETURN 50; -- Welcome back bonus
  END IF;
  
  RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 3. MILESTONE REWARDS
CREATE TABLE IF NOT EXISTS spa_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_type TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  reward_spa INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on spa_milestones
ALTER TABLE spa_milestones ENABLE ROW LEVEL SECURITY;

-- Policy to view milestones
CREATE POLICY "Everyone can view milestones" ON spa_milestones
FOR SELECT USING (true);

INSERT INTO spa_milestones (milestone_type, threshold, reward_spa, description) VALUES
('total_matches', 10, 100, 'Hoàn thành 10 trận đầu tiên'),
('total_matches', 50, 200, 'Chiến binh 50 trận'),
('total_matches', 100, 500, 'Huyền thoại 100 trận'),
('win_rate_50', 20, 150, 'Duy trì 50% win rate sau 20 trận'),
('tournament_wins', 1, 200, 'Vô địch giải đầu tiên'),
('perfect_match', 1, 100, 'Thắng không để đối thủ ghi điểm')
ON CONFLICT DO NOTHING;

-- 4. DYNAMIC MULTIPLIERS
CREATE OR REPLACE FUNCTION get_time_multiplier()
RETURNS NUMERIC AS $$
BEGIN
  -- Peak hours (7-10 PM): 1.2x
  IF EXTRACT(HOUR FROM NOW()) BETWEEN 19 AND 22 THEN
    RETURN 1.2;
  -- Off-peak morning (6-9 AM): 1.5x  
  ELSIF EXTRACT(HOUR FROM NOW()) BETWEEN 6 AND 9 THEN
    RETURN 1.5;
  END IF;
  
  RETURN 1.0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 5. Enhanced challenge completion with all bonuses
CREATE OR REPLACE FUNCTION complete_challenge_match_with_bonuses(
  p_match_id UUID,
  p_winner_id UUID,
  p_loser_id UUID,
  p_base_points INTEGER DEFAULT 100
) RETURNS JSONB AS $$
DECLARE
  v_base_points INTEGER;
  v_streak_bonus INTEGER;
  v_comeback_bonus INTEGER;
  v_time_multiplier NUMERIC;
  v_final_points INTEGER;
  v_loser_penalty INTEGER;
  v_breakdown JSONB;
BEGIN
  -- Get base points
  v_base_points := p_base_points;
  
  -- Calculate all bonuses
  v_streak_bonus := calculate_streak_bonus(p_winner_id, v_base_points);
  v_comeback_bonus := calculate_comeback_bonus(p_winner_id);
  v_time_multiplier := get_time_multiplier();
  
  -- Apply time multiplier to total
  v_final_points := ROUND((v_base_points + v_streak_bonus + v_comeback_bonus) * v_time_multiplier);
  v_loser_penalty := -ROUND(p_base_points * 0.5);
  
  -- Award points using existing function
  PERFORM credit_spa_points(
    p_winner_id,
    v_final_points,
    'challenge_win',
    format('Thắng thách đấu (+%s base, +%s streak, +%s comeback, x%.1f time)', 
      v_base_points, v_streak_bonus, v_comeback_bonus, v_time_multiplier),
    p_match_id
  );
  
  -- Deduct points from loser
  PERFORM debit_spa_points(
    p_loser_id,
    ABS(v_loser_penalty),
    'challenge_loss',
    'Thua thách đấu',
    p_match_id
  );
  
  -- Build breakdown for UI
  v_breakdown := jsonb_build_object(
    'basePoints', v_base_points,
    'streakBonus', v_streak_bonus,
    'comebackBonus', v_comeback_bonus,
    'timeMultiplier', v_time_multiplier,
    'finalPoints', v_final_points,
    'loserPenalty', v_loser_penalty
  );
  
  RETURN v_breakdown;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 6. Player milestone tracking
CREATE TABLE IF NOT EXISTS player_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL,
  milestone_id UUID NOT NULL REFERENCES spa_milestones(id),
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 100,
  claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, milestone_id)
);

-- Enable RLS on player_milestones
ALTER TABLE player_milestones ENABLE ROW LEVEL SECURITY;

-- Policy for player milestones
CREATE POLICY "Users can view their milestones" ON player_milestones
FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "System can manage milestones" ON player_milestones
FOR ALL USING (true);

-- 7. Function to check and award milestones
CREATE OR REPLACE FUNCTION check_and_award_milestones(p_player_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_total_matches INTEGER;
  v_win_rate NUMERIC;
  v_tournament_wins INTEGER;
  v_new_milestones JSONB := '[]'::jsonb;
  milestone_record RECORD;
BEGIN
  -- Get player stats
  SELECT 
    COALESCE(total_matches, 0),
    CASE WHEN total_matches > 0 THEN (wins::NUMERIC / total_matches * 100) ELSE 0 END,
    COALESCE(tournament_wins, 0)
  INTO v_total_matches, v_win_rate, v_tournament_wins
  FROM player_rankings
  WHERE player_id = p_player_id;
  
  -- Check for new milestones
  FOR milestone_record IN 
    SELECT * FROM spa_milestones 
    WHERE id NOT IN (
      SELECT milestone_id FROM player_milestones 
      WHERE player_id = p_player_id
    )
  LOOP
    CASE milestone_record.milestone_type
      WHEN 'total_matches' THEN
        IF v_total_matches >= milestone_record.threshold THEN
          INSERT INTO player_milestones (player_id, milestone_id)
          VALUES (p_player_id, milestone_record.id);
          
          -- Award SPA points
          PERFORM credit_spa_points(
            p_player_id,
            milestone_record.reward_spa,
            'milestone',
            milestone_record.description
          );
          
          v_new_milestones := v_new_milestones || jsonb_build_object(
            'type', milestone_record.milestone_type,
            'description', milestone_record.description,
            'reward', milestone_record.reward_spa
          );
        END IF;
      WHEN 'win_rate_50' THEN
        IF v_total_matches >= milestone_record.threshold AND v_win_rate >= 50 THEN
          INSERT INTO player_milestones (player_id, milestone_id)
          VALUES (p_player_id, milestone_record.id);
          
          PERFORM credit_spa_points(
            p_player_id,
            milestone_record.reward_spa,
            'milestone',
            milestone_record.description
          );
          
          v_new_milestones := v_new_milestones || jsonb_build_object(
            'type', milestone_record.milestone_type,
            'description', milestone_record.description,
            'reward', milestone_record.reward_spa
          );
        END IF;
      WHEN 'tournament_wins' THEN
        IF v_tournament_wins >= milestone_record.threshold THEN
          INSERT INTO player_milestones (player_id, milestone_id)
          VALUES (p_player_id, milestone_record.id);
          
          PERFORM credit_spa_points(
            p_player_id,
            milestone_record.reward_spa,
            'milestone',
            milestone_record.description
          );
          
          v_new_milestones := v_new_milestones || jsonb_build_object(
            'type', milestone_record.milestone_type,
            'description', milestone_record.description,
            'reward', milestone_record.reward_spa
          );
        END IF;
    END CASE;
  END LOOP;
  
  RETURN v_new_milestones;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';