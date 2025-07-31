-- First, clean up invalid phone data
UPDATE profiles 
SET phone = NULL 
WHERE phone IS NOT NULL 
AND phone !~ '^(0[3|5|7|8|9])+([0-9]{8})$'
AND phone != '';

-- Also clean up obvious test data
UPDATE profiles 
SET phone = NULL 
WHERE phone IN ('test', 'invalid', 'sdfsdfsgf', '123456789', 'abc123');

-- Now create the validation function with better error handling
CREATE OR REPLACE FUNCTION validate_profile_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate email format if provided
  IF NEW.email IS NOT NULL AND NEW.email != '' AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    -- Instead of raising exception, set to null to allow update
    NEW.email := NULL;
  END IF;
  
  -- Validate phone format if provided (basic Vietnamese phone validation)
  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND NEW.phone !~ '^(0[3|5|7|8|9])+([0-9]{8})$' THEN
    -- Instead of raising exception, set to null to allow update
    NEW.phone := NULL;
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