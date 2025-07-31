-- Create club_profiles entry for the user since they own a club
INSERT INTO public.club_profiles (
  user_id,
  club_name,
  verification_status,
  created_at,
  updated_at
)
SELECT 
  owner_id,
  name,
  'approved',
  now(),
  now()
FROM public.clubs 
WHERE owner_id = 'd7d6ce12-490f-4fff-b913-80044de5e169'
AND NOT EXISTS (
  SELECT 1 FROM public.club_profiles 
  WHERE user_id = 'd7d6ce12-490f-4fff-b913-80044de5e169'
);