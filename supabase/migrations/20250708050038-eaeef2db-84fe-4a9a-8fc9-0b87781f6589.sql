-- Test match result reporting and advancement
UPDATE public.tournament_matches 
SET 
  winner_id = '3bd4ded0-2b7d-430c-b245-c10d079b333a',
  score_player1 = 2,
  score_player2 = 1, 
  status = 'completed',
  actual_end_time = now()
WHERE id = '0d837867-4fd3-465f-aaaf-c6db12c94e86';

-- Now test advancement function
SELECT public.advance_tournament_winner('0d837867-4fd3-465f-aaaf-c6db12c94e86'::uuid, '0e4f7491-06cc-403c-924b-d0b4e7ca5931'::uuid);