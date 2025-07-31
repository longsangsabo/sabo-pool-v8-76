-- Clear existing results first
DELETE FROM tournament_results WHERE tournament_id = 'e9c37e3b-a598-4b71-b6a6-6362c678441b';

-- Insert diverse tournament results for test5 tournament with different users
INSERT INTO tournament_results (
  tournament_id, user_id, position, matches_played, matches_won, matches_lost,
  points_earned, elo_points_earned, prize_money, placement_type
) VALUES 
  -- Champion - sabo
  ('e9c37e3b-a598-4b71-b6a6-6362c678441b', 'd7d6ce12-490f-4fff-b913-80044de5e169', 1, 3, 3, 0, 1000, 100, 1400000, 'final'),
  -- Runner-up - Phan Nam Long
  ('e9c37e3b-a598-4b71-b6a6-6362c678441b', '519cf7c9-e112-40b2-9e4d-0cd44783ec9e', 2, 3, 2, 1, 700, 50, 840000, 'final'),
  -- Third place - Phan Thị Bình
  ('e9c37e3b-a598-4b71-b6a6-6362c678441b', '4bedc2fd-a85d-483d-80e5-c9541d6ecdc2', 3, 2, 1, 1, 500, 25, 560000, 'semifinal'),
  -- Fourth place - Đặng Linh Hải
  ('e9c37e3b-a598-4b71-b6a6-6362c678441b', '0e541971-640e-4a5e-881b-b7f98a2904f7', 4, 1, 0, 1, 300, 10, 280000, 'semifinal'),
  -- Fifth place - Phan Hùng Phong
  ('e9c37e3b-a598-4b71-b6a6-6362c678441b', '9f5c350d-5ee2-4aa4-bd1e-e1ac2ed57e6a', 5, 2, 1, 1, 200, 5, 140000, 'quarterfinal'),
  -- Sixth place - Đặng Linh Khoa
  ('e9c37e3b-a598-4b71-b6a6-6362c678441b', '46bfe678-66cf-48a9-8bc8-d2eee8274ac3', 6, 1, 0, 1, 100, 5, 70000, 'quarterfinal');