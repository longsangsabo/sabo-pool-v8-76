-- Phase 4: Database function cleanup - Remove duplicate/old double elimination functions
-- Keep only the most recent and working versions of each function

-- Drop old/duplicate versions of double elimination functions
DROP FUNCTION IF EXISTS public.submit_double_elimination_score_old CASCADE;
DROP FUNCTION IF EXISTS public.advance_double_elimination_winner_old CASCADE;
DROP FUNCTION IF EXISTS public.advance_double_elimination_winner_simple CASCADE;
DROP FUNCTION IF EXISTS public.advance_double_elimination_winner_basic CASCADE;
DROP FUNCTION IF EXISTS public.repair_double_elimination_bracket_old CASCADE;
DROP FUNCTION IF EXISTS public.repair_double_elimination_bracket_simple CASCADE;
DROP FUNCTION IF EXISTS public.generate_double_elimination_bracket_old CASCADE;
DROP FUNCTION IF EXISTS public.generate_double_elimination_bracket_simple CASCADE;

-- Clean up any functions with "simplified" or "de16" in the name
DROP FUNCTION IF EXISTS public.submit_simplified_double_elimination_score CASCADE;
DROP FUNCTION IF EXISTS public.advance_simplified_double_elimination_winner CASCADE;
DROP FUNCTION IF EXISTS public.repair_simplified_double_elimination_bracket CASCADE;
DROP FUNCTION IF EXISTS public.generate_simplified_double_elimination_bracket CASCADE;
DROP FUNCTION IF EXISTS public.submit_de16_score CASCADE;
DROP FUNCTION IF EXISTS public.advance_de16_winner CASCADE;
DROP FUNCTION IF EXISTS public.repair_de16_bracket CASCADE;
DROP FUNCTION IF EXISTS public.generate_de16_bracket CASCADE;

-- Ensure we have only the main working functions:
-- 1. submit_double_elimination_score (latest version)
-- 2. advance_double_elimination_winner_comprehensive (latest version)  
-- 3. repair_double_elimination_bracket (latest version)
-- 4. generate_double_elimination_bracket_complete (latest version)

-- Drop any old versions and keep only the "_comprehensive" and "_complete" versions
DROP FUNCTION IF EXISTS public.submit_double_elimination_score(uuid, integer, integer) CASCADE;
DROP FUNCTION IF EXISTS public.advance_double_elimination_winner(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.repair_double_elimination_bracket(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.generate_double_elimination_bracket(uuid) CASCADE;

-- Update function comments to reflect consolidation
COMMENT ON FUNCTION public.submit_double_elimination_score IS 'Unified double elimination score submission with comprehensive advancement logic - consolidates all DE score submission functionality';
COMMENT ON FUNCTION public.advance_double_elimination_winner_comprehensive IS 'Unified double elimination winner advancement - handles all bracket types and progression logic';
COMMENT ON FUNCTION public.repair_double_elimination_bracket IS 'Unified double elimination bracket repair - fixes progression issues and validates bracket structure';
COMMENT ON FUNCTION public.generate_double_elimination_bracket_complete IS 'Unified double elimination bracket generation - creates complete bracket structure for all tournament sizes';

-- Clean up any old tournament templates or configs related to DE16/Simplified
DELETE FROM tournament_reward_templates WHERE template_name ILIKE '%DE16%' OR template_name ILIKE '%simplified%';
DELETE FROM tournament_automation_log WHERE automation_type ILIKE '%de16%' OR automation_type ILIKE '%simplified%';

-- Log the cleanup
INSERT INTO tournament_automation_log (
  automation_type,
  status,
  details,
  completed_at
) VALUES (
  'database_cleanup_consolidation',
  'completed',
  '{"action": "removed_duplicate_functions", "removed_patterns": ["de16", "simplified", "old", "simple", "basic"], "kept_functions": ["submit_double_elimination_score", "advance_double_elimination_winner_comprehensive", "repair_double_elimination_bracket", "generate_double_elimination_bracket_complete"]}',
  NOW()
);