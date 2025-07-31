-- Remove the phone format constraint to avoid validation conflicts
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_phone_format_check;