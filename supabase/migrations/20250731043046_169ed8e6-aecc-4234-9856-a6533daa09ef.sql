-- Fix the type casting issue in RLS policy
CREATE POLICY "Allow function context operations" 
ON tournament_prize_tiers 
FOR ALL 
USING (
  -- Allow if user owns the tournament OR if this is a function context (auth.uid() is null)
  auth.uid() IS NULL OR 
  EXISTS (
    SELECT 1 FROM tournaments 
    WHERE id = tournament_prize_tiers.tournament_id 
    AND created_by = auth.uid()
  )
)
WITH CHECK (
  -- Same logic for inserts/updates
  auth.uid() IS NULL OR 
  EXISTS (
    SELECT 1 FROM tournaments 
    WHERE id = tournament_prize_tiers.tournament_id 
    AND created_by = auth.uid()
  )
);

-- Now test the function
SELECT public.auto_apply_default_tournament_rewards('daa82318-5e34-46ef-951f-f464ab706daf');

-- Verify results
SELECT 
  tournament_id,
  position,
  position_name,
  cash_amount,
  elo_points,
  spa_points,
  is_visible,
  physical_items
FROM public.tournament_prize_tiers 
WHERE tournament_id = 'daa82318-5e34-46ef-951f-f464ab706daf'
ORDER BY position;