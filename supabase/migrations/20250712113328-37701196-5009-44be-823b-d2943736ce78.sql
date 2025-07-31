-- Fix phone constraint to match Vietnamese phone number format
-- Drop the incorrect constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_phone_format_check;

-- Add correct constraint for Vietnamese phone numbers (10 digits starting with 0)
ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_format_check 
CHECK (phone IS NULL OR phone ~ '^0[0-9]{9}$');