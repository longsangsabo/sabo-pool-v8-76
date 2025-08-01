-- Completely remove the type constraint on notifications table
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;