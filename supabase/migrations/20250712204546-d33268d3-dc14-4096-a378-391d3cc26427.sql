-- Update database constraints to include all 12 ranks (K, K+, I, I+, H, H+, G, G+, F, F+, E, E+)

-- Fix rank_verifications table constraints
ALTER TABLE public.rank_verifications 
DROP CONSTRAINT IF EXISTS rank_verifications_requested_rank_check;

ALTER TABLE public.rank_verifications 
DROP CONSTRAINT IF EXISTS rank_verifications_current_rank_check;

-- Add new constraints with correct 12-tier ranks including + ranks
ALTER TABLE public.rank_verifications 
ADD CONSTRAINT rank_verifications_requested_rank_check 
CHECK (requested_rank IN ('K', 'K+', 'I', 'I+', 'H', 'H+', 'G', 'G+', 'F', 'F+', 'E', 'E+'));

ALTER TABLE public.rank_verifications 
ADD CONSTRAINT rank_verifications_current_rank_check 
CHECK (current_rank IN ('K', 'K+', 'I', 'I+', 'H', 'H+', 'G', 'G+', 'F', 'F+', 'E', 'E+'));

-- Fix rank_adjustments table constraints  
ALTER TABLE public.rank_adjustments 
DROP CONSTRAINT IF EXISTS rank_adjustments_requested_rank_check;

ALTER TABLE public.rank_adjustments 
DROP CONSTRAINT IF EXISTS rank_adjustments_current_rank_check;

ALTER TABLE public.rank_adjustments 
ADD CONSTRAINT rank_adjustments_requested_rank_check 
CHECK (requested_rank IN ('K', 'K+', 'I', 'I+', 'H', 'H+', 'G', 'G+', 'F', 'F+', 'E', 'E+'));

ALTER TABLE public.rank_adjustments 
ADD CONSTRAINT rank_adjustments_current_rank_check 
CHECK (current_rank IN ('K', 'K+', 'I', 'I+', 'H', 'H+', 'G', 'G+', 'F', 'F+', 'E', 'E+'));

-- Fix rank_reports table constraints
ALTER TABLE public.rank_reports 
DROP CONSTRAINT IF EXISTS rank_reports_reported_rank_check;

ALTER TABLE public.rank_reports 
ADD CONSTRAINT rank_reports_reported_rank_check 
CHECK (reported_rank IN ('K', 'K+', 'I', 'I+', 'H', 'H+', 'G', 'G+', 'F', 'F+', 'E', 'E+'));

-- Fix profiles table constraints
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_verified_rank_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_verified_rank_check 
CHECK (verified_rank IN ('K', 'K+', 'I', 'I+', 'H', 'H+', 'G', 'G+', 'F', 'F+', 'E', 'E+'));