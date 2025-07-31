-- STEP 2: Backup for notifications table changes (safety first)
INSERT INTO public.migration_backups (affected_component, change_description, rollback_notes)
VALUES 
('notifications table', 'Add missing club_id column', 'If issues occur, column can be dropped with: ALTER TABLE public.notifications DROP COLUMN IF EXISTS club_id;');

-- Add the missing club_id column to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES public.club_profiles(id) ON DELETE SET NULL;

-- Create the index that was referenced in previous migration
CREATE INDEX IF NOT EXISTS idx_notifications_club_id ON public.notifications(club_id);