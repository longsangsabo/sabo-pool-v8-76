-- Create a simpler debug version that shows exact error
CREATE OR REPLACE FUNCTION public.debug_apply_tournament_rewards(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_template RECORD;
  v_positions jsonb;
  v_position jsonb;
  v_debug_info jsonb := jsonb_build_object();
BEGIN
  -- Get template first
  SELECT * INTO v_template
  FROM tournament_reward_templates
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_template IS NULL THEN
    RETURN jsonb_build_object('error', 'No template found');
  END IF;
  
  v_debug_info := v_debug_info || jsonb_build_object('template_found', v_template.name);
  
  -- Get positions
  v_positions := v_template.reward_structure->'positions';
  v_debug_info := v_debug_info || jsonb_build_object('positions_count', jsonb_array_length(v_positions));
  
  -- Test first position
  IF jsonb_array_length(v_positions) > 0 THEN
    v_position := v_positions->0;
    v_debug_info := v_debug_info || jsonb_build_object(
      'first_position', v_position,
      'position_value', v_position->>'position'
    );
  END IF;
  
  -- Try a simple insert with fixed values first
  BEGIN
    INSERT INTO tournament_prize_tiers (
      tournament_id, position, position_name, cash_amount, elo_points, spa_points, is_visible
    ) VALUES (
      p_tournament_id, 1, 'Test Position', 100, 10, 10, true
    );
    v_debug_info := v_debug_info || jsonb_build_object('simple_insert', 'success');
  EXCEPTION
    WHEN OTHERS THEN
      v_debug_info := v_debug_info || jsonb_build_object('simple_insert_error', SQLERRM);
  END;
  
  RETURN jsonb_build_object('debug', v_debug_info);
END;
$$;

-- Test the debug function
SELECT public.debug_apply_tournament_rewards('daa82318-5e34-46ef-951f-f464ab706daf');