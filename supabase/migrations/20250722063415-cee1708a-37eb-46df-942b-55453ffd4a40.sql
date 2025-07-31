-- Complete tournament test5 and generate results
SELECT public.force_complete_tournament_status('727a8ae8-0598-47bf-b305-2fc2bc60b57d'::uuid);
SELECT public.calculate_tournament_results('727a8ae8-0598-47bf-b305-2fc2bc60b57d'::uuid);