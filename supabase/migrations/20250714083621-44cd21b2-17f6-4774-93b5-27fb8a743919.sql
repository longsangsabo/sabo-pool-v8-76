-- Fix the constraint issue: Drop the old constraint and add registration_end field back
-- The database still expects registration_end column but we're sending registration_deadline

-- Add registration_end column back to tournaments table for backward compatibility
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS registration_end TIMESTAMP WITH TIME ZONE;

-- Update the constraint to check registration_deadline instead of registration_end
ALTER TABLE public.tournaments 
DROP CONSTRAINT IF EXISTS tournaments_registration_end_not_null;

-- Add proper constraint for registration_deadline
ALTER TABLE public.tournaments 
ADD CONSTRAINT tournaments_registration_deadline_not_null 
CHECK (registration_deadline IS NOT NULL);