-- Add physical_rewards column to tournament_results
ALTER TABLE tournament_results 
ADD COLUMN physical_rewards jsonb DEFAULT '[]'::jsonb;

-- Update existing results with physical rewards
UPDATE tournament_results 
SET physical_rewards = '["Cúp vô địch", "Huy chương vàng", "Giấy chứng nhận"]'::jsonb
WHERE tournament_id = 'e9c37e3b-a598-4b71-b6a6-6362c678441b' AND position = 1;

UPDATE tournament_results 
SET physical_rewards = '["Huy chương bạc", "Giấy chứng nhận"]'::jsonb
WHERE tournament_id = 'e9c37e3b-a598-4b71-b6a6-6362c678441b' AND position = 2;

UPDATE tournament_results 
SET physical_rewards = '["Huy chương đồng", "Giấy chứng nhận"]'::jsonb
WHERE tournament_id = 'e9c37e3b-a598-4b71-b6a6-6362c678441b' AND position = 3;

UPDATE tournament_results 
SET physical_rewards = '["Giấy chứng nhận"]'::jsonb
WHERE tournament_id = 'e9c37e3b-a598-4b71-b6a6-6362c678441b' AND position IN (4, 5, 6);