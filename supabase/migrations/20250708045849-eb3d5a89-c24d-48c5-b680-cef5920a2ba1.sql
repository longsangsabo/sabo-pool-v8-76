-- Create a new test tournament with existing players
INSERT INTO public.tournaments (
  id, name, description, tournament_type, max_participants, 
  entry_fee, prize_pool, registration_start, registration_end,
  tournament_start, tournament_end, status, created_by
) VALUES (
  gen_random_uuid(),
  'Workflow Test Tournament ' || extract(epoch from now())::bigint,
  'Tournament for complete workflow testing',
  'single_elimination',
  16,
  50000,
  500000,
  now() - interval '1 day',
  now() + interval '1 hour',
  now() + interval '2 hours', 
  now() + interval '1 day',
  'registration_closed',
  '3bd4ded0-2b7d-430c-b245-c10d079b333a'
);

-- Get the tournament ID and register existing players
DO $$
DECLARE
  v_tournament_id uuid;
  v_players uuid[] := ARRAY[
    '3bd4ded0-2b7d-430c-b245-c10d079b333a',
    '7551b33a-8163-4f0e-9785-046c530877fa', 
    '91932bd8-0f2f-492b-bc52-946d83aece06',
    '27548e10-b91e-4f59-8c7d-215eac103573',
    '5ad7e05f-56bd-4ea4-baa8-32286d4bfc4a',
    'c3a3216d-1963-40c9-95fb-0231e166bd06'
  ];
BEGIN
  -- Get the tournament we just created
  SELECT id INTO v_tournament_id 
  FROM tournaments 
  WHERE name LIKE 'Workflow Test Tournament%'
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Register players
  FOR i IN 1..array_length(v_players, 1) LOOP
    INSERT INTO public.tournament_registrations (
      tournament_id, player_id, registration_status, registration_date
    ) VALUES (
      v_tournament_id,
      v_players[i],
      'confirmed',
      now() - (i || ' hours')::interval
    ) ON CONFLICT (tournament_id, player_id) DO UPDATE SET
      registration_status = 'confirmed';
  END LOOP;
  
  -- Create player rankings if they don't exist
  FOR i IN 1..array_length(v_players, 1) LOOP
    INSERT INTO public.player_rankings (
      player_id, elo_points, spa_points, total_matches, wins, created_at
    ) VALUES (
      v_players[i],
      1000 + (random() * 500)::int,
      (random() * 100)::int,
      (random() * 20)::int,
      (random() * 10)::int,
      now()
    ) ON CONFLICT (player_id) DO UPDATE SET
      elo_points = EXCLUDED.elo_points,
      spa_points = EXCLUDED.spa_points;
  END LOOP;
  
  RAISE NOTICE 'Created tournament % with % confirmed registrations', v_tournament_id, array_length(v_players, 1);
END $$;