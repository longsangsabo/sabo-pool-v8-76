-- Drop the old trigger and function to avoid conflicts
DROP TRIGGER IF EXISTS trigger_rank_verification_status_change ON public.rank_verifications;
DROP FUNCTION IF EXISTS public.handle_rank_verification_status_change();

-- Create a clean, simple trigger function without ambiguous references
CREATE OR REPLACE FUNCTION public.handle_rank_verification_simple()
RETURNS TRIGGER AS $$
DECLARE
    player_name TEXT;
    club_name_text TEXT;
BEGIN
    -- Only proceed if status actually changed
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;
    
    -- Get player name safely
    SELECT COALESCE(display_name, full_name, 'Người chơi') INTO player_name
    FROM public.profiles 
    WHERE user_id = NEW.player_id;
    
    -- Get club name safely with explicit alias
    SELECT cp.club_name INTO club_name_text
    FROM public.club_profiles cp
    WHERE cp.id = NEW.club_id;
    
    -- Create notifications based on new status without complex logic
    IF NEW.status = 'approved' THEN
        -- Send success notification
        INSERT INTO public.notifications (
            user_id, type, title, message, priority, metadata
        ) VALUES (
            NEW.player_id,
            'rank_verified_approved',
            'Xác thực hạng thành công',
            'Chúc mừng! Hạng ' || NEW.requested_rank || ' của bạn đã được xác thực thành công.',
            'high',
            jsonb_build_object(
                'rank_verification_id', NEW.id,
                'verified_rank', NEW.requested_rank
            )
        );
        
    ELSIF NEW.status = 'rejected' THEN
        -- Send rejection notification
        INSERT INTO public.notifications (
            user_id, type, title, message, priority, metadata
        ) VALUES (
            NEW.player_id,
            'rank_verified_rejected',
            'Xác thực hạng bị từ chối',
            'Yêu cầu xác thực hạng ' || NEW.requested_rank || ' đã bị từ chối.',
            'normal',
            jsonb_build_object(
                'rank_verification_id', NEW.id,
                'requested_rank', NEW.requested_rank
            )
        );
        
    ELSIF NEW.status = 'testing' THEN
        -- Send testing notification
        INSERT INTO public.notifications (
            user_id, type, title, message, priority, metadata
        ) VALUES (
            NEW.player_id,
            'rank_verification_testing',
            'Bắt đầu test hạng',
            'Bạn được yêu cầu đến CLB để test hạng ' || NEW.requested_rank || '.',
            'normal',
            jsonb_build_object(
                'rank_verification_id', NEW.id,
                'requested_rank', NEW.requested_rank
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the new clean trigger
CREATE TRIGGER trigger_rank_verification_simple
    AFTER UPDATE ON public.rank_verifications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_rank_verification_simple();