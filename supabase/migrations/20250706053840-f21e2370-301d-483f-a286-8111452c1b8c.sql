-- Enable realtime for club management tables (skip notifications - already exists)
ALTER TABLE public.rank_verifications REPLICA IDENTITY FULL;
ALTER TABLE public.club_stats REPLICA IDENTITY FULL;
ALTER TABLE public.club_profiles REPLICA IDENTITY FULL;
ALTER TABLE public.matches REPLICA IDENTITY FULL;
ALTER TABLE public.tournaments REPLICA IDENTITY FULL;
ALTER TABLE public.memberships REPLICA IDENTITY FULL;

-- Add tables to realtime publication (skip notifications)
DO $$
BEGIN
  -- Add rank_verifications if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'rank_verifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rank_verifications;
  END IF;
  
  -- Add club_stats if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'club_stats'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.club_stats;
  END IF;
  
  -- Add club_profiles if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'club_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.club_profiles;
  END IF;
  
  -- Add matches if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'matches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
  END IF;
  
  -- Add tournaments if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'tournaments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
  END IF;
  
  -- Add memberships if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'memberships'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.memberships;
  END IF;
END $$;

-- Create function to auto-update club stats
CREATE OR REPLACE FUNCTION update_club_stats()
RETURNS TRIGGER AS $$
DECLARE
  club_id_var UUID;
  current_month INTEGER;
  current_year INTEGER;
BEGIN
  -- Get club ID from the triggering table
  IF TG_TABLE_NAME = 'rank_verifications' THEN
    club_id_var := COALESCE(NEW.club_id, OLD.club_id);
  ELSIF TG_TABLE_NAME = 'matches' THEN
    club_id_var := COALESCE(NEW.club_id, OLD.club_id);
  ELSIF TG_TABLE_NAME = 'tournaments' THEN
    club_id_var := COALESCE(NEW.club_id, OLD.club_id);
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF club_id_var IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);

  -- Update or insert club stats
  INSERT INTO public.club_stats (
    club_id, 
    month, 
    year,
    verified_members,
    total_matches_hosted,
    active_members
  )
  VALUES (
    club_id_var,
    current_month,
    current_year,
    (SELECT COUNT(*) FROM rank_verifications WHERE club_id = club_id_var AND status = 'approved'),
    (SELECT COUNT(*) FROM matches WHERE club_id = club_id_var AND EXTRACT(MONTH FROM created_at) = current_month),
    (SELECT COUNT(DISTINCT player_id) FROM rank_verifications WHERE club_id = club_id_var AND status = 'approved')
  )
  ON CONFLICT (club_id, month, year) 
  DO UPDATE SET
    verified_members = (SELECT COUNT(*) FROM rank_verifications WHERE club_id = club_id_var AND status = 'approved'),
    total_matches_hosted = (SELECT COUNT(*) FROM matches WHERE club_id = club_id_var AND EXTRACT(MONTH FROM created_at) = current_month),
    active_members = (SELECT COUNT(DISTINCT player_id) FROM rank_verifications WHERE club_id = club_id_var AND status = 'approved'),
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for auto-updating club stats
DROP TRIGGER IF EXISTS trigger_update_club_stats_verifications ON public.rank_verifications;
CREATE TRIGGER trigger_update_club_stats_verifications
  AFTER INSERT OR UPDATE OR DELETE ON public.rank_verifications
  FOR EACH ROW EXECUTE FUNCTION update_club_stats();

DROP TRIGGER IF EXISTS trigger_update_club_stats_matches ON public.matches;
CREATE TRIGGER trigger_update_club_stats_matches
  AFTER INSERT OR UPDATE OR DELETE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION update_club_stats();

DROP TRIGGER IF EXISTS trigger_update_club_stats_tournaments ON public.tournaments;
CREATE TRIGGER trigger_update_club_stats_tournaments
  AFTER INSERT OR UPDATE OR DELETE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION update_club_stats();

-- Create automated notification system for club owners
CREATE OR REPLACE FUNCTION notify_club_events()
RETURNS TRIGGER AS $$  
DECLARE
  club_owner_id UUID;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Get club owner ID
  SELECT user_id INTO club_owner_id
  FROM public.club_profiles 
  WHERE id = COALESCE(NEW.club_id, OLD.club_id);

  IF club_owner_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Create notifications based on trigger
  IF TG_TABLE_NAME = 'rank_verifications' AND TG_OP = 'INSERT' THEN
    notification_title := 'Yêu cầu xác thực hạng mới';
    notification_message := format('Có yêu cầu xác thực hạng %s cần được xử lý', NEW.requested_rank);
    
    PERFORM public.create_notification(
      club_owner_id,
      'rank_verification_request',
      notification_title,
      notification_message,
      format('/club-management?tab=rank-verification&request=%s', NEW.id),
      jsonb_build_object('request_id', NEW.id, 'rank', NEW.requested_rank),
      'high'
    );
    
  ELSIF TG_TABLE_NAME = 'matches' AND TG_OP = 'INSERT' THEN
    notification_title := 'Trận đấu mới tại CLB';
    notification_message := 'Có trận đấu mới được tổ chức tại câu lạc bộ của bạn';
    
    PERFORM public.create_notification(
      club_owner_id,
      'new_match',
      notification_title,
      notification_message,
      '/club-management?tab=overview',
      jsonb_build_object('match_id', NEW.id),
      'normal'
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automated notifications
DROP TRIGGER IF EXISTS trigger_notify_rank_verifications ON public.rank_verifications;
CREATE TRIGGER trigger_notify_rank_verifications
  AFTER INSERT ON public.rank_verifications
  FOR EACH ROW EXECUTE FUNCTION notify_club_events();

DROP TRIGGER IF EXISTS trigger_notify_matches ON public.matches;
CREATE TRIGGER trigger_notify_matches
  AFTER INSERT ON public.matches
  FOR EACH ROW EXECUTE FUNCTION notify_club_events();