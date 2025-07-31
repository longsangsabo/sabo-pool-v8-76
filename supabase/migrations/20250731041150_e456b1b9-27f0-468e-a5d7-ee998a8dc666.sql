-- Create function to auto-apply default tournament rewards template
CREATE OR REPLACE FUNCTION public.auto_apply_default_tournament_rewards(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_template RECORD;
  v_tournament RECORD;
  v_reward_structure jsonb;
  v_positions jsonb;
  v_position jsonb;
  v_applied_count INTEGER := 0;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found', 'tournament_id', p_tournament_id);
  END IF;
  
  -- Get the most recent active template
  SELECT * INTO v_template 
  FROM tournament_reward_templates 
  WHERE is_active = true 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'No active reward template found');
  END IF;
  
  -- Extract reward structure
  v_reward_structure := v_template.reward_structure;
  v_positions := v_reward_structure->'positions';
  
  -- Clear existing prize tiers for this tournament
  DELETE FROM tournament_prize_tiers WHERE tournament_id = p_tournament_id;
  
  -- Apply template positions to tournament_prize_tiers
  IF v_positions IS NOT NULL THEN
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
        physical_items,
        created_at,
        updated_at
      ) VALUES (
        p_tournament_id,
        COALESCE((v_position->>'position')::INTEGER, 1),
        COALESCE(v_position->>'name', 'Position ' || COALESCE(v_position->>'position', '1')),
        COALESCE((v_position->>'cashPrize')::NUMERIC, 0),
        COALESCE((v_position->>'eloPoints')::INTEGER, 0),
        COALESCE((v_position->>'spaPoints')::INTEGER, 0),
        COALESCE((v_position->>'isVisible')::BOOLEAN, true),
        COALESCE(
          (SELECT jsonb_agg(value) FROM jsonb_array_elements_text(v_position->'items')), 
          '[]'::jsonb
        ),
        NOW(),
        NOW()
      );
      
      v_applied_count := v_applied_count + 1;
    END LOOP;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'template_applied', v_template.name,
    'positions_created', v_applied_count,
    'message', 'Default reward template applied successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'tournament_id', p_tournament_id,
      'template_id', v_template.id
    );
END;
$$;

-- Create trigger function for new tournaments
CREATE OR REPLACE FUNCTION public.auto_setup_tournament_rewards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Only apply rewards to new tournaments
  IF TG_OP = 'INSERT' THEN
    -- Apply default reward template
    SELECT public.auto_apply_default_tournament_rewards(NEW.id) INTO v_result;
    
    -- Log the result (optional, for debugging)
    RAISE NOTICE 'Auto-applied rewards for tournament %: %', NEW.id, v_result;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on tournaments table
DROP TRIGGER IF EXISTS trigger_auto_setup_tournament_rewards ON tournaments;
CREATE TRIGGER trigger_auto_setup_tournament_rewards
  AFTER INSERT ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION auto_setup_tournament_rewards();

-- Apply default template to the latest tournament (d0af367a-18d7-41b9-a5b6-aaf3de5d1bb2)
SELECT public.auto_apply_default_tournament_rewards('d0af367a-18d7-41b9-a5b6-aaf3de5d1bb2');

-- Verify the results
SELECT 
  'tournament_prize_tiers' as table_name,
  tournament_id,
  position,
  position_name,
  cash_amount,
  elo_points,
  spa_points
FROM tournament_prize_tiers 
WHERE tournament_id = 'd0af367a-18d7-41b9-a5b6-aaf3de5d1bb2'
ORDER BY position;