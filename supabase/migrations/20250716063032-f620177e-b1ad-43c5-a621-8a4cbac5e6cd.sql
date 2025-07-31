-- Drop and recreate functions for tournament completion

-- Drop existing function first
DROP FUNCTION IF EXISTS public.create_notification(uuid,text,text,text,text,jsonb);

-- Create create_notification function with correct signature
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_priority text DEFAULT 'normal',
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert into notifications table if it exists
  INSERT INTO public.notifications (
    user_id, type, title, message, priority, metadata, created_at
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_priority, p_metadata, now()
  );
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- If notifications table doesn't exist or other error, just return true to not break the flow
    RAISE NOTICE 'Notification creation failed: %', SQLERRM;
    RETURN false;
END;
$$;