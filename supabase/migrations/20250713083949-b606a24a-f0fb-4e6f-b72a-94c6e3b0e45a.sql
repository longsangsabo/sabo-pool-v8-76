-- Add club confirmation fields to challenges table
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS challenger_submitted_score INTEGER;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS opponent_submitted_score INTEGER;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS challenger_score_submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS opponent_score_submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS club_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS club_confirmed_by UUID REFERENCES auth.users(id);
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS club_confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS score_confirmation_status TEXT DEFAULT 'pending';

-- Add constraint for score_confirmation_status if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'challenges_score_confirmation_status_check'
  ) THEN
    ALTER TABLE public.challenges ADD CONSTRAINT challenges_score_confirmation_status_check 
    CHECK (score_confirmation_status IN ('pending', 'waiting_confirmation', 'completed'));
  END IF;
END $$;

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
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') AND NEW.club_id IS NOT NULL THEN
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

-- Create trigger
DROP TRIGGER IF EXISTS notify_club_on_challenge_accepted_trigger ON public.challenges;
CREATE TRIGGER notify_club_on_challenge_accepted_trigger
  AFTER UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION notify_club_on_challenge_accepted();