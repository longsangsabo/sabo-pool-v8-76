-- Manually recalculate all existing trust scores to fix current data
UPDATE player_rankings 
SET trust_score = calculate_trust_score('user', user_id),
    updated_at = NOW()
WHERE user_id IN (
  SELECT DISTINCT rated_entity_id 
  FROM mutual_ratings 
  WHERE rated_entity_type = 'user'
);

UPDATE club_profiles 
SET trust_score = calculate_trust_score('club', id),
    updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT rated_entity_id 
  FROM mutual_ratings 
  WHERE rated_entity_type = 'club'
);