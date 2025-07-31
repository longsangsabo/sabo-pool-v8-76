-- Fix bracket types for tournament matches
-- Assign proper bracket types to existing matches

UPDATE tournament_matches 
SET bracket_type = CASE 
  WHEN round_number = 1 THEN 'winners'  -- Winner Bracket Round 1
  WHEN round_number = 2 THEN 'winners'  -- Winner Bracket Round 2  
  ELSE 'winners'  -- Default to winners for now
END,
updated_at = NOW()
WHERE tournament_id IN (
  SELECT id FROM tournaments 
  WHERE name ILIKE '%test%' 
  AND created_at > NOW() - INTERVAL '7 days'
)
AND bracket_type IS NULL;