-- Add missing verification_notes column to rank_verifications table
ALTER TABLE public.rank_verifications 
ADD COLUMN IF NOT EXISTS verification_notes TEXT;