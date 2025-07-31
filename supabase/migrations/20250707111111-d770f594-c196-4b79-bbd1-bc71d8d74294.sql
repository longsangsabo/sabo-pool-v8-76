-- Fix tournament registration notification function
CREATE OR REPLACE FUNCTION public.notify_tournament_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tournament_name TEXT;
  player_name TEXT;
  organizer_id UUID;
BEGIN
  -- Get tournament and player names
  SELECT name, created_by INTO tournament_name, organizer_id 
  FROM public.tournaments 
  WHERE id = NEW.tournament_id;
  
  SELECT full_name INTO player_name 
  FROM public.profiles 
  WHERE user_id = NEW.player_id;
  
  -- Only send notification if we have an organizer
  IF organizer_id IS NOT NULL THEN
    -- Notify tournament organizer about new registration
    PERFORM public.create_notification(
      organizer_id,
      'tournament_registration',
      'Đăng ký giải đấu mới',
      format('%s đã đăng ký tham gia giải đấu "%s"', 
             COALESCE(player_name, 'Người chơi'), 
             COALESCE(tournament_name, 'Giải đấu')),
      format('/tournaments/%s', NEW.tournament_id),
      jsonb_build_object(
        'tournament_id', NEW.tournament_id,
        'player_id', NEW.player_id,
        'registration_id', NEW.id
      ),
      'normal'
    );
  END IF;
  
  RETURN NEW;
END;
$$;