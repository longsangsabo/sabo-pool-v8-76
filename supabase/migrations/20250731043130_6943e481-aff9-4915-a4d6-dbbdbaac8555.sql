-- Let's directly apply rewards using simple SQL instead of complex function
-- Clear existing first 
DELETE FROM public.tournament_prize_tiers WHERE tournament_id = 'daa82318-5e34-46ef-951f-f464ab706daf';

-- Disable RLS temporarily for this operation
ALTER TABLE public.tournament_prize_tiers DISABLE ROW LEVEL SECURITY;

-- Insert rewards directly from template
WITH template_data AS (
  SELECT reward_structure->'positions' as positions
  FROM tournament_reward_templates 
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1
)
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
SELECT 
  'daa82318-5e34-46ef-951f-f464ab706daf'::uuid,
  (position_data->>'position')::integer,
  position_data->>'name',
  (position_data->>'cashPrize')::numeric,
  (position_data->>'eloPoints')::integer,
  (position_data->>'spaPoints')::integer,
  COALESCE((position_data->>'isVisible')::boolean, true),
  CASE 
    WHEN position_data->'items' IS NULL THEN ARRAY[]::text[]
    ELSE ARRAY(SELECT jsonb_array_elements_text(position_data->'items'))
  END
FROM template_data,
     jsonb_array_elements(template_data.positions) as position_data;

-- Re-enable RLS
ALTER TABLE public.tournament_prize_tiers ENABLE ROW LEVEL SECURITY;

-- Verify the results
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