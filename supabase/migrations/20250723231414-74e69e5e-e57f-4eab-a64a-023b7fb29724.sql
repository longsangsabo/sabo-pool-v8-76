-- Fix missing Round 2 matches for boda3 tournament
-- It should have 4 Round 2 matches total (8 Round 1 winners / 2 = 4)

INSERT INTO tournament_matches (
  id, tournament_id, round_number, match_number, 
  status, created_at, updated_at
) VALUES 
-- Match 2: Winners from Round 1 matches 3 & 4
(gen_random_uuid(), '80043ef4-a833-43aa-a01b-4dec2a32ea16', 2, 2, 'pending', now(), now()),
-- Match 3: Winners from Round 1 matches 5 & 6  
(gen_random_uuid(), '80043ef4-a833-43aa-a01b-4dec2a32ea16', 2, 3, 'pending', now(), now()),
-- Match 4: Winners from Round 1 matches 7 & 8
(gen_random_uuid(), '80043ef4-a833-43aa-a01b-4dec2a32ea16', 2, 4, 'pending', now(), now());

-- Now run repair to populate the matches correctly
SELECT public.fix_all_tournament_progression('80043ef4-a833-43aa-a01b-4dec2a32ea16'::uuid);