-- Create function to check if user is club owner of a tournament
CREATE OR REPLACE FUNCTION public.is_tournament_club_owner(p_tournament_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM tournaments t
    JOIN club_profiles cp ON t.club_id = cp.id
    WHERE t.id = p_tournament_id 
    AND cp.user_id = p_user_id
  );
END;
$$;

-- Add RLS policy for tournament editing
CREATE POLICY "Club owners can update their tournaments" 
ON tournaments 
FOR UPDATE 
TO authenticated 
USING (
  public.is_tournament_club_owner(id, auth.uid()) OR 
  public.is_current_user_admin()
);

-- Create notification template for tournament changes
INSERT INTO notification_templates (
  template_key,
  category,
  title_template,
  message_template,
  default_priority,
  is_active
) VALUES (
  'tournament_updated',
  'tournament',
  'Giải đấu {{tournament_name}} đã được cập nhật',
  'Có thay đổi quan trọng trong giải đấu {{tournament_name}}. Vui lòng kiểm tra thông tin mới.',
  'normal',
  true
) ON CONFLICT (template_key) DO UPDATE SET
  title_template = EXCLUDED.title_template,
  message_template = EXCLUDED.message_template,
  updated_at = now();