-- Fix notify_challenge_created function to handle open challenges properly
CREATE OR REPLACE FUNCTION public.notify_challenge_created()
RETURNS trigger AS $$
DECLARE
  challenger_name TEXT;
BEGIN
  -- Only create notification for direct challenges (opponent_id is not null)
  IF NEW.opponent_id IS NOT NULL THEN
    -- Get challenger name
    SELECT full_name INTO challenger_name
    FROM public.profiles
    WHERE user_id = NEW.challenger_id;
    
    -- Create notification for the opponent
    PERFORM public.create_notification(
      NEW.opponent_id,
      'challenge_received',
      'Thách đấu mới',
      format('%s đã thách đấu bạn với mức cược %s điểm', 
             COALESCE(challenger_name, 'Ai đó'), 
             COALESCE(NEW.bet_points::TEXT, '0')),
      format('/challenges/%s', NEW.id),
      jsonb_build_object(
        'challenge_id', NEW.id,
        'challenger_id', NEW.challenger_id,
        'bet_points', NEW.bet_points
      ),
      'high'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';