-- Add club confirmation fields to challenges table
ALTER TABLE public.challenges ADD COLUMN challenger_submitted_score INTEGER;
ALTER TABLE public.challenges ADD COLUMN opponent_submitted_score INTEGER;
ALTER TABLE public.challenges ADD COLUMN challenger_score_submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.challenges ADD COLUMN opponent_score_submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.challenges ADD COLUMN club_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.challenges ADD COLUMN club_confirmed_by UUID REFERENCES auth.users(id);
ALTER TABLE public.challenges ADD COLUMN club_confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.challenges ADD COLUMN score_confirmation_status TEXT DEFAULT 'pending' CHECK (score_confirmation_status IN ('pending', 'waiting_confirmation', 'completed'));

-- Create notifications table if not exists (for club owner notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications  
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to notify club owner when challenge status changes to accepted
CREATE OR REPLACE FUNCTION notify_club_on_challenge_accepted()
RETURNS TRIGGER AS $$
DECLARE
  club_owner_id UUID;
  challenger_name TEXT;
  opponent_name TEXT;
  club_name TEXT;
BEGIN
  -- Only notify when status changes to 'accepted'
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' AND NEW.club_id IS NOT NULL THEN
    -- Get club owner ID
    SELECT user_id INTO club_owner_id
    FROM public.club_profiles
    WHERE id = NEW.club_id;
    
    -- Get player names
    SELECT full_name INTO challenger_name
    FROM public.profiles
    WHERE user_id = NEW.challenger_id;
    
    SELECT full_name INTO opponent_name  
    FROM public.profiles
    WHERE user_id = NEW.opponent_id;
    
    -- Get club name
    SELECT club_name INTO club_name
    FROM public.club_profiles
    WHERE id = NEW.club_id;
    
    -- Create notification for club owner
    IF club_owner_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, 
        type, 
        title, 
        message,
        metadata
      ) VALUES (
        club_owner_id,
        'challenge_accepted_at_club',
        'Thách đấu mới tại club',
        format('Trận đấu giữa %s và %s sẽ diễn ra tại %s. Vui lòng theo dõi và xác nhận kết quả.',
               COALESCE(challenger_name, 'Người chơi'),
               COALESCE(opponent_name, 'Người chơi'),
               COALESCE(club_name, 'CLB của bạn')),
        jsonb_build_object(
          'challenge_id', NEW.id,
          'challenger_id', NEW.challenger_id,
          'opponent_id', NEW.opponent_id,
          'club_id', NEW.club_id,
          'bet_points', NEW.bet_points
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;