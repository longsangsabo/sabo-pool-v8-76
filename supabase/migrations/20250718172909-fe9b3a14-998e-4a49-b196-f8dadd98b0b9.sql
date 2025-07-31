
-- 1. Function to calculate and sync tournament rewards
CREATE OR REPLACE FUNCTION sync_tournament_rewards(p_tournament_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_tournament RECORD;
  v_prize_distribution JSONB;
  v_spa_points_config JSONB;
  v_elo_points_config JSONB;
  v_calculated_pool NUMERIC := 0;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Calculate standard prize distribution based on entry fee and participants
  v_prize_distribution := jsonb_build_object(
    'first_place', v_tournament.entry_fee * v_tournament.max_participants * 0.5,
    'second_place', v_tournament.entry_fee * v_tournament.max_participants * 0.3,
    'third_place', v_tournament.entry_fee * v_tournament.max_participants * 0.15,
    'participation', v_tournament.entry_fee * v_tournament.max_participants * 0.05
  );
  
  -- Calculate total prize pool
  SELECT SUM(value::numeric) INTO v_calculated_pool
  FROM jsonb_each_text(v_prize_distribution);
  
  -- Standard SPA points configuration by rank
  v_spa_points_config := jsonb_build_object(
    'champion', 1000,
    'runner_up', 700,
    'third_place', 500,
    'top_8', 300,
    'participation', 100
  );
  
  -- Standard ELO points configuration
  v_elo_points_config := jsonb_build_object(
    'champion', 100,
    'runner_up', 50,
    'third_place', 25,
    'top_8', 15,
    'participation', 5
  );
  
  -- Update tournament with calculated rewards
  UPDATE tournaments 
  SET 
    prize_pool = v_calculated_pool,
    prize_distribution = v_prize_distribution,
    spa_points_config = v_spa_points_config,
    elo_points_config = v_elo_points_config,
    updated_at = now()
  WHERE id = p_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'calculated_pool', v_calculated_pool,
    'prize_distribution', v_prize_distribution,
    'spa_points_config', v_spa_points_config,
    'elo_points_config', v_elo_points_config
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger to auto-sync rewards when tournament is created/updated
CREATE OR REPLACE FUNCTION trigger_sync_tournament_rewards()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if entry_fee or max_participants changed
  IF TG_OP = 'INSERT' OR 
     (TG_OP = 'UPDATE' AND (
       OLD.entry_fee != NEW.entry_fee OR 
       OLD.max_participants != NEW.max_participants
     )) THEN
    
    -- Sync rewards automatically
    PERFORM sync_tournament_rewards(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_sync_rewards ON tournaments;
CREATE TRIGGER trigger_sync_rewards
  AFTER INSERT OR UPDATE ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_tournament_rewards();

-- 3. Function to manually fix all existing tournaments
CREATE OR REPLACE FUNCTION fix_all_tournament_rewards()
RETURNS JSONB AS $$
DECLARE
  tournament_record RECORD;
  total_fixed INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Fix all tournaments that don't have proper reward data
  FOR tournament_record IN 
    SELECT id FROM tournaments 
    WHERE status IN ('registration_open', 'registration_closed', 'ongoing', 'upcoming')
    AND (
      prize_distribution IS NULL OR 
      spa_points_config IS NULL OR 
      elo_points_config IS NULL OR
      prize_pool = 0
    )
  LOOP
    SELECT sync_tournament_rewards(tournament_record.id) INTO v_result;
    
    IF v_result->>'success' = 'true' THEN
      total_fixed := total_fixed + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournaments_fixed', total_fixed,
    'message', format('Fixed rewards for %s tournaments', total_fixed)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Run the fix for existing tournaments
SELECT fix_all_tournament_rewards();
