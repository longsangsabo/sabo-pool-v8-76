-- Create function to sync tournament rewards from prize tiers to results
CREATE OR REPLACE FUNCTION public.sync_tournament_rewards_simple(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_tier RECORD;
BEGIN
  -- Update tournament_results with data from tournament_prize_tiers
  FOR v_tier IN
    SELECT position, spa_points, elo_points, cash_amount
    FROM tournament_prize_tiers
    WHERE tournament_id = p_tournament_id
    ORDER BY position
  LOOP
    UPDATE tournament_results 
    SET 
      spa_points_earned = v_tier.spa_points,
      elo_points_awarded = v_tier.elo_points,
      prize_amount = v_tier.cash_amount,
      updated_at = NOW()
    WHERE tournament_id = p_tournament_id 
    AND final_position = v_tier.position;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    IF v_updated_count > 0 THEN
      v_updated_count := v_updated_count + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'updated_results', v_updated_count
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournament_id', p_tournament_id
    );
END;
$$;

-- Now call the function to sync the tournament
SELECT public.sync_tournament_rewards_simple('24b8a0a5-5bd1-44c7-9f87-7aff86c62b49');