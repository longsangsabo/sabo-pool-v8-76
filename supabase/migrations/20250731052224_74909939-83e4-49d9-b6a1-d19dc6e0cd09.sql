-- Create function to populate default tournament rewards
CREATE OR REPLACE FUNCTION populate_default_tournament_rewards(tournament_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_count INTEGER;
  v_created_count INTEGER := 0;
BEGIN
  -- Check if tournament already has prize tiers
  SELECT COUNT(*) INTO v_existing_count 
  FROM tournament_prize_tiers 
  WHERE tournament_id = tournament_id_param;
  
  -- If already has prize tiers, return early
  IF v_existing_count > 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Tournament already has prize tiers',
      'existing_count', v_existing_count,
      'created_count', 0
    );
  END IF;
  
  -- Create default 16-position rewards
  INSERT INTO tournament_prize_tiers (
    tournament_id,
    position,
    position_name,
    cash_amount,
    elo_points,
    spa_points,
    is_visible,
    physical_items
  ) VALUES
  (tournament_id_param, 1, 'Hạng 1', 0, 100, 500, true, '{}'),
  (tournament_id_param, 2, 'Hạng 2', 0, 90, 400, true, '{}'),
  (tournament_id_param, 3, 'Hạng 3', 0, 80, 350, true, '{}'),
  (tournament_id_param, 4, 'Hạng 4', 0, 70, 300, true, '{}'),
  (tournament_id_param, 5, 'Hạng 5', 0, 60, 250, true, '{}'),
  (tournament_id_param, 6, 'Hạng 6', 0, 50, 200, true, '{}'),
  (tournament_id_param, 7, 'Hạng 7', 0, 40, 180, true, '{}'),
  (tournament_id_param, 8, 'Hạng 8', 0, 35, 160, true, '{}'),
  (tournament_id_param, 9, 'Hạng 9', 0, 30, 140, true, '{}'),
  (tournament_id_param, 10, 'Hạng 10', 0, 25, 120, true, '{}'),
  (tournament_id_param, 11, 'Hạng 11', 0, 20, 100, true, '{}'),
  (tournament_id_param, 12, 'Hạng 12', 0, 18, 90, true, '{}'),
  (tournament_id_param, 13, 'Hạng 13', 0, 15, 80, true, '{}'),
  (tournament_id_param, 14, 'Hạng 14', 0, 12, 70, true, '{}'),
  (tournament_id_param, 15, 'Hạng 15', 0, 10, 60, true, '{}'),
  (tournament_id_param, 16, 'Hạng 16', 0, 8, 50, true, '{}');
  
  GET DIAGNOSTICS v_created_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Default rewards created successfully',
    'existing_count', v_existing_count,
    'created_count', v_created_count
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'existing_count', v_existing_count,
      'created_count', v_created_count
    );
END;
$$;

-- Create trigger function to auto-populate rewards when tournament is created
CREATE OR REPLACE FUNCTION auto_populate_tournament_rewards()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create default rewards for new tournaments
  IF TG_OP = 'INSERT' THEN
    -- Call our function to populate default rewards
    PERFORM populate_default_tournament_rewards(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically populate rewards on tournament creation
DROP TRIGGER IF EXISTS trigger_auto_populate_tournament_rewards ON tournaments;
CREATE TRIGGER trigger_auto_populate_tournament_rewards
  AFTER INSERT ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_tournament_rewards();

-- Populate rewards for existing tournaments that don't have any
DO $$
DECLARE
  tournament_record RECORD;
  result JSONB;
BEGIN
  -- Loop through tournaments without prize tiers
  FOR tournament_record IN
    SELECT t.id, t.name 
    FROM tournaments t
    LEFT JOIN tournament_prize_tiers pt ON t.id = pt.tournament_id
    WHERE pt.tournament_id IS NULL
  LOOP
    -- Populate default rewards for this tournament
    SELECT populate_default_tournament_rewards(tournament_record.id) INTO result;
    
    RAISE NOTICE 'Populated rewards for tournament: % (%) - Result: %', 
      tournament_record.name, tournament_record.id, result;
  END LOOP;
END;
$$;