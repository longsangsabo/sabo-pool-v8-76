-- Fix the trigger function - tournament_results doesn't have position column
DROP TRIGGER IF EXISTS sync_tournament_rewards_on_tier_change ON tournament_prize_tiers;
DROP FUNCTION IF EXISTS sync_tournament_rewards_on_tier_change();

-- Create corrected trigger function
CREATE OR REPLACE FUNCTION sync_tournament_rewards_on_tier_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync existing results when tournament is completed
  IF EXISTS (
    SELECT 1 FROM tournaments 
    WHERE id = NEW.tournament_id 
    AND status = 'completed'
  ) THEN
    -- Call the sync function to rebuild tournament_results from prize_tiers
    PERFORM sync_tournament_rewards_from_tiers(NEW.tournament_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER sync_tournament_rewards_on_tier_change
  AFTER INSERT OR UPDATE ON tournament_prize_tiers
  FOR EACH ROW
  EXECUTE FUNCTION sync_tournament_rewards_on_tier_change();

-- Now apply template to test1 tournament
INSERT INTO public.tournament_prize_tiers (
  tournament_id,
  position,
  position_name,
  cash_amount,
  elo_points,
  spa_points,
  is_visible,
  physical_items
)
VALUES 
  ('c73a66a1-1698-4713-839c-dc62ae3469e5', 1, 'Vô địch', 1100000, 100, 900, true, '{}'),
  ('c73a66a1-1698-4713-839c-dc62ae3469e5', 2, 'Á quân', 660000, 75, 700, true, '{}'),
  ('c73a66a1-1698-4713-839c-dc62ae3469e5', 3, 'Hạng 3', 440000, 50, 500, true, '{}');