-- Create trigger function to handle rank verification status changes
CREATE OR REPLACE FUNCTION public.handle_rank_verification_status_change()
RETURNS TRIGGER AS $$
DECLARE
    player_name TEXT;
    club_name TEXT;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
    -- Only proceed if status actually changed
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;
    
    -- Get player name
    SELECT COALESCE(display_name, full_name, 'Người chơi') INTO player_name
    FROM public.profiles 
    WHERE user_id = NEW.player_id;
    
    -- Get club name
    SELECT cp.club_name INTO club_name
    FROM public.club_profiles cp
    WHERE cp.id = NEW.club_id;
    
    -- Create notifications based on new status
    IF NEW.status = 'approved' THEN
        -- Update player's verified rank in profile
        UPDATE public.profiles 
        SET 
            verified_rank = NEW.requested_rank,
            rank_verified_at = NEW.verified_at,
            rank_verified_by = NEW.verified_by,
            updated_at = NOW()
        WHERE user_id = NEW.player_id;
        
        -- Send success notification to player
        PERFORM public.create_notification(
            NEW.player_id,
            'rank_verified_approved',
            'Xác thực hạng thành công',
            format('Chúc mừng! Hạng %s của bạn đã được CLB "%s" xác thực thành công.', 
                   NEW.requested_rank, COALESCE(club_name, 'CLB')),
            '/profile?tab=ranking',
            jsonb_build_object(
                'rank_verification_id', NEW.id,
                'verified_rank', NEW.requested_rank,
                'club_name', club_name
            ),
            'high'
        );
        
        -- Log the rank verification for audit trail
        INSERT INTO public.spa_points_log (player_id, source_type, source_id, points_earned, description)
        VALUES (
            NEW.player_id, 
            'rank_verification', 
            NEW.id, 
            0, 
            format('Rank %s verified by %s', NEW.requested_rank, club_name)
        );
        
    ELSIF NEW.status = 'rejected' THEN
        -- Send rejection notification to player
        PERFORM public.create_notification(
            NEW.player_id,
            'rank_verified_rejected',
            'Xác thực hạng bị từ chối',
            format('Yêu cầu xác thực hạng %s tại CLB "%s" đã bị từ chối. Lý do: %s', 
                   NEW.requested_rank, 
                   COALESCE(club_name, 'CLB'),
                   COALESCE(NEW.rejection_reason, 'Không đáp ứng yêu cầu')),
            '/profile?tab=ranking',
            jsonb_build_object(
                'rank_verification_id', NEW.id,
                'requested_rank', NEW.requested_rank,
                'rejection_reason', NEW.rejection_reason,
                'club_name', club_name
            ),
            'normal'
        );
        
    ELSIF NEW.status = 'testing' THEN
        -- Send testing notification to player
        PERFORM public.create_notification(
            NEW.player_id,
            'rank_verification_testing',
            'Bắt đầu test hạng',
            format('CLB "%s" đã bắt đầu test hạng %s của bạn. Vui lòng đến CLB để thực hiện test.', 
                   COALESCE(club_name, 'CLB'), NEW.requested_rank),
            '/profile?tab=ranking',
            jsonb_build_object(
                'rank_verification_id', NEW.id,
                'club_name', club_name,
                'requested_rank', NEW.requested_rank
            ),
            'normal'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_rank_verification_status_change ON public.rank_verifications;
CREATE TRIGGER trigger_rank_verification_status_change
    AFTER UPDATE ON public.rank_verifications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_rank_verification_status_change();