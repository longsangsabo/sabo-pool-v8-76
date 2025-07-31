-- Fix column name mapping in auto_apply_default_tournament_rewards function
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
  v_items_array text[];
BEGIN
  -- Temporarily disable RLS for this function
  SET row_security = off;
  
  -- Get the active default template
  SELECT * INTO v_template
  FROM tournament_reward_templates
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_template IS NULL THEN
    SET row_security = on;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No active reward template found'
    );
  END IF;
  
  -- Clear existing prize tiers for this tournament
  DELETE FROM tournament_prize_tiers WHERE tournament_id = p_tournament_id;
  
  -- Extract positions array from reward_structure
  v_positions := v_template.reward_structure->'positions';
  
  IF v_positions IS NULL OR jsonb_array_length(v_positions) = 0 THEN
    SET row_security = on;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No positions found in template reward structure',
      'template_name', v_template.name,
      'reward_structure', v_template.reward_structure
    );
  END IF;
  
  -- Insert each position from the template
  FOR v_position IN SELECT * FROM jsonb_array_elements(v_positions)
  LOOP
    -- Convert items jsonb array to text array safely
    v_items_array := ARRAY[]::text[];
    IF v_position ? 'items' AND v_position->'items' IS NOT NULL THEN
      SELECT array_agg(value::text) INTO v_items_array
      FROM jsonb_array_elements_text(v_position->'items');
      
      -- Handle null result
      IF v_items_array IS NULL THEN
        v_items_array := ARRAY[]::text[];
      END IF;
    END IF;
    
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
      COALESCE((v_position->>'position')::INTEGER, 1),
      COALESCE(v_position->>'name', 'Position'),
      COALESCE((v_position->>'cashPrize')::NUMERIC, 0),
      COALESCE((v_position->>'eloPoints')::INTEGER, 0),
      COALESCE((v_position->>'spaPoints')::INTEGER, 0),
      COALESCE((v_position->>'isVisible')::BOOLEAN, true),
      v_items_array
    );
    
    v_inserted_count := v_inserted_count + 1;
  END LOOP;
  
  -- Re-enable RLS
  SET row_security = on;
  
  RETURN jsonb_build_object(
    'success', true,
    'template_applied', v_template.name,
    'positions_inserted', v_inserted_count,
    'tournament_id', p_tournament_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Ensure RLS is re-enabled even on error
    SET row_security = on;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE,
      'tournament_id', p_tournament_id
    );
END;
$$;

-- Test the function again with SABO tournament
SELECT public.auto_apply_default_tournament_rewards('daa82318-5e34-46ef-951f-f464ab706daf');

-- Now verify results
SELECT 
  tournament_id,
  position,
  position_name,
  cash_amount,
  elo_points,
  spa_points,
  is_visible,
  physical_items
FROM tournament_prize_tiers 
WHERE tournament_id = 'daa82318-5e34-46ef-951f-f464ab706daf'
ORDER BY position;