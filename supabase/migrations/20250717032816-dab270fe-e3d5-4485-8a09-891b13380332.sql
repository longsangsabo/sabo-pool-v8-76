-- Create tournament matches directly without calling complex functions
INSERT INTO public.tournament_matches (
  tournament_id, round_number, match_number,
  player1_id, player2_id, status, bracket_type, branch_type,
  created_at, updated_at
) 
SELECT 
  'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'::uuid,
  1, -- Round 1
  ROW_NUMBER() OVER(),
  participants[i*2-1],
  participants[i*2],
  'scheduled',
  'winner',
  NULL,
  now(),
  now()
FROM (
  SELECT ARRAY(
    SELECT user_id 
    FROM tournament_registrations 
    WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07' 
    AND registration_status = 'confirmed' 
    ORDER BY created_at 
    LIMIT 16
  ) AS participants
) p
CROSS JOIN generate_series(1, 8) AS i;

-- Create Winner Bracket Round 2 (4 matches)
INSERT INTO public.tournament_matches (
  tournament_id, round_number, match_number,
  player1_id, player2_id, status, bracket_type, branch_type,
  created_at, updated_at
) 
SELECT 
  'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'::uuid,
  2,
  generate_series(1, 4),
  NULL,
  NULL,
  'pending',
  'winner',
  NULL,
  now(),
  now();

-- Create Winner Bracket Round 3 (2 matches)
INSERT INTO public.tournament_matches (
  tournament_id, round_number, match_number,
  player1_id, player2_id, status, bracket_type, branch_type,
  created_at, updated_at
) 
SELECT 
  'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'::uuid,
  3,
  generate_series(1, 2),
  NULL,
  NULL,
  'pending',
  'winner',
  NULL,
  now(),
  now();

-- Create Loser Bracket Branch A Round 1 (4 matches)
INSERT INTO public.tournament_matches (
  tournament_id, round_number, match_number,
  player1_id, player2_id, status, bracket_type, branch_type,
  created_at, updated_at
) 
SELECT 
  'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'::uuid,
  4,
  generate_series(1, 4),
  NULL,
  NULL,
  'pending',
  'loser',
  'branch_a',
  now(),
  now();

-- Create Loser Bracket Branch A Round 2 (2 matches)
INSERT INTO public.tournament_matches (
  tournament_id, round_number, match_number,
  player1_id, player2_id, status, bracket_type, branch_type,
  created_at, updated_at
) 
SELECT 
  'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'::uuid,
  5,
  generate_series(1, 2),
  NULL,
  NULL,
  'pending',
  'loser',
  'branch_a',
  now(),
  now();

-- Create Loser Bracket Branch A Round 3 (1 match)
INSERT INTO public.tournament_matches (
  tournament_id, round_number, match_number,
  player1_id, player2_id, status, bracket_type, branch_type,
  created_at, updated_at
) VALUES (
  'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'::uuid,
  6,
  1,
  NULL,
  NULL,
  'pending',
  'loser',
  'branch_a',
  now(),
  now()
);

-- Create Loser Bracket Branch B Round 1 (2 matches)
INSERT INTO public.tournament_matches (
  tournament_id, round_number, match_number,
  player1_id, player2_id, status, bracket_type, branch_type,
  created_at, updated_at
) 
SELECT 
  'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'::uuid,
  7,
  generate_series(1, 2),
  NULL,
  NULL,
  'pending',
  'loser',
  'branch_b',
  now(),
  now();

-- Create Loser Bracket Branch B Round 2 (1 match)
INSERT INTO public.tournament_matches (
  tournament_id, round_number, match_number,
  player1_id, player2_id, status, bracket_type, branch_type,
  created_at, updated_at
) VALUES (
  'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'::uuid,
  8,
  1,
  NULL,
  NULL,
  'pending',
  'loser',
  'branch_b',
  now(),
  now()
);