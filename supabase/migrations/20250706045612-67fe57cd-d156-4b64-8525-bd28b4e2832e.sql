-- Add deleted_at column to notifications table for soft delete functionality
ALTER TABLE public.notifications 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for better performance when filtering deleted notifications
CREATE INDEX idx_notifications_deleted_at ON public.notifications(deleted_at) WHERE deleted_at IS NOT NULL;

-- Create index for combined filtering (user_id, deleted_at, created_at)
CREATE INDEX idx_notifications_user_deleted_created ON public.notifications(user_id, deleted_at, created_at DESC);