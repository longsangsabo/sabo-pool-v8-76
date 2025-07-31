-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion(profile_data profiles)
RETURNS INTEGER AS $$
DECLARE
  completion_score INTEGER := 0;
  total_fields INTEGER := 12; -- Total weighted fields
BEGIN
  -- Required fields (higher weight)
  IF profile_data.full_name IS NOT NULL AND profile_data.full_name != '' THEN
    completion_score := completion_score + 2;
  END IF;
  
  IF profile_data.display_name IS NOT NULL AND profile_data.display_name != '' THEN
    completion_score := completion_score + 1;
  END IF;
  
  IF profile_data.phone IS NOT NULL AND profile_data.phone != '' THEN
    completion_score := completion_score + 2;
  END IF;
  
  -- Optional but important fields
  IF profile_data.bio IS NOT NULL AND profile_data.bio != '' THEN
    completion_score := completion_score + 1;
  END IF;
  
  IF profile_data.avatar_url IS NOT NULL AND profile_data.avatar_url != '' THEN
    completion_score := completion_score + 2;
  END IF;
  
  IF profile_data.city IS NOT NULL AND profile_data.city != '' THEN
    completion_score := completion_score + 1;
  END IF;
  
  IF profile_data.district IS NOT NULL AND profile_data.district != '' THEN
    completion_score := completion_score + 1;
  END IF;
  
  IF profile_data.skill_level IS NOT NULL AND profile_data.skill_level != 'beginner' THEN
    completion_score := completion_score + 1;
  END IF;
  
  IF profile_data.email IS NOT NULL AND profile_data.email != '' THEN
    completion_score := completion_score + 1;
  END IF;
  
  -- Calculate percentage
  RETURN ROUND((completion_score::FLOAT / total_fields) * 100);
END;
$$ LANGUAGE plpgsql;

-- Add profile completion column if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0;

-- Function to auto-update profile completion
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.completion_percentage := calculate_profile_completion(NEW);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating completion percentage
DROP TRIGGER IF EXISTS profile_completion_trigger ON profiles;
CREATE TRIGGER profile_completion_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_completion();

-- Update existing profiles with completion percentage
UPDATE profiles 
SET completion_percentage = calculate_profile_completion(profiles.*);