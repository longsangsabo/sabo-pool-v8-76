-- Check if function exists and recreate it properly
DROP FUNCTION IF EXISTS public.generate_referral_code(uuid);

-- Create function with proper schema qualification
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
  v_full_name TEXT;
BEGIN
  -- Get user's full name first
  SELECT full_name INTO v_full_name
  FROM public.profiles 
  WHERE profiles.user_id = p_user_id;
  
  LOOP
    -- Generate code: First 3 letters of name + random 4 digits
    v_code := UPPER(
      COALESCE(
        SUBSTRING(v_full_name, 1, 3),
        'USR'
      ) || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
    );
    
    -- Check if code exists
    SELECT EXISTS(
      SELECT 1 FROM public.profiles WHERE my_referral_code = v_code
    ) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';