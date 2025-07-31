-- Trigger automation for all completed Winner's Bracket matches

-- Match 1: Huỳnh Mai An wins, Club Owner 1752123983287 loses
SELECT advance_double_elimination_winner(
  '3acaa763-2e67-4c98-b05c-4ccb9736acb0'::uuid,
  'f478fb0b-560d-4f41-8786-9d0216130214'::uuid,  -- Huỳnh Mai An (winner)
  'b604f41b-e2e7-4453-9286-1bbde4cc96bc'::uuid   -- Club Owner 1752123983287 (loser)
);

-- Match 2: Long Sang wins, Lê Nam Khoa loses  
SELECT advance_double_elimination_winner(
  '5f981c76-32bb-4723-9269-fa9d779a114a'::uuid,
  'c3a3216d-1963-40c9-95fb-0231e166bd06'::uuid,  -- Long Sang (winner)
  'e36df404-ae0c-4360-af90-ff1da5399a1f'::uuid   -- Lê Nam Khoa (loser)
);

-- Match 3: Long SAng wins, Huỳnh Minh Hải loses
SELECT advance_double_elimination_winner(
  '0c42bc19-d70a-4446-89a1-f2d58ae03694'::uuid,
  'dc6705c7-6261-4caf-8f1b-2ec23ba87f05'::uuid,  -- Long SAng (winner)
  'e7fdac5e-f584-4bb5-b950-5b9c5ba234e3'::uuid   -- Huỳnh Minh Hải (loser)
);