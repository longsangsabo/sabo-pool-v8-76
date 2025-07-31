-- Add RLS policies for tournament_results
CREATE POLICY "Users can view tournament results"
ON tournament_results FOR SELECT
USING (true);

CREATE POLICY "System can manage tournament results"
ON tournament_results FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND is_admin = true
  )
);

-- Complete tournament test5 and insert sample results
UPDATE tournaments 
SET status = 'completed', completed_at = NOW(), updated_at = NOW()
WHERE id = 'e9c37e3b-a598-4b71-b6a6-6362c678441b';

-- Insert sample tournament results for test5 tournament
INSERT INTO tournament_results (
  tournament_id, user_id, final_position, total_matches, wins, losses, 
  win_percentage, spa_points_earned, elo_points_awarded, prize_amount
) VALUES 
  -- Champion
  ('e9c37e3b-a598-4b71-b6a6-6362c678441b', 'd7d6ce12-490f-4fff-b913-80044de5e169', 1, 3, 3, 0, 100.00, 1000, 100, 1400000),
  -- Runner-up  
  ('e9c37e3b-a598-4b71-b6a6-6362c678441b', 'd7d6ce12-490f-4fff-b913-80044de5e169', 2, 3, 2, 1, 66.67, 700, 50, 840000),
  -- Third place
  ('e9c37e3b-a598-4b71-b6a6-6362c678441b', 'd7d6ce12-490f-4fff-b913-80044de5e169', 3, 2, 1, 1, 50.00, 500, 25, 560000),
  -- Fourth place
  ('e9c37e3b-a598-4b71-b6a6-6362c678441b', 'd7d6ce12-490f-4fff-b913-80044de5e169', 4, 1, 0, 1, 0.00, 300, 10, 280000);