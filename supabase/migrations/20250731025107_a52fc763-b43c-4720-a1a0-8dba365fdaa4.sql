-- Create function to sync tournament rewards from prize tiers to results
CREATE OR REPLACE FUNCTION public.sync_tournament_rewards_from_tiers(p_tournament_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Update tournament_results with data from tournament_prize_tiers
  UPDATE public.tournament_results tr
  SET 
    spa_points_earned = COALESCE(tpt.spa_points, tr.spa_points_earned),
    elo_points_earned = COALESCE(tpt.elo_points, tr.elo_points_earned),
    prize_amount = COALESCE(tpt.cash_amount, tr.prize_amount),
    physical_rewards = COALESCE(tpt.physical_items, tr.physical_rewards),
    placement_type = COALESCE(tpt.position_name, tr.placement_type),
    updated_at = NOW()
  FROM public.tournament_prize_tiers tpt
  WHERE tr.tournament_id = p_tournament_id
    AND tpt.tournament_id = p_tournament_id
    AND tr.final_position = tpt.position
    AND tpt.is_visible = true;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Log the sync operation
  INSERT INTO public.tournament_automation_log (
    tournament_id,
    automation_type,
    status,
    details,
    completed_at
  ) VALUES (
    p_tournament_id,
    'reward_sync',
    'completed',
    jsonb_build_object(
      'updated_results', v_updated_count,
      'sync_timestamp', NOW(),
      'sync_source', 'tournament_prize_tiers'
    ),
    NOW()
  );
  
  v_result := jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'updated_results', v_updated_count,
    'message', format('Successfully synced %s tournament results with prize tiers', v_updated_count)
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    INSERT INTO public.tournament_automation_log (
      tournament_id,
      automation_type,
      status,
      error_message,
      completed_at
    ) VALUES (
      p_tournament_id,
      'reward_sync',
      'failed',
      SQLERRM,
      NULL
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournament_id', p_tournament_id
    );
END;
$$;

-- Create trigger function to auto-sync rewards when tournament completes
CREATE OR REPLACE FUNCTION public.auto_sync_tournament_rewards()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only sync when tournament status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Call the sync function asynchronously
    PERFORM public.sync_tournament_rewards_from_tiers(NEW.id);
    
    RAISE NOTICE 'Auto-synced tournament rewards for tournament: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on tournaments table
DROP TRIGGER IF EXISTS trigger_auto_sync_tournament_rewards ON public.tournaments;
CREATE TRIGGER trigger_auto_sync_tournament_rewards
  AFTER UPDATE OF status ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_sync_tournament_rewards();

-- Create function to sync all completed tournaments (for migration)
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
    SELECT DISTINCT t.id, t.name
    FROM public.tournaments t
    INNER JOIN public.tournament_prize_tiers tpt ON t.id = tpt.tournament_id
    WHERE t.status = 'completed'
    ORDER BY t.completed_at DESC
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