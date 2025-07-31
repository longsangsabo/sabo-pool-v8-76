-- Fix the auto_apply_default_tournament_rewards function to properly parse JSON
CREATE OR REPLACE FUNCTION public.auto_apply_default_tournament_rewards(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_template RECORD;
  v_positions jsonb;
  v_position jsonb;
  v_inserted_count INTEGER := 0;
BEGIN
  -- Get the active default template
  SELECT * INTO v_template
  FROM tournament_reward_templates
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_template IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No active reward template found'
    );
  END IF;
  
  -- Clear existing prize tiers for this tournament
  DELETE FROM tournament_prize_tiers WHERE tournament_id = p_tournament_id;
  
  -- Extract positions array from reward_structure
  v_positions := v_template.reward_structure->'positions';
  
  IF v_positions IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No positions found in template reward structure'
    );
  END IF;
  
  -- Insert each position from the template
  FOR v_position IN SELECT * FROM jsonb_array_elements(v_positions)
  LOOP
    INSERT INTO tournament_prize_tiers (
      tournament_id,
      position,
      position_name,
      cash_amount,
      elo_points,
      spa_points,
      is_visible,
      physical_items
    ) VALUES (
      p_tournament_id,
      (v_position->>'position')::INTEGER,
      v_position->>'name',
      COALESCE((v_position->>'cashPrize')::NUMERIC, 0),
      COALESCE((v_position->>'eloPoints')::INTEGER, 0),
      COALESCE((v_position->>'spaPoints')::INTEGER, 0),
      COALESCE((v_position->>'isVisible')::BOOLEAN, true),
      COALESCE(v_position->'items', '[]'::jsonb)
    );
    
    v_inserted_count := v_inserted_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'template_applied', v_template.name,
    'positions_inserted', v_inserted_count,
    'tournament_id', p_tournament_id
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

-- Test the fixed function with the latest tournament
SELECT public.auto_apply_default_tournament_rewards('daa82318-5e34-46ef-951f-f464ab706daf');