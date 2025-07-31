-- Step 1: Migrate existing prize_distribution data to tournament_prize_tiers
INSERT INTO tournament_prize_tiers (
  tournament_id,
  position,
  position_name,
  cash_amount,
  elo_points,
  spa_points,
  is_visible,
  physical_items
)
SELECT 
  t.id as tournament_id,
  (pos.value->>'position')::integer as position,
  COALESCE(pos.value->>'name', 'Position ' || (pos.value->>'position')) as position_name,
  COALESCE((pos.value->>'cashPrize')::numeric, 0) as cash_amount,
  COALESCE((pos.value->>'eloPoints')::integer, 0) as elo_points,
  COALESCE((pos.value->>'spaPoints')::integer, 0) as spa_points,
  COALESCE((pos.value->>'isVisible')::boolean, true) as is_visible,
  COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(pos.value->'items')),
    '{}'::text[]
  ) as physical_items
FROM tournaments t
CROSS JOIN jsonb_array_elements(t.prize_distribution->'positions') as pos
WHERE t.prize_distribution IS NOT NULL
  AND jsonb_typeof(t.prize_distribution->'positions') = 'array'
  AND NOT EXISTS (
    SELECT 1 FROM tournament_prize_tiers tpt 
    WHERE tpt.tournament_id = t.id 
    AND tpt.position = (pos.value->>'position')::integer
  );

-- Step 2: Remove prize_distribution column from tournaments table
ALTER TABLE tournaments DROP COLUMN IF EXISTS prize_distribution;

-- Step 3: Add index for better performance
CREATE INDEX IF NOT EXISTS idx_tournament_prize_tiers_tournament_id 
ON tournament_prize_tiers(tournament_id);

-- Step 4: Add updated_at trigger for tournament_prize_tiers
CREATE OR REPLACE FUNCTION update_tournament_prize_tiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tournament_prize_tiers_updated_at
  BEFORE UPDATE ON tournament_prize_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_tournament_prize_tiers_updated_at();