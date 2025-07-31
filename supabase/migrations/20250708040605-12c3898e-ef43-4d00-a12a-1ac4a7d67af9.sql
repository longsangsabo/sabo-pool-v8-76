-- Insert sample tournament registrations for testing
INSERT INTO public.tournament_registrations (
  tournament_id, 
  player_id, 
  registration_status, 
  registration_date,
  created_at
) VALUES 
  ('08ea3713-2334-4112-84d5-823448337b2b', '3bd4ded0-2b7d-430c-b245-c10d079b333a', 'confirmed', now(), now()),
  ('08ea3713-2334-4112-84d5-823448337b2b', '7551b33a-8163-4f0e-9785-046c530877fa', 'confirmed', now(), now()),
  ('08ea3713-2334-4112-84d5-823448337b2b', '91932bd8-0f2f-492b-bc52-946d83aece06', 'confirmed', now(), now()),
  ('08ea3713-2334-4112-84d5-823448337b2b', '27548e10-b91e-4f59-8c7d-215eac103573', 'confirmed', now(), now())
ON CONFLICT (tournament_id, player_id) DO NOTHING;