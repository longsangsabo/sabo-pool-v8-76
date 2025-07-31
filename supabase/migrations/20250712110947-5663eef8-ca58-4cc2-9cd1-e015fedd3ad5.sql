-- Now fix phone unique constraint to allow NULL values but ensure uniqueness for non-NULL values

-- Drop existing unique constraint on phone if it exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_phone_key;

-- Create a new unique constraint that allows NULL values but ensures uniqueness for non-NULL phones
CREATE UNIQUE INDEX profiles_phone_unique_idx ON public.profiles (phone) WHERE phone IS NOT NULL AND phone != '';

-- Update any empty string phones to NULL for consistency
UPDATE public.profiles SET phone = NULL WHERE phone = '';

-- Add check constraint to ensure phone format is valid when not null
ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_format_check 
CHECK (phone IS NULL OR phone ~ '^[0-9]{10,15}$');