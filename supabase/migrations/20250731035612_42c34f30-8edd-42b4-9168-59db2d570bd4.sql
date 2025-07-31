-- ===================================================
-- WORKFLOW: Tournament Creation → Prize Configuration → Results
-- ===================================================

-- Function 1: Apply template to create prize tiers
CREATE OR REPLACE FUNCTION apply_tournament_reward_template(
  p_tournament_id UUID,
  p_template_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_template RECORD;
  v_template_data JSONB;
  v_positions JSONB;
  v_position JSONB;
  v_count INTEGER := 0;
BEGIN
  -- Get template data
  SELECT * INTO v_template 
  FROM tournament_reward_templates 
  WHERE id = p_template_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Template not found or inactive');
  END IF;
  
  -- Clear existing prize tiers for this tournament
  DELETE FROM tournament_prize_tiers WHERE tournament_id = p_tournament_id;
  
  -- Extract template data
  v_template_data := v_template.template_data;
  v_positions := v_template_data->'positions';
  
  -- Apply each position from template
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
        physical_items,
        is_visible,
        created_at,
        updated_at
      ) VALUES (
        p_tournament_id,
        COALESCE((v_position->>'position')::INTEGER, v_count + 1),
        COALESCE(v_position->>'name', 'Position ' || (v_count + 1)),
        COALESCE((v_position->>'cashPrize')::NUMERIC, 0),
        COALESCE((v_position->>'eloPoints')::INTEGER, 0),
        COALESCE((v_position->>'spaPoints')::INTEGER, 0),
        COALESCE(v_position->'items', '[]'::jsonb)::TEXT[],
        COALESCE((v_position->>'isVisible')::BOOLEAN, true),
        NOW(),
        NOW()
      );
      
      v_count := v_count + 1;
    END LOOP;
  END IF;
  
  -- Update template usage count
  UPDATE tournament_reward_templates 
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = p_template_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'template_id', p_template_id,
    'positions_created', v_count,
    'message', 'Template applied successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Failed to apply template: %s', SQLERRM)
    );
END;
$$;

-- Function 2: Auto-generate tournament results from prize tiers
CREATE OR REPLACE FUNCTION generate_tournament_results_from_tiers(
  p_tournament_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament RECORD;
  v_prize_tier RECORD;
  v_participant RECORD;
  v_participants UUID[];
  v_results_created INTEGER := 0;
  v_total_participants INTEGER;
  v_position INTEGER := 1;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament 
  FROM tournaments 
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Clear existing results
  DELETE FROM tournament_results WHERE tournament_id = p_tournament_id;
  
  -- Get all participants (registered and confirmed)
  SELECT array_agg(user_id) INTO v_participants
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id 
  AND registration_status = 'confirmed';
  
  v_total_participants := array_length(v_participants, 1);
  
  IF v_total_participants IS NULL OR v_total_participants = 0 THEN
    RETURN jsonb_build_object('error', 'No confirmed participants found');
  END IF;
  
  -- Process each prize tier position
  FOR v_prize_tier IN
    SELECT * FROM tournament_prize_tiers 
    WHERE tournament_id = p_tournament_id 
    ORDER BY position ASC
  LOOP
    -- Only create results for positions we have participants for
    IF v_prize_tier.position <= v_total_participants THEN
      -- For now, assign participants randomly (in real scenario, this would be based on match results)
      INSERT INTO tournament_results (
        tournament_id,
        user_id,
        final_position,
        spa_points_earned,
        elo_points_earned,
        prize_amount,
        placement_type,
        created_at,
        updated_at
      ) VALUES (
        p_tournament_id,
        v_participants[v_prize_tier.position], -- This would be determined by actual bracket results
        v_prize_tier.position,
        COALESCE(v_prize_tier.spa_points, 0),
        COALESCE(v_prize_tier.elo_points, 0),
        COALESCE(v_prize_tier.cash_amount, 0),
        CASE 
          WHEN v_prize_tier.position = 1 THEN 'champion'
          WHEN v_prize_tier.position = 2 THEN 'runner_up'
          WHEN v_prize_tier.position = 3 THEN 'third_place'
          ELSE 'participant'
        END,
        NOW(),
        NOW()
      );
      
      v_results_created := v_results_created + 1;
    END IF;
  END LOOP;
  
  -- Create participation results for remaining participants
  FOR i IN (v_results_created + 1)..v_total_participants LOOP
    INSERT INTO tournament_results (
      tournament_id,
      user_id,
      final_position,
      spa_points_earned,
      elo_points_earned,
      prize_amount,
      placement_type,
      created_at,
      updated_at
    ) VALUES (
      p_tournament_id,
      v_participants[i],
      i,
      100, -- Default participation SPA points
      10,  -- Default participation ELO points
      0,   -- No cash prize for participation
      'participant',
      NOW(),
      NOW()
    );
    
    v_results_created := v_results_created + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'results_created', v_results_created,
    'total_participants', v_total_participants,
    'message', 'Tournament results generated successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Failed to generate results: %s', SQLERRM)
    );
END;
$$;

-- Function 3: Complete tournament workflow
CREATE OR REPLACE FUNCTION complete_tournament_workflow(
  p_tournament_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_tournament RECORD;
BEGIN
  -- Check tournament status
  SELECT * INTO v_tournament 
  FROM tournaments 
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Only process completed tournaments
  IF v_tournament.status != 'completed' THEN
    RETURN jsonb_build_object('error', 'Tournament is not completed yet');
  END IF;
  
  -- Generate results from prize tiers
  SELECT generate_tournament_results_from_tiers(p_tournament_id) INTO v_result;
  
  IF v_result ? 'error' THEN
    RETURN v_result;
  END IF;
  
  -- Update player rankings with earned points
  UPDATE player_rankings pr
  SET 
    spa_points = pr.spa_points + tr.spa_points_earned,
    elo_points = pr.elo_points + tr.elo_points_earned,
    updated_at = NOW()
  FROM tournament_results tr
  WHERE pr.user_id = tr.user_id 
  AND tr.tournament_id = p_tournament_id;
  
  -- Log completion
  INSERT INTO tournament_automation_log (
    tournament_id,
    automation_type,
    status,
    details,
    completed_at
  ) VALUES (
    p_tournament_id,
    'workflow_completion',
    'completed',
    jsonb_build_object(
      'results_generated', v_result->'results_created',
      'workflow_type', 'template_to_results'
    ),
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'workflow_completed', true,
    'results', v_result
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Workflow completion failed: %s', SQLERRM)
    );
END;
$$;

-- Trigger: Auto-complete workflow when tournament status changes to completed
CREATE OR REPLACE FUNCTION trigger_tournament_completion_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Only trigger when status changes to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Run the complete workflow
    SELECT complete_tournament_workflow(NEW.id) INTO v_result;
    
    -- Log the trigger execution
    RAISE NOTICE 'Tournament completion workflow triggered for %: %', NEW.id, v_result;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS tournament_completion_workflow_trigger ON tournaments;

-- Create the trigger
CREATE TRIGGER tournament_completion_workflow_trigger
  AFTER UPDATE ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_tournament_completion_workflow();

-- Function 4: Initialize tournament with default template
CREATE OR REPLACE FUNCTION initialize_tournament_rewards(
  p_tournament_id UUID,
  p_tier_level INTEGER DEFAULT 1
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_default_template_id UUID;
  v_result JSONB;
BEGIN
  -- Find default template for tier level
  SELECT id INTO v_default_template_id
  FROM tournament_reward_templates
  WHERE tier_level = p_tier_level 
  AND is_active = true
  AND is_default = true
  LIMIT 1;
  
  -- If no default template, use any template for that tier
  IF v_default_template_id IS NULL THEN
    SELECT id INTO v_default_template_id
    FROM tournament_reward_templates
    WHERE tier_level = p_tier_level 
    AND is_active = true
    LIMIT 1;
  END IF;
  
  -- If still no template, create basic rewards
  IF v_default_template_id IS NULL THEN
    -- Create basic prize structure
    INSERT INTO tournament_prize_tiers (
      tournament_id, position, position_name, cash_amount, elo_points, spa_points, is_visible
    ) VALUES 
      (p_tournament_id, 1, 'Vô địch', 1000000, 100, 500, true),
      (p_tournament_id, 2, 'Á quân', 600000, 75, 300, true),
      (p_tournament_id, 3, 'Hạng 3', 400000, 50, 200, true);
    
    RETURN jsonb_build_object(
      'success', true,
      'method', 'basic_structure',
      'message', 'Basic prize structure created'
    );
  ELSE
    -- Apply template
    SELECT apply_tournament_reward_template(p_tournament_id, v_default_template_id) INTO v_result;
    RETURN v_result;
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Failed to initialize rewards: %s', SQLERRM)
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION apply_tournament_reward_template(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_tournament_results_from_tiers(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_tournament_workflow(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_tournament_rewards(UUID, INTEGER) TO authenticated;