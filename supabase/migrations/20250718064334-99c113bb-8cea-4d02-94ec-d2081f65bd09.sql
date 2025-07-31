-- Manually trigger function để debug
DO $$
DECLARE
  tournament_record RECORD;
BEGIN
  -- Get tournament record
  SELECT * INTO tournament_record 
  FROM public.tournaments 
  WHERE id = '727a8ae8-0598-47bf-b305-2fc2bc60b57d';
  
  -- Log the tournament found
  RAISE NOTICE 'Found tournament: % with status: %', tournament_record.name, tournament_record.status;
  
  -- Simulate the trigger by calling a manual function
  PERFORM public.process_tournament_results_manual('727a8ae8-0598-47bf-b305-2fc2bc60b57d');
END $$;