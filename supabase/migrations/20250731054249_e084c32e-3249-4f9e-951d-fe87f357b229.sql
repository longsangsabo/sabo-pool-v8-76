-- Create function to fix missing tournament positions
CREATE OR REPLACE FUNCTION public.fix_tournament_positions(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_semifinalists UUID[];
  v_result RECORD;
  v_current_position INTEGER;
  v_fixed_count INTEGER := 0;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF v_tournament IS NULL THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- For double elimination tournaments, get semifinalists from tournament matches
  IF v_tournament.tournament_type = 'double_elimination' THEN
    -- Get semifinalists (losers of semifinals - round 250)
    SELECT array_agg(
      CASE WHEN player1_id != winner_id THEN player1_id ELSE player2_id END
    ) INTO v_semifinalists
    FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
    AND round_number = 250  -- semifinals
    AND winner_id IS NOT NULL;
    
    -- Update semifinalists to positions 3 and 4
    IF array_length(v_semifinalists, 1) >= 1 THEN
      UPDATE tournament_results
      SET final_position = 3, 
          placement_type = 'Hạng 3',
          updated_at = NOW()
      WHERE tournament_id = p_tournament_id 
      AND user_id = v_semifinalists[1];
      
      v_fixed_count := v_fixed_count + 1;
    END IF;
    
    IF array_length(v_semifinalists, 1) >= 2 THEN
      UPDATE tournament_results
      SET final_position = 4,
          placement_type = 'Hạng 4', 
          updated_at = NOW()
      WHERE tournament_id = p_tournament_id 
      AND user_id = v_semifinalists[2];
      
      v_fixed_count := v_fixed_count + 1;
    END IF;
    
    -- Shift remaining positions down
    v_current_position := 5;
    FOR v_result IN
      SELECT user_id FROM tournament_results 
      WHERE tournament_id = p_tournament_id 
      AND final_position > 4
      AND user_id != ALL(COALESCE(v_semifinalists, ARRAY[]::UUID[]))
      ORDER BY final_position
    LOOP
      UPDATE tournament_results
      SET final_position = v_current_position,
          placement_type = 'Hạng ' || v_current_position,
          updated_at = NOW()
      WHERE tournament_id = p_tournament_id 
      AND user_id = v_result.user_id;
      
      v_current_position := v_current_position + 1;
    END LOOP;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'tournament_name', v_tournament.name,
    'semifinalists_fixed', COALESCE(array_length(v_semifinalists, 1), 0),
    'total_positions_fixed', v_fixed_count,
    'message', 'Tournament positions fixed successfully'
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

-- Apply fix to test3 tournament and sync rewards
DO $$
DECLARE
  v_test3_id UUID;
  v_fix_result JSONB;
  v_sync_result JSONB;
BEGIN
  -- Find test3 tournament
  SELECT id INTO v_test3_id 
  FROM tournaments 
  WHERE name ILIKE '%test%3%' OR name ILIKE '%test3%'
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF v_test3_id IS NOT NULL THEN
    -- Fix positions
    SELECT public.fix_tournament_positions(v_test3_id) INTO v_fix_result;
    RAISE NOTICE 'Fix result: %', v_fix_result;
    
    -- Sync rewards
    SELECT public.sync_tournament_rewards_from_tiers(v_test3_id) INTO v_sync_result;
    RAISE NOTICE 'Sync result: %', v_sync_result;
  ELSE
    RAISE NOTICE 'Test3 tournament not found';
  END IF;
END $$;