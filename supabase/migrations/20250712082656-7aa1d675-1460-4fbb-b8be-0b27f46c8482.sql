-- Profile validation and auto-sync triggers
CREATE OR REPLACE FUNCTION validate_profile_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate email format if provided
  IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format: %', NEW.email;
  END IF;
  
  -- Validate phone format if provided (basic Vietnamese phone validation)
  IF NEW.phone IS NOT NULL AND NEW.phone !~ '^(0[3|5|7|8|9])+([0-9]{8})$' THEN
    RAISE EXCEPTION 'Invalid phone format: %', NEW.phone;
  END IF;
  
  -- Auto-sync display_name with full_name if not provided
  IF NEW.display_name IS NULL OR NEW.display_name = '' THEN
    NEW.display_name := NEW.full_name;
  END IF;
  
  -- Auto-update activity status
  NEW.last_activity_check := NOW();
  
  -- Auto-generate referral code if not exists
  IF NEW.my_referral_code IS NULL THEN
    NEW.my_referral_code := UPPER(SUBSTRING(MD5(NEW.user_id::TEXT), 1, 8));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profile validation
DROP TRIGGER IF EXISTS profile_validation_trigger ON profiles;
CREATE TRIGGER profile_validation_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_profile_data();

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

-- Update existing profiles with completion percentage
UPDATE profiles 
SET completion_percentage = calculate_profile_completion(profiles.*);

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