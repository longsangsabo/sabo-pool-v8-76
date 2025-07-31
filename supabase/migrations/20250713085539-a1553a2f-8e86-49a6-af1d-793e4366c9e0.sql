-- Add new fields for 3-step score confirmation workflow
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS score_entered_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS score_confirmed_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS challenger_final_score integer,
ADD COLUMN IF NOT EXISTS opponent_final_score integer,
ADD COLUMN IF NOT EXISTS score_entry_timestamp timestamp with time zone,
ADD COLUMN IF NOT EXISTS score_confirmation_timestamp timestamp with time zone;

-- Update score_confirmation_status to include new states
COMMENT ON COLUMN public.challenges.score_confirmation_status IS 'pending | score_entered | score_confirmed | club_confirmed | completed';

-- Add function to handle score confirmation workflow
CREATE OR REPLACE FUNCTION public.handle_score_workflow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- When score is first entered
  IF NEW.score_entered_by IS NOT NULL AND OLD.score_entered_by IS NULL THEN
    -- Notify the other player
    IF NEW.score_entered_by = NEW.challenger_id THEN
      -- Challenger entered score, notify opponent
      INSERT INTO public.notifications (user_id, type, title, message, metadata, priority)
      VALUES (
        NEW.opponent_id,
        'score_confirmation_needed',
        'Xác nhận tỷ số trận đấu',
        format('Đối thủ đã nhập tỷ số %s-%s. Vui lòng xác nhận hoặc chỉnh sửa.',
               COALESCE(NEW.challenger_final_score, 0),
               COALESCE(NEW.opponent_final_score, 0)),
        jsonb_build_object(
          'challenge_id', NEW.id,
          'challenger_score', NEW.challenger_final_score,
          'opponent_score', NEW.opponent_final_score,
          'entered_by', 'challenger'
        ),
        'high'
      );
    ELSE
      -- Opponent entered score, notify challenger
      INSERT INTO public.notifications (user_id, type, title, message, metadata, priority)
      VALUES (
        NEW.challenger_id,
        'score_confirmation_needed',
        'Xác nhận tỷ số trận đấu',
        format('Đối thủ đã nhập tỷ số %s-%s. Vui lòng xác nhận hoặc chỉnh sửa.',
               COALESCE(NEW.challenger_final_score, 0),
               COALESCE(NEW.opponent_final_score, 0)),
        jsonb_build_object(
          'challenge_id', NEW.id,
          'challenger_score', NEW.challenger_final_score,
          'opponent_score', NEW.opponent_final_score,
          'entered_by', 'opponent'
        ),
        'high'
      );
    END IF;
  END IF;

  -- When score is confirmed by other player
  IF NEW.score_confirmed_by IS NOT NULL AND OLD.score_confirmed_by IS NULL THEN
    -- Notify club owner for final confirmation
    IF NEW.club_id IS NOT NULL THEN
      -- Get club owner
      DECLARE
        club_owner_id uuid;
      BEGIN
        SELECT user_id INTO club_owner_id 
        FROM public.club_profiles 
        WHERE id = NEW.club_id;
        
        IF club_owner_id IS NOT NULL THEN
          INSERT INTO public.notifications (user_id, type, title, message, metadata, priority)
          VALUES (
            club_owner_id,
            'club_score_confirmation',
            'Xác nhận kết quả trận đấu',
            format('Trận đấu giữa %s và %s cần xác nhận kết quả cuối cùng.',
                   COALESCE((SELECT full_name FROM public.profiles WHERE user_id = NEW.challenger_id), 'Người chơi'),
                   COALESCE((SELECT full_name FROM public.profiles WHERE user_id = NEW.opponent_id), 'Người chơi')),
            jsonb_build_object(
              'challenge_id', NEW.id,
              'challenger_score', NEW.challenger_final_score,
              'opponent_score', NEW.opponent_final_score
            ),
            'high'
          );
        END IF;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for score workflow
DROP TRIGGER IF EXISTS challenge_score_workflow_trigger ON public.challenges;
CREATE TRIGGER challenge_score_workflow_trigger
  AFTER UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_score_workflow();