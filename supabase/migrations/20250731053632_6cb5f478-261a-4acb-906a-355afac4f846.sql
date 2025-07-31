-- Fix the sync function to handle JSONB conversion properly
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
      physical_rewards = COALESCE(v_prize_tier.physical_items::jsonb, '[]'::jsonb),
      placement_type = v_prize_tier.position_name,
      updated_at = NOW()
    WHERE tournament_id = p_tournament_id 
    AND final_position = v_prize_tier.position;
    
    v_updated_count := v_updated_count + ROW_COUNT;
    
    RAISE NOTICE 'Updated position % with % records', v_prize_tier.position, ROW_COUNT;
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