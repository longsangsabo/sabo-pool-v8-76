-- Migration to sync tournament date fields and fix "Chưa xác định" display issue

-- Copy start_date to tournament_start and end_date to tournament_end for existing tournaments
UPDATE tournaments 
SET tournament_start = start_date,
    tournament_end = end_date
WHERE tournament_start IS NULL AND start_date IS NOT NULL;

-- Ensure registration_start defaults to created_at if null
UPDATE tournaments 
SET registration_start = created_at
WHERE registration_start IS NULL;

-- Ensure registration_end defaults to start_date if null
UPDATE tournaments 
SET registration_end = start_date
WHERE registration_end IS NULL AND start_date IS NOT NULL;