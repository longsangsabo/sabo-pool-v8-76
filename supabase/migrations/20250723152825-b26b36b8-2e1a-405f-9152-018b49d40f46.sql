-- Remove duplicate notification function that may be causing conflicts
DROP FUNCTION IF EXISTS public.notify_user_on_rank_status_update() CASCADE;

-- Also check and remove any old function that might reference club_id in notifications
-- This ensures only our updated function handles the notifications correctly