-- Enhance user_streaks table for milestone tracking
ALTER TABLE public.user_streaks 
ADD COLUMN IF NOT EXISTS milestone_30_claimed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS milestone_60_claimed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS milestone_90_claimed BOOLEAN DEFAULT false;

-- Create practice sessions table
CREATE TABLE public.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID REFERENCES auth.users(id) NOT NULL,
  player2_id UUID REFERENCES auth.users(id) NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  location TEXT,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create player availability table
CREATE TABLE public.player_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT DEFAULT 'available', -- 'available_now', 'available_tonight', 'available_weekend', 'unavailable'
  available_until TIMESTAMP WITH TIME ZONE,
  location TEXT,
  max_distance_km INTEGER DEFAULT 5,
  preferred_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create rewards redemptions table
CREATE TABLE public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  reward_type TEXT NOT NULL, -- 'tournament_discount', 'badge', 'priority_listing'
  reward_value TEXT NOT NULL,
  points_cost INTEGER NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'active'
);

-- Enable RLS
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for practice_sessions
CREATE POLICY "Users can view practice sessions they're involved in"
ON public.practice_sessions FOR SELECT
USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Users can create practice sessions"
ON public.practice_sessions FOR INSERT
WITH CHECK (auth.uid() = player1_id);

CREATE POLICY "Users can update practice sessions they're involved in"
ON public.practice_sessions FOR UPDATE
USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- RLS Policies for player_availability
CREATE POLICY "Users can manage their own availability"
ON public.player_availability FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view player availability"
ON public.player_availability FOR SELECT
USING (true);

-- RLS Policies for reward_redemptions
CREATE POLICY "Users can view their own redemptions"
ON public.player_availability FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own redemptions"
ON public.reward_redemptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_practice_sessions_players ON public.practice_sessions(player1_id, player2_id);
CREATE INDEX idx_practice_sessions_time ON public.practice_sessions(scheduled_time);
CREATE INDEX idx_player_availability_status ON public.player_availability(status, available_until);
CREATE INDEX idx_reward_redemptions_user ON public.reward_redemptions(user_id, redeemed_at);

-- Add triggers for timestamps
CREATE TRIGGER update_practice_sessions_updated_at
BEFORE UPDATE ON public.practice_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_player_availability_updated_at
BEFORE UPDATE ON public.player_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enhance daily_checkin function with milestone bonuses
CREATE OR REPLACE FUNCTION public.daily_checkin(user_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  streak_record RECORD;
  points_earned INTEGER;
  days_diff INTEGER;
  milestone_bonus INTEGER := 0;
  milestone_message TEXT := '';
  result JSON;
BEGIN
  -- Get current streak record
  SELECT * INTO streak_record 
  FROM public.user_streaks 
  WHERE user_id = user_uuid;
  
  -- If no record exists, create one
  IF streak_record IS NULL THEN
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, total_points, last_checkin_date)
    VALUES (user_uuid, 1, 1, 10, CURRENT_DATE)
    RETURNING * INTO streak_record;
    
    result := json_build_object(
      'success', true,
      'points_earned', 10,
      'current_streak', 1,
      'total_points', 10,
      'message', 'Chúc mừng! Bạn đã check-in ngày đầu tiên!'
    );
    RETURN result;
  END IF;
  
  -- Check if already checked in today
  IF streak_record.last_checkin_date = CURRENT_DATE THEN
    result := json_build_object(
      'success', false,
      'message', 'Bạn đã check-in hôm nay rồi!',
      'current_streak', streak_record.current_streak,
      'total_points', streak_record.total_points
    );
    RETURN result;
  END IF;
  
  -- Calculate days difference
  days_diff := CURRENT_DATE - streak_record.last_checkin_date;
  
  -- Reset streak if more than 1 day gap
  IF days_diff > 1 THEN
    -- Reset streak
    points_earned := 10;
    UPDATE public.user_streaks 
    SET current_streak = 1,
        total_points = total_points + points_earned,
        last_checkin_date = CURRENT_DATE,
        updated_at = now()
    WHERE user_id = user_uuid;
    
    result := json_build_object(
      'success', true,
      'points_earned', points_earned,
      'current_streak', 1,
      'total_points', streak_record.total_points + points_earned,
      'message', 'Streak đã reset! Bắt đầu lại từ ngày 1.'
    );
  ELSE
    -- Continue streak
    IF streak_record.current_streak >= 6 THEN
      points_earned := 20;
    ELSE
      points_earned := 10;
    END IF;
    
    -- Check milestone bonuses
    IF streak_record.current_streak + 1 = 30 AND NOT streak_record.milestone_30_claimed THEN
      milestone_bonus := 50;
      milestone_message := ' 🎉 Cột mốc 30 ngày!';
    ELSIF streak_record.current_streak + 1 = 60 AND NOT streak_record.milestone_60_claimed THEN
      milestone_bonus := 50;
      milestone_message := ' 🎉 Cột mốc 60 ngày!';
    ELSIF streak_record.current_streak + 1 = 90 AND NOT streak_record.milestone_90_claimed THEN
      milestone_bonus := 50;
      milestone_message := ' 🎉 Cột mốc 90 ngày!';
    END IF;
    
    points_earned := points_earned + milestone_bonus;
    
    UPDATE public.user_streaks 
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        total_points = total_points + points_earned,
        last_checkin_date = CURRENT_DATE,
        milestone_30_claimed = CASE WHEN current_streak + 1 = 30 THEN true ELSE milestone_30_claimed END,
        milestone_60_claimed = CASE WHEN current_streak + 1 = 60 THEN true ELSE milestone_60_claimed END,
        milestone_90_claimed = CASE WHEN current_streak + 1 = 90 THEN true ELSE milestone_90_claimed END,
        updated_at = now()
    WHERE user_id = user_uuid;
    
    result := json_build_object(
      'success', true,
      'points_earned', points_earned,
      'current_streak', streak_record.current_streak + 1,
      'total_points', streak_record.total_points + points_earned,
      'message', format('🎉 +%s điểm! Streak: %s ngày%s', points_earned, streak_record.current_streak + 1, milestone_message)
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Function to redeem rewards
CREATE OR REPLACE FUNCTION public.redeem_reward(
  user_uuid UUID,
  reward_type TEXT,
  reward_value TEXT,
  points_cost INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_points INTEGER;
  result JSON;
BEGIN
  -- Get user's current points
  SELECT total_points INTO user_points
  FROM public.user_streaks
  WHERE user_id = user_uuid;
  
  -- Check if user has enough points
  IF user_points IS NULL OR user_points < points_cost THEN
    result := json_build_object(
      'success', false,
      'message', 'Không đủ điểm để đổi phần thưởng này'
    );
    RETURN result;
  END IF;
  
  -- Deduct points and create redemption record
  UPDATE public.user_streaks
  SET total_points = total_points - points_cost,
      updated_at = now()
  WHERE user_id = user_uuid;
  
  INSERT INTO public.reward_redemptions (user_id, reward_type, reward_value, points_cost)
  VALUES (user_uuid, reward_type, reward_value, points_cost);
  
  result := json_build_object(
    'success', true,
    'message', format('Đã đổi thành công! Còn lại %s điểm', user_points - points_cost),
    'remaining_points', user_points - points_cost
  );
  
  RETURN result;
END;
$$;

-- Enable realtime for new tables
ALTER TABLE public.practice_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.player_availability REPLICA IDENTITY FULL;
ALTER TABLE public.reward_redemptions REPLICA IDENTITY FULL;

ALTER publication supabase_realtime ADD TABLE public.practice_sessions;
ALTER publication supabase_realtime ADD TABLE public.player_availability;
ALTER publication supabase_realtime ADD TABLE public.reward_redemptions;