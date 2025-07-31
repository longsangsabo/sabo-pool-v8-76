-- Create trigger function to automatically sync tournament rewards
CREATE OR REPLACE FUNCTION public.sync_tournament_rewards_on_tier_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update corresponding tournament_results when prize_tiers change
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE tournament_results 
    SET 
      spa_points_earned = NEW.spa_points,
      elo_points_awarded = NEW.elo_points,
      prize_amount = NEW.cash_amount,
      updated_at = NOW()
    WHERE tournament_id = NEW.tournament_id 
    AND final_position = NEW.position;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Reset rewards for deleted tier
    UPDATE tournament_results 
    SET 
      spa_points_earned = 0,
      elo_points_awarded = 0,
      prize_amount = 0,
      updated_at = NOW()
    WHERE tournament_id = OLD.tournament_id 
    AND final_position = OLD.position;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create trigger on tournament_prize_tiers table
DROP TRIGGER IF EXISTS trigger_sync_tournament_rewards ON tournament_prize_tiers;
CREATE TRIGGER trigger_sync_tournament_rewards
  AFTER INSERT OR UPDATE OR DELETE ON tournament_prize_tiers
  FOR EACH ROW
  EXECUTE FUNCTION sync_tournament_rewards_on_tier_change();

-- Now update the latest tournament results by calling the sync function
SELECT public.sync_tournament_rewards_simple('24b8a0a5-5bd1-44c7-9f87-7aff86c62b49');