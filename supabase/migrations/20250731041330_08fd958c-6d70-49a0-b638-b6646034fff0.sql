-- Fix sync trigger to use correct column names and apply template successfully
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
      points_earned = NEW.spa_points,
      prize_amount = NEW.cash_amount,
      updated_at = NOW()
    WHERE tournament_id = NEW.tournament_id 
    AND position = NEW.position;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Reset rewards for deleted tier
    UPDATE tournament_results 
    SET 
      points_earned = 0,
      prize_amount = 0,
      updated_at = NOW()
    WHERE tournament_id = OLD.tournament_id 
    AND position = OLD.position;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Apply default template to the latest tournament (fixed version)
SELECT public.auto_apply_default_tournament_rewards('d0af367a-18d7-41b9-a5b6-aaf3de5d1bb2');

-- Verify successful application
SELECT 
  tournament_id,
  position,
  position_name,
  cash_amount,
  elo_points,
  spa_points,
  is_visible
FROM tournament_prize_tiers 
WHERE tournament_id = 'd0af367a-18d7-41b9-a5b6-aaf3de5d1bb2'
ORDER BY position;