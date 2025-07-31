-- Create mutual ratings table for users and clubs
CREATE TABLE IF NOT EXISTS public.mutual_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  rated_entity_type TEXT NOT NULL CHECK (rated_entity_type IN ('user', 'club')),
  rated_entity_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  context TEXT DEFAULT 'post_match',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.mutual_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view ratings they gave or received" 
ON public.mutual_ratings 
FOR SELECT 
USING (
  auth.uid() = rater_id OR 
  (rated_entity_type = 'user' AND auth.uid()::text = rated_entity_id::text) OR
  (rated_entity_type = 'club' AND auth.uid() IN (SELECT user_id FROM club_profiles WHERE id = rated_entity_id))
);

CREATE POLICY "Users can create their own ratings" 
ON public.mutual_ratings 
FOR INSERT 
WITH CHECK (auth.uid() = rater_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mutual_ratings_entity ON public.mutual_ratings(rated_entity_type, rated_entity_id);
CREATE INDEX IF NOT EXISTS idx_mutual_ratings_challenge ON public.mutual_ratings(challenge_id);
CREATE INDEX IF NOT EXISTS idx_mutual_ratings_rater ON public.mutual_ratings(rater_id);

-- Add auto_popup column to notifications table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'notifications' AND column_name = 'auto_popup') THEN
    ALTER TABLE public.notifications ADD COLUMN auto_popup BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Function to calculate average ratings for entities
CREATE OR REPLACE FUNCTION public.get_entity_rating(entity_type TEXT, entity_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'average_rating', COALESCE(ROUND(AVG(rating), 1), 0),
    'total_ratings', COUNT(*),
    'rating_breakdown', COALESCE(json_object_agg(rating, rating_count) FILTER (WHERE rating IS NOT NULL), '{}'::json)
  ) INTO result
  FROM (
    SELECT rating, COUNT(*) as rating_count
    FROM public.mutual_ratings 
    WHERE rated_entity_type = entity_type 
    AND rated_entity_id = entity_id
    GROUP BY rating
  ) breakdown;
  
  RETURN COALESCE(result, json_build_object('average_rating', 0, 'total_ratings', 0, 'rating_breakdown', '{}'::json));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create challenge completion notifications
CREATE OR REPLACE FUNCTION public.create_challenge_completion_notifications()
RETURNS TRIGGER AS $$
DECLARE
  challenger_name TEXT;
  opponent_name TEXT;
BEGIN
  -- When club_confirmed changes to true
  IF NEW.club_confirmed = true AND (OLD.club_confirmed IS FALSE OR OLD.club_confirmed IS NULL) THEN
    
    -- Get player names
    SELECT full_name INTO challenger_name 
    FROM public.profiles WHERE user_id = NEW.challenger_id;
    
    SELECT full_name INTO opponent_name 
    FROM public.profiles WHERE user_id = NEW.opponent_id;
    
    -- Create notification for challenger
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      auto_popup,
      priority
    ) VALUES (
      NEW.challenger_id,
      'challenge_completed',
      'Trận đấu đã hoàn thành',
      format('Trận đấu với %s đã được CLB xác nhận. Hãy đánh giá đối thủ và CLB!', 
             COALESCE(opponent_name, 'Đối thủ')),
      jsonb_build_object(
        'challenge_id', NEW.id,
        'opponent_id', NEW.opponent_id,
        'club_id', NEW.club_id,
        'final_score', format('%s-%s', 
          COALESCE(NEW.challenger_final_score, 0), 
          COALESCE(NEW.opponent_final_score, 0)),
        'requires_rating', true
      ),
      true, -- Auto popup on login
      'high'
    );
    
    -- Create notification for opponent (if exists)
    IF NEW.opponent_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id,
        type, 
        title,
        message,
        metadata,
        auto_popup,
        priority
      ) VALUES (
        NEW.opponent_id,
        'challenge_completed', 
        'Trận đấu đã hoàn thành',
        format('Trận đấu với %s đã được CLB xác nhận. Hãy đánh giá đối thủ và CLB!',
               COALESCE(challenger_name, 'Đối thủ')),
        jsonb_build_object(
          'challenge_id', NEW.id,
          'opponent_id', NEW.challenger_id, 
          'club_id', NEW.club_id,
          'final_score', format('%s-%s', 
            COALESCE(NEW.opponent_final_score, 0), 
            COALESCE(NEW.challenger_final_score, 0)),
          'requires_rating', true
        ),
        true,
        'high'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for challenge completion notifications
DROP TRIGGER IF EXISTS challenge_completion_notifications ON public.challenges;
CREATE TRIGGER challenge_completion_notifications
  AFTER UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.create_challenge_completion_notifications();

-- Function to update mutual_ratings updated_at
CREATE OR REPLACE FUNCTION public.update_mutual_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_mutual_ratings_updated_at
  BEFORE UPDATE ON public.mutual_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mutual_ratings_updated_at();