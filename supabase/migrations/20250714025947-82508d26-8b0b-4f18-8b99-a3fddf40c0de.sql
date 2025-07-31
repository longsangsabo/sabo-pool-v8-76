-- Fix handicap columns to support decimal values instead of integers
ALTER TABLE public.challenges 
ALTER COLUMN handicap_05_rank TYPE NUMERIC(3,1),
ALTER COLUMN handicap_1_rank TYPE NUMERIC(3,1);