-- Fix foreign key constraint for challenges.club_id
-- Point it to club_profiles instead of clubs table

-- First, drop the existing foreign key constraint
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_club_id_fkey;

-- Add new foreign key constraint pointing to club_profiles
ALTER TABLE challenges ADD CONSTRAINT challenges_club_id_fkey 
  FOREIGN KEY (club_id) REFERENCES club_profiles(id);

-- Insert some sample data into clubs table if needed
INSERT INTO clubs (name, address, status, verified) 
SELECT club_name, address, 'active', true 
FROM club_profiles 
WHERE verification_status = 'approved'
ON CONFLICT DO NOTHING;