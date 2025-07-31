-- Test migration to update verified_rank and test trigger
-- This will simulate a rank approval to test the real-time updates

DO $$
DECLARE
    test_user_id UUID := 'dc6705c7-6261-4caf-8f1b-2ec23ba87f05';
BEGIN
    -- First update the verified_rank to test
    UPDATE public.profiles 
    SET verified_rank = 'H+', 
        updated_at = NOW()
    WHERE user_id = test_user_id;
    
    -- Insert a test notification to trigger the automation
    INSERT INTO public.notifications (
        user_id, 
        type, 
        title, 
        message, 
        priority,
        metadata
    ) VALUES (
        test_user_id,
        'rank_approved',
        'Hạng đã được duyệt',
        'Hạng H+ của bạn đã được duyệt thành công!',
        'high',
        jsonb_build_object('new_rank', 'H+', 'test_notification', true)
    );
    
    RAISE NOTICE 'Updated verified_rank to H+ and created test notification for user %', test_user_id;
END $$;