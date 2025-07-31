-- Add missing notes column to tournament_registrations table
ALTER TABLE public.tournament_registrations 
ADD COLUMN IF NOT EXISTS notes TEXT;