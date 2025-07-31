-- Add rewards column to tournaments table to persist SPA calculations
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS rewards jsonb DEFAULT '{}';

-- Add index for faster rewards queries
CREATE INDEX IF NOT EXISTS idx_tournaments_rewards ON public.tournaments USING GIN (rewards);

-- Add trigger to ensure rewards are calculated when max_rank_requirement changes
CREATE OR REPLACE FUNCTION public.update_tournament_rewards()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only update rewards if max_rank_requirement has changed
  IF OLD.max_rank_requirement IS DISTINCT FROM NEW.max_rank_requirement THEN
    -- The rewards will be calculated and updated by the frontend
    -- This trigger just marks that rewards need recalculation
    NEW.updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for tournament rewards update
DROP TRIGGER IF EXISTS trigger_update_tournament_rewards ON public.tournaments;
CREATE TRIGGER trigger_update_tournament_rewards
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tournament_rewards();