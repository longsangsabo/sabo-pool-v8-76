
-- Update clubs table to match the exact schema provided
ALTER TABLE public.clubs 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(user_id);

-- Update existing columns to match schema types
ALTER TABLE public.clubs 
ALTER COLUMN name SET NOT NULL,
ALTER COLUMN address SET NOT NULL;

-- Ensure all other columns from your schema are present (most were added in previous migration)
-- These should already exist from the previous migration:
-- is_sabo_owned, monthly_payment, priority_score, opening_hours, available_tables, latitude, longitude

-- Add indexes for better performance on the new columns
CREATE INDEX IF NOT EXISTS idx_clubs_owner_id ON public.clubs(owner_id);
CREATE INDEX IF NOT EXISTS idx_clubs_phone ON public.clubs(phone);

-- Update the club priority calculation function to handle the owner_id reference
CREATE OR REPLACE FUNCTION public.calculate_club_priority(club_row clubs, user_lat DECIMAL DEFAULT NULL, user_lng DECIMAL DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  score INTEGER := 0;
  distance DECIMAL;
BEGIN
  -- SABO owned clubs get highest priority
  IF club_row.is_sabo_owned THEN
    score := score + 1000;
  END IF;
  
  -- Monthly payment amount (normalized to 0-500 points)
  score := score + LEAST(club_row.monthly_payment::INTEGER / 10, 500);
  
  -- Distance calculation (if coordinates provided)
  IF user_lat IS NOT NULL AND user_lng IS NOT NULL AND 
     club_row.latitude IS NOT NULL AND club_row.longitude IS NOT NULL THEN
    distance := SQRT(
      POWER(club_row.latitude - user_lat, 2) + 
      POWER(club_row.longitude - user_lng, 2)
    ) * 111; -- Rough km conversion
    score := score + GREATEST(0, 100 - distance::INTEGER);
  END IF;
  
  -- Available tables
  score := score + (club_row.available_tables * 2);
  
  RETURN score;
END;
$$;
