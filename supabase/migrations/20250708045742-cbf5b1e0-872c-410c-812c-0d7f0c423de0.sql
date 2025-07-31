-- Create sample players for testing if they don't exist
INSERT INTO public.profiles (user_id, full_name, display_name, phone, role, created_at)
SELECT 
  gen_random_uuid(),
  'Test Player ' || i,
  'Player' || i,
  '+841234567' || LPAD(i::text, 2, '0'),
  'player',
  now() - (i || ' days')::interval
FROM generate_series(1, 8) as i
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE display_name LIKE 'Player%'
)
ON CONFLICT (user_id) DO NOTHING;

-- Create sample player rankings for testing
INSERT INTO public.player_rankings (player_id, elo_points, spa_points, total_matches, wins, created_at)
SELECT 
  p.user_id,
  1000 + (random() * 500)::int,
  (random() * 100)::int,
  (random() * 20)::int,
  (random() * 10)::int,
  now()
FROM public.profiles p
WHERE p.display_name LIKE 'Player%'
ON CONFLICT (player_id) DO UPDATE SET
  elo_points = EXCLUDED.elo_points,
  spa_points = EXCLUDED.spa_points,
  total_matches = EXCLUDED.total_matches,
  wins = EXCLUDED.wins;

-- Create a new sample tournament for full testing
INSERT INTO public.tournaments (
  id, name, description, tournament_type, max_participants, 
  entry_fee, prize_pool, registration_start, registration_end,
  tournament_start, tournament_end, status, created_by
) VALUES (
  gen_random_uuid(),
  'Full Workflow Test Tournament ' || extract(epoch from now())::bigint,
  'Tournament created for testing the complete workflow system',
  'single_elimination',
  16,
  50000,
  500000,
  now() - interval '1 day',
  now() + interval '1 hour',
  now() + interval '2 hours', 
  now() + interval '1 day',
  'registration_closed',
  (SELECT user_id FROM profiles WHERE display_name LIKE 'Player%' LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Get the tournament we just created or existing test tournament
DO $$
DECLARE
  v_tournament_id uuid;
  v_player_ids uuid[];
BEGIN
  -- Get the tournament ID
  SELECT id INTO v_tournament_id 
  FROM tournaments 
  WHERE name LIKE 'Full Workflow Test Tournament%' 
  OR id = '08ea3713-2334-4112-84d5-823448337b2b'
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Get sample players
  SELECT ARRAY_AGG(user_id) INTO v_player_ids
  FROM (
    SELECT user_id FROM profiles WHERE display_name LIKE 'Player%' LIMIT 8
  ) p;
  
  -- Create registrations for testing
  FOR i IN 1..LEAST(array_length(v_player_ids, 1), 8) LOOP
    INSERT INTO public.tournament_registrations (
      tournament_id, player_id, registration_status, registration_date
    ) VALUES (
      v_tournament_id,
      v_player_ids[i],
      'confirmed',
      now() - (i || ' hours')::interval
    ) ON CONFLICT (tournament_id, player_id) DO UPDATE SET
      registration_status = 'confirmed';
  END LOOP;
  
  RAISE NOTICE 'Created tournament % with % registrations', v_tournament_id, array_length(v_player_ids, 1);
END $$;