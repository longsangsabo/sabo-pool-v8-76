-- Fix Sabo 3 tournament results using the new calculation function
-- First, clear existing incorrect results
DELETE FROM tournament_results WHERE tournament_id = 'aecf2073-7665-4da7-91fb-02b1c2e6a890';

-- Get correct standings using our new function and insert proper results
WITH calculated_standings AS (
  SELECT jsonb_array_elements(
    (SELECT calculate_tournament_standings('aecf2073-7665-4da7-91fb-02b1c2e6a890'::uuid)->'standings')
  ) as standing
)
INSERT INTO tournament_results (
  tournament_id,
  user_id,
  final_position,
  prize_money,
  spa_points_earned,
  elo_points_earned,
  matches_played,
  matches_won,
  matches_lost
)
SELECT 
  'aecf2073-7665-4da7-91fb-02b1c2e6a890'::uuid,
  (standing->>'player_id')::uuid,
  (standing->>'final_position')::integer,
  (standing->>'prize_money')::integer,
  (standing->>'spa_points_earned')::integer,
  ROUND((standing->>'spa_points_earned')::numeric * 0.1), -- Simple ELO change calculation
  (standing->>'total_matches')::integer,
  (standing->>'wins')::integer,
  (standing->>'losses')::integer
FROM calculated_standings;

-- Create trigger to auto-complete tournaments when status changes
CREATE OR REPLACE FUNCTION auto_complete_tournament()
RETURNS TRIGGER AS $$
DECLARE
  standings_result jsonb;
BEGIN
  -- Only process when tournament status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Calculate and insert tournament results automatically
    SELECT calculate_tournament_standings(NEW.id) INTO standings_result;
    
    IF standings_result->>'success' = 'true' THEN
      -- Insert results for each participant
      INSERT INTO tournament_results (
        tournament_id,
        user_id,
        final_position,
        prize_money,
        spa_points_earned,
        elo_points_earned,
        matches_played,
        matches_won,
        matches_lost
      )
      SELECT 
        NEW.id,
        (standing->>'player_id')::uuid,
        (standing->>'final_position')::integer,
        (standing->>'prize_money')::integer,
        (standing->>'spa_points_earned')::integer,
        ROUND((standing->>'spa_points_earned')::numeric * 0.1),
        (standing->>'total_matches')::integer,
        (standing->>'wins')::integer,
        (standing->>'losses')::integer
      FROM jsonb_array_elements(standings_result->'standings') as standing
      ON CONFLICT (tournament_id, user_id) DO UPDATE SET
        final_position = EXCLUDED.final_position,
        prize_money = EXCLUDED.prize_money,
        spa_points_earned = EXCLUDED.spa_points_earned,
        elo_points_earned = EXCLUDED.elo_points_earned,
        matches_played = EXCLUDED.matches_played,
        matches_won = EXCLUDED.matches_won,
        matches_lost = EXCLUDED.matches_lost;
        
      -- Set completed timestamp
      UPDATE tournaments 
      SET completed_at = NOW() 
      WHERE id = NEW.id AND completed_at IS NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS auto_complete_tournament_trigger ON tournaments;
CREATE TRIGGER auto_complete_tournament_trigger
  AFTER UPDATE ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_tournament();