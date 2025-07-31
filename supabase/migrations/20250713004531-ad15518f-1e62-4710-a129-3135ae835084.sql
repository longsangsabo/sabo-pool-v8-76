-- Fix rank_verifications table structure
-- Add missing verified_rank column to rank_verifications table
ALTER TABLE public.rank_verifications 
ADD COLUMN IF NOT EXISTS verified_rank TEXT;