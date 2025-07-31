-- Fix admin_actions foreign key constraint
-- Remove the constraint that references auth.users and ensure it references profiles instead

ALTER TABLE admin_actions DROP CONSTRAINT IF EXISTS admin_actions_target_user_id_fkey;
ALTER TABLE admin_actions DROP CONSTRAINT IF EXISTS admin_actions_admin_id_fkey;

-- Add correct foreign key constraints that reference profiles table
ALTER TABLE admin_actions 
ADD CONSTRAINT admin_actions_admin_id_fkey 
FOREIGN KEY (admin_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE admin_actions 
ADD CONSTRAINT admin_actions_target_user_id_fkey 
FOREIGN KEY (target_user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;