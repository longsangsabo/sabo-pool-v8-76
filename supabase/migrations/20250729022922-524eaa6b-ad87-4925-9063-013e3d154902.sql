-- Phase 4: Database function cleanup - Fix function ambiguity by dropping specific signatures
-- List all submit_double_elimination_score function signatures and drop the ones we don't need

-- Drop the specific old signatures
DROP FUNCTION IF EXISTS public.submit_double_elimination_score(p_match_id uuid, p_player1_score integer, p_player2_score integer) CASCADE;
DROP FUNCTION IF EXISTS public.submit_double_elimination_score(uuid, integer, integer, uuid) CASCADE;

-- Check which functions are left and clean up naming
-- Only keep the main working function with the signature we need

-- Log the successful cleanup
INSERT INTO tournament_automation_log (
  automation_type,
  status,
  details,
  completed_at
) VALUES (
  'database_function_signature_cleanup',
  'completed',
  '{"action": "removed_ambiguous_function_signatures", "cleaned_functions": ["submit_double_elimination_score"]}',
  NOW()
);