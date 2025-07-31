-- Create function to sync tournament rewards from prize tiers to results
CREATE OR REPLACE FUNCTION public.sync_tournament_rewards_from_tiers(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_prize_tier RECORD;
  v_updated_count INTEGER := 0;
  v_total_count INTEGER := 0;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF v_tournament IS NULL THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Count total results
  SELECT COUNT(*) INTO v_total_count FROM tournament_results WHERE tournament_id = p_tournament_id;
  
  -- Update each result based on prize tiers
  FOR v_prize_tier IN
    SELECT * FROM tournament_prize_tiers 
    WHERE tournament_id = p_tournament_id
    ORDER BY position
  LOOP
    -- Update tournament results with correct rewards from prize tiers
    UPDATE tournament_results
    SET 
      spa_points_earned = v_prize_tier.spa_points,
      elo_points_earned = v_prize_tier.elo_points,
      prize_amount = v_prize_tier.cash_amount,
      physical_rewards = v_prize_tier.physical_items,
      placement_type = v_prize_tier.position_name,
      updated_at = NOW()
    WHERE tournament_id = p_tournament_id 
    AND final_position = v_prize_tier.position;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RAISE NOTICE 'Updated % results for position %', v_updated_count, v_prize_tier.position;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'tournament_name', v_tournament.name,
    'total_results', v_total_count,
    'updated_results', v_updated_count,
    'message', 'Tournament rewards synced successfully from prize tiers'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournament_id', p_tournament_id
    );
END;
$function$;

-- Create function to sync all completed tournament rewards
CREATE OR REPLACE FUNCTION public.sync_all_completed_tournament_rewards()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_synced_count INTEGER := 0;
  v_total_tournaments INTEGER := 0;
  v_sync_result JSONB;
  v_results JSONB[] := '{}';
BEGIN
  -- Find all completed tournaments that have both results and prize tiers
  FOR v_tournament IN
    SELECT DISTINCT t.id, t.name
    FROM tournaments t
    INNER JOIN tournament_results tr ON t.id = tr.tournament_id
    INNER JOIN tournament_prize_tiers tpt ON t.id = tpt.tournament_id
    WHERE t.status = 'completed'
    ORDER BY t.updated_at DESC
  LOOP
    v_total_tournaments := v_total_tournaments + 1;
    
    -- Sync this tournament
    SELECT public.sync_tournament_rewards_from_tiers(v_tournament.id) INTO v_sync_result;
    
    IF (v_sync_result->>'success')::boolean THEN
      v_synced_count := v_synced_count + 1;
    END IF;
    
    v_results := v_results || v_sync_result;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_tournaments', v_total_tournaments,
    'synced_tournaments', v_synced_count,
    'details', v_results,
    'message', format('Synced %s out of %s tournaments', v_synced_count, v_total_tournaments)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'total_tournaments', v_total_tournaments,
      'synced_tournaments', v_synced_count
    );
END;
$function$;