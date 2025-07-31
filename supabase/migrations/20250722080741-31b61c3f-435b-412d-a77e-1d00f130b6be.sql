
-- Create function to generate tournament results template
CREATE OR REPLACE FUNCTION public.create_tournament_results_template(
  p_tournament_id UUID,
  p_max_participants INTEGER DEFAULT 16
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_position INTEGER;
  v_points_earned INTEGER;
  v_elo_points INTEGER;
  v_prize_money NUMERIC;
  v_physical_rewards JSONB;
  v_created_count INTEGER := 0;
BEGIN
  -- Delete existing template if any
  DELETE FROM public.tournament_results 
  WHERE tournament_id = p_tournament_id AND user_id IS NULL;
  
  -- Create template results for each position
  FOR v_position IN 1..p_max_participants LOOP
    -- Calculate rewards based on position
    CASE 
      WHEN v_position = 1 THEN
        v_points_earned := 1000;
        v_elo_points := 100;
        v_prize_money := 2000000;
        v_physical_rewards := '["Cúp vô địch", "Huy chương vàng", "Giấy chứng nhận"]'::jsonb;
      WHEN v_position = 2 THEN
        v_points_earned := 700;
        v_elo_points := 75;
        v_prize_money := 1200000;
        v_physical_rewards := '["Huy chương bạc", "Giấy chứng nhận"]'::jsonb;
      WHEN v_position = 3 THEN
        v_points_earned := 500;
        v_elo_points := 50;
        v_prize_money := 800000;
        v_physical_rewards := '["Huy chương đồng", "Giấy chứng nhận"]'::jsonb;
      WHEN v_position <= 8 THEN
        v_points_earned := 300;
        v_elo_points := 25;
        v_prize_money := 400000;
        v_physical_rewards := '["Giấy chứng nhận"]'::jsonb;
      WHEN v_position <= 16 THEN
        v_points_earned := 100;
        v_elo_points := 10;
        v_prize_money := 100000;
        v_physical_rewards := '["Giấy chứng nhận"]'::jsonb;
      ELSE
        v_points_earned := 50;
        v_elo_points := 5;
        v_prize_money := 0;
        v_physical_rewards := '["Giấy chứng nhận"]'::jsonb;
    END CASE;
    
    -- Insert template result
    INSERT INTO public.tournament_results (
      tournament_id,
      user_id,
      position,
      final_position,
      points_earned,
      elo_points_earned,
      prize_money,
      physical_rewards,
      matches_played,
      matches_won,
      matches_lost,
      created_at,
      updated_at
    ) VALUES (
      p_tournament_id,
      NULL, -- Template - no user assigned yet
      v_position,
      v_position,
      v_points_earned,
      v_elo_points,
      v_prize_money,
      v_physical_rewards,
      0, -- Will be updated when assigned
      0,
      0,
      NOW(),
      NOW()
    );
    
    v_created_count := v_created_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'template_results_created', v_created_count,
    'max_participants', p_max_participants
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Create function to assign user to tournament result position
CREATE OR REPLACE FUNCTION public.assign_tournament_result_position(
  p_tournament_id UUID,
  p_user_id UUID,
  p_position INTEGER,
  p_matches_played INTEGER DEFAULT 0,
  p_matches_won INTEGER DEFAULT 0,
  p_matches_lost INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result_exists BOOLEAN;
BEGIN
  -- Check if template position exists
  SELECT EXISTS(
    SELECT 1 FROM public.tournament_results 
    WHERE tournament_id = p_tournament_id 
      AND position = p_position 
      AND user_id IS NULL
  ) INTO v_result_exists;
  
  IF NOT v_result_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Template position not found for position ' || p_position
    );
  END IF;
  
  -- Update the template with user data
  UPDATE public.tournament_results
  SET 
    user_id = p_user_id,
    matches_played = p_matches_played,
    matches_won = p_matches_won,
    matches_lost = p_matches_lost,
    win_percentage = CASE 
      WHEN p_matches_played > 0 THEN ROUND((p_matches_won::numeric / p_matches_played * 100), 2)
      ELSE 0 
    END,
    updated_at = NOW()
  WHERE tournament_id = p_tournament_id 
    AND position = p_position 
    AND user_id IS NULL;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'user_id', p_user_id,
    'position', p_position,
    'assigned', true
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_tournament_results_template(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_tournament_result_position(UUID, UUID, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;
