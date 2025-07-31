-- Fix missing trust score update trigger
CREATE OR REPLACE FUNCTION update_trust_scores_on_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the rated entity's trust score
  IF NEW.rated_entity_type = 'user' THEN
    UPDATE player_rankings 
    SET trust_score = calculate_trust_score('user', NEW.rated_entity_id),
        updated_at = NOW()
    WHERE user_id = NEW.rated_entity_id;
    
  ELSIF NEW.rated_entity_type = 'club' THEN
    UPDATE club_profiles 
    SET trust_score = calculate_trust_score('club', NEW.rated_entity_id),
        updated_at = NOW()
    WHERE id = NEW.rated_entity_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the missing trigger
CREATE TRIGGER update_trust_scores_trigger
  AFTER INSERT ON mutual_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_trust_scores_on_rating();

-- Manually recalculate all existing trust scores
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