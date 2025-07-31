-- Phase 1: Consolidate SABO Billiards club data
-- Fix the duplicate club records and update references

-- First, get the correct club_profiles ID for SABO Billiards
-- Update any rank_requests that use the wrong club_id from clubs table
UPDATE public.rank_requests 
SET club_id = '83209e82-4b11-49e1-b6c7-8651fbf6adf8'
WHERE club_id = 'ad26943e-a722-41bc-9d68-6039e0ead8be';

-- Update any challenges that reference the wrong club_id
UPDATE public.challenges
SET club_id = '83209e82-4b11-49e1-b6c7-8651fbf6adf8'
WHERE club_id = 'ad26943e-a722-41bc-9d68-6039e0ead8be';

-- Update any other tables that might reference the wrong club_id
UPDATE public.match_results
SET club_id = '83209e82-4b11-49e1-b6c7-8651fbf6adf8'
WHERE club_id = 'ad26943e-a722-41bc-9d68-6039e0ead8be';

UPDATE public.events
SET club_id = '83209e82-4b11-49e1-b6c7-8651fbf6adf8'
WHERE club_id = 'ad26943e-a722-41bc-9d68-6039e0ead8be';

-- Remove the duplicate club record from clubs table
DELETE FROM public.clubs 
WHERE id = 'ad26943e-a722-41bc-9d68-6039e0ead8be';

-- Create trigger function to automatically move approved rank requests to rank_verifications
CREATE OR REPLACE FUNCTION public.handle_rank_request_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Only process when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Insert into rank_verifications table
    INSERT INTO public.rank_verifications (
      id,
      user_id,
      club_id,
      current_rank,
      verified_rank,
      verification_notes,
      verification_status,
      verified_at,
      verified_by,
      created_at,
      updated_at
    ) VALUES (
      NEW.id, -- Use same ID to maintain reference
      NEW.user_id,
      NEW.club_id,
      NEW.current_rank,
      NEW.requested_rank,
      NEW.admin_notes,
      'approved',
      NEW.updated_at,
      NEW.verified_by,
      NEW.created_at,
      NEW.updated_at
    )
    ON CONFLICT (id) DO UPDATE SET
      verified_rank = NEW.requested_rank,
      verification_notes = NEW.admin_notes,
      verification_status = 'approved',
      verified_at = NEW.updated_at,
      verified_by = NEW.verified_by,
      updated_at = NEW.updated_at;
      
    -- Create notification for user
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      priority,
      metadata
    ) VALUES (
      NEW.user_id,
      'rank_verified',
      'Hạng được xác thực',
      format('Hạng %s của bạn đã được xác thực bởi câu lạc bộ', NEW.requested_rank),
      'high',
      jsonb_build_object(
        'rank_request_id', NEW.id,
        'verified_rank', NEW.requested_rank,
        'club_id', NEW.club_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for rank_requests approval
DROP TRIGGER IF EXISTS trigger_rank_request_approval ON public.rank_requests;
CREATE TRIGGER trigger_rank_request_approval
  AFTER UPDATE ON public.rank_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_rank_request_approval();