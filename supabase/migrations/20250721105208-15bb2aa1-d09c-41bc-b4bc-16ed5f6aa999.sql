-- Fix missing auto_popup column in notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS auto_popup BOOLEAN DEFAULT false;

-- Fix missing priority column as well
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';

-- Update the send_enhanced_notification function to match expected signature
CREATE OR REPLACE FUNCTION public.send_enhanced_notification(
    p_user_id uuid, 
    p_title text, 
    p_message text, 
    p_type text DEFAULT 'info'::text, 
    p_auto_popup boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, auto_popup)
  VALUES (p_user_id, p_title, p_message, p_type, p_auto_popup)
  RETURNING id INTO v_notification_id;
  
  RETURN jsonb_build_object('success', true, 'notification_id', v_notification_id);
END;
$function$;