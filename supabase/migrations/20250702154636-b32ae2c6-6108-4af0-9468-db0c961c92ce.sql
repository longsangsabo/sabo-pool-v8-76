-- Create user streaks table for daily check-ins
CREATE TABLE public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  last_checkin_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own streaks" 
ON public.user_streaks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak" 
ON public.user_streaks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks" 
ON public.user_streaks 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_user_streaks_user_id ON public.user_streaks(user_id);
CREATE INDEX idx_user_streaks_last_checkin ON public.user_streaks(last_checkin_date);

-- Create trigger for updated_at
CREATE TRIGGER update_user_streaks_updated_at
BEFORE UPDATE ON public.user_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle daily check-in
CREATE OR REPLACE FUNCTION public.daily_checkin(user_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  streak_record RECORD;
  points_earned INTEGER;
  days_diff INTEGER;
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
    
    UPDATE public.user_streaks 
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        total_points = total_points + points_earned,
        last_checkin_date = CURRENT_DATE,
        updated_at = now()
    WHERE user_id = user_uuid;
    
    result := json_build_object(
      'success', true,
      'points_earned', points_earned,
      'current_streak', streak_record.current_streak + 1,
      'total_points', streak_record.total_points + points_earned,
      'message', format('🎉 +%s điểm! Streak: %s ngày', points_earned, streak_record.current_streak + 1)
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Enable realtime for user_streaks
ALTER TABLE public.user_streaks REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.user_streaks;