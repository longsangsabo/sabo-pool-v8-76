-- Fix existing loser bracket placement by reprocessing completed winner bracket matches
-- This will properly place losers as player2_id in loser bracket matches

-- For match 1: Winner = Huỳnh Mai An, Loser = Club Owner 1752123983287
SELECT advance_double_elimination_winner_v2(
  '3acaa763-2e67-4c98-b05c-4ccb9736acb0'::uuid,
  'f478fb0b-560d-4f41-8786-9d0216130214'::uuid,  -- Huỳnh Mai An (winner)
  'c4ca7b46-fb29-485d-bcbe-92067bcd0714'::uuid   -- Club Owner 1752123983287 (loser)
);

-- For match 2: Winner = Long Sang, Loser = Lê Nam Khoa  
SELECT advance_double_elimination_winner_v2(
  '5f981c76-32bb-4723-9269-fa9d779a114a'::uuid,
  'c3a3216d-1963-40c9-95fb-0231e166bd06'::uuid,  -- Long Sang (winner)
  '2051f22a-3b0b-469c-9a78-5ff5bc3f87c7'::uuid   -- Lê Nam Khoa (loser)
);

-- For match 3: Winner = Long SAng, Loser = Huỳnh Minh Hải
SELECT advance_double_elimination_winner_v2(
  '0c42bc19-d70a-4446-89a1-f2d58ae03694'::uuid,
  'dc6705c7-6261-4caf-8f1b-2ec23ba87f05'::uuid,  -- Long SAng (winner)
  '75ad1f6a-9e80-4e2b-9c75-c1e8a7b52e3d'::uuid   -- Huỳnh Minh Hải (loser)
);