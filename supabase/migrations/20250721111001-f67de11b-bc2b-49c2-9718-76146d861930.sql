-- Rename tournament date columns to match code expectations
ALTER TABLE public.tournaments 
RENAME COLUMN tournament_start TO start_date;

ALTER TABLE public.tournaments 
RENAME COLUMN tournament_end TO end_date;