-- Manually recalculate user trust scores only  
UPDATE player_rankings 
SET trust_score = calculate_trust_score('user', user_id),
    updated_at = NOW()
WHERE user_id IN (
  SELECT DISTINCT rated_entity_id 
  FROM mutual_ratings 
  WHERE rated_entity_type = 'user'
);