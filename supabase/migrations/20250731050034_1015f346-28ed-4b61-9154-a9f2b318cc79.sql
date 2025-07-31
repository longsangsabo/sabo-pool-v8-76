-- Update tournament reward template to include all 16 positions
UPDATE public.tournament_reward_templates 
SET reward_structure = jsonb_set(
  reward_structure,
  '{positions}',
  '[
    {"position": 1, "name": "Vô địch", "cashPrize": 1100000, "eloPoints": 100, "spaPoints": 900, "isVisible": true, "items": []},
    {"position": 2, "name": "Á quân", "cashPrize": 660000, "eloPoints": 75, "spaPoints": 700, "isVisible": true, "items": []},
    {"position": 3, "name": "Hạng 3", "cashPrize": 440000, "eloPoints": 50, "spaPoints": 500, "isVisible": true, "items": []},
    {"position": 4, "name": "Hạng 4", "cashPrize": 220000, "eloPoints": 40, "spaPoints": 400, "isVisible": true, "items": []},
    {"position": 5, "name": "Hạng 5-6", "cashPrize": 110000, "eloPoints": 30, "spaPoints": 300, "isVisible": true, "items": []},
    {"position": 6, "name": "Hạng 5-6", "cashPrize": 110000, "eloPoints": 30, "spaPoints": 300, "isVisible": true, "items": []},
    {"position": 7, "name": "Hạng 7-8", "cashPrize": 55000, "eloPoints": 25, "spaPoints": 250, "isVisible": true, "items": []},
    {"position": 8, "name": "Hạng 7-8", "cashPrize": 55000, "eloPoints": 25, "spaPoints": 250, "isVisible": true, "items": []},
    {"position": 9, "name": "Hạng 9-12", "cashPrize": 30000, "eloPoints": 20, "spaPoints": 200, "isVisible": true, "items": []},
    {"position": 10, "name": "Hạng 9-12", "cashPrize": 30000, "eloPoints": 20, "spaPoints": 200, "isVisible": true, "items": []},
    {"position": 11, "name": "Hạng 9-12", "cashPrize": 30000, "eloPoints": 20, "spaPoints": 200, "isVisible": true, "items": []},
    {"position": 12, "name": "Hạng 9-12", "cashPrize": 30000, "eloPoints": 20, "spaPoints": 200, "isVisible": true, "items": []},
    {"position": 13, "name": "Hạng 13-16", "cashPrize": 15000, "eloPoints": 15, "spaPoints": 150, "isVisible": true, "items": []},
    {"position": 14, "name": "Hạng 13-16", "cashPrize": 15000, "eloPoints": 15, "spaPoints": 150, "isVisible": true, "items": []},
    {"position": 15, "name": "Hạng 13-16", "cashPrize": 15000, "eloPoints": 15, "spaPoints": 150, "isVisible": true, "items": []},
    {"position": 16, "name": "Hạng 13-16", "cashPrize": 15000, "eloPoints": 15, "spaPoints": 150, "isVisible": true, "items": []}
  ]'::jsonb
),
updated_at = NOW()
WHERE name = 'Default Reward Template';