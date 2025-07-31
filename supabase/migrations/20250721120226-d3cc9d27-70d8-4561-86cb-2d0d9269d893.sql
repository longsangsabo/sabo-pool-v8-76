-- Fix foreign key constraint for tournaments.club_id
-- Point it to club_profiles instead of clubs table

-- First, drop the existing foreign key constraint
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_club_id_fkey;

-- Add new foreign key constraint pointing to club_profiles
ALTER TABLE tournaments ADD CONSTRAINT tournaments_club_id_fkey 
  FOREIGN KEY (club_id) REFERENCES club_profiles(id);