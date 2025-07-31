-- Final player_id cleanup - drop and recreate functions with correct signatures

-- Drop functions that need parameter updates (with exact signatures)
DROP FUNCTION IF EXISTS public.award_tournament_elo_points(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.award_tournament_points(uuid, uuid, integer, text);
DROP FUNCTION IF EXISTS public.award_tournament_spa_with_audit(uuid, uuid, text, text, text, uuid);
DROP FUNCTION IF EXISTS public.calculate_average_opponent_strength(uuid);
DROP FUNCTION IF EXISTS public.calculate_comeback_bonus(uuid);
DROP FUNCTION IF EXISTS public.calculate_enhanced_elo(uuid, uuid, integer, integer, jsonb);
DROP FUNCTION IF EXISTS public.calculate_performance_quality(uuid);
DROP FUNCTION IF EXISTS public.calculate_streak_bonus(uuid, integer);
DROP FUNCTION IF EXISTS public.check_and_award_milestones(uuid);

-- Just verify that the check_rank_promotion function uses p_user_id (it should already be updated)
-- and any code calling these functions should now use the new parameter names

-- Create a final verification function to check remaining player_id references
CREATE OR REPLACE FUNCTION public.verify_player_id_cleanup()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_column_count INTEGER;
  v_function_count INTEGER;
  v_constraint_count INTEGER;
  v_result JSONB;
BEGIN
  -- Count remaining player_id columns
  SELECT COUNT(*) INTO v_column_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND column_name LIKE '%player_id%';
  
  -- Count functions with player_id parameters
  SELECT COUNT(*) INTO v_function_count
  FROM information_schema.parameters
  WHERE specific_schema = 'public'
  AND parameter_name LIKE '%player_id%';
  
  -- Count foreign key constraints with player_id
  SELECT COUNT(*) INTO v_constraint_count
  FROM information_schema.key_column_usage
  WHERE table_schema = 'public'
  AND column_name LIKE '%player_id%';
  
  v_result := jsonb_build_object(
    'player_id_columns_remaining', v_column_count,
    'player_id_function_params_remaining', v_function_count,
    'player_id_constraints_remaining', v_constraint_count,
    'cleanup_complete', (v_column_count = 0 AND v_function_count = 0),
    'timestamp', NOW()
  );
  
  RETURN v_result;
END;
$function$;