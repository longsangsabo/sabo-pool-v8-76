-- Fix the sync all function to handle ORDER BY with DISTINCT correctly
CREATE OR REPLACE FUNCTION public.sync_all_completed_tournament_rewards()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_total_tournaments INTEGER := 0;
  v_successful_syncs INTEGER := 0;
  v_results JSONB[] := '{}';
  v_sync_result JSONB;
BEGIN
  -- Process all completed tournaments that have prize tiers
  FOR v_tournament IN
    SELECT t.id, t.name, t.completed_at
    FROM public.tournaments t
    WHERE t.status = 'completed'
      AND EXISTS (
        SELECT 1 FROM public.tournament_prize_tiers tpt 
        WHERE tpt.tournament_id = t.id
      )
    ORDER BY t.completed_at DESC NULLS LAST
  LOOP
    v_total_tournaments := v_total_tournaments + 1;
    
    -- Sync rewards for this tournament
    SELECT public.sync_tournament_rewards_from_tiers(v_tournament.id) INTO v_sync_result;
    
    IF (v_sync_result->>'success')::boolean THEN
      v_successful_syncs := v_successful_syncs + 1;
    END IF;
    
    v_results := v_results || jsonb_build_object(
      'tournament_id', v_tournament.id,
      'tournament_name', v_tournament.name,
      'result', v_sync_result
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_tournaments', v_total_tournaments,
    'successful_syncs', v_successful_syncs,
    'failed_syncs', v_total_tournaments - v_successful_syncs,
    'details', v_results,
    'migration_completed_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'total_tournaments', v_total_tournaments,
      'successful_syncs', v_successful_syncs
    );
END;
$$;