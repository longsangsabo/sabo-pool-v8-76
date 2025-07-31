-- Fix calculate_trust_score function - address 5-star rating issue
CREATE OR REPLACE FUNCTION public.calculate_trust_score(entity_type text, entity_id uuid)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rating_score DECIMAL := 0;
  activity_score DECIMAL := 0;
  reliability_score DECIMAL := 0;
  final_trust_score DECIMAL := 0;
  avg_rating DECIMAL := 0;
  total_ratings INTEGER := 0;
BEGIN
  -- Component 1: Average rating score
  SELECT 
    COALESCE(AVG(rating), 0),
    COUNT(*)
  INTO avg_rating, total_ratings
  FROM public.mutual_ratings 
  WHERE rated_entity_type = entity_type 
  AND rated_entity_id = entity_id
  AND created_at > NOW() - INTERVAL '6 months'; -- Recent ratings only
  
  -- Convert 1-5 scale to 0-100 scale
  rating_score := avg_rating * 20;
  
  IF entity_type = 'user' THEN
    -- Component 2: Activity score for users
    SELECT LEAST(COUNT(*) * 5, 100) INTO activity_score -- Cap at 100%
    FROM public.challenges 
    WHERE (challenger_id = entity_id OR opponent_id = entity_id)
    AND club_confirmed = true
    AND created_at > NOW() - INTERVAL '3 months';
    
    -- Component 3: Reliability score for users
    SELECT CASE 
      WHEN total_challenges = 0 THEN 50 -- Default for new users
      ELSE LEAST((completed_challenges * 100.0 / total_challenges), 100)
    END INTO reliability_score
    FROM (
      SELECT 
        COUNT(*) as total_challenges,
        COUNT(CASE WHEN club_confirmed = true THEN 1 END) as completed_challenges
      FROM public.challenges 
      WHERE (challenger_id = entity_id OR opponent_id = entity_id)
      AND created_at > NOW() - INTERVAL '6 months'
    ) stats;
    
  ELSIF entity_type = 'club' THEN
    -- Component 2: Service quality for clubs
    SELECT COALESCE(LEAST(COUNT(*) * 3, 100), 0) INTO activity_score
    FROM public.challenges 
    WHERE club_id = entity_id 
    AND club_confirmed = true
    AND created_at > NOW() - INTERVAL '1 month';
    
    -- Component 3: Club reliability
    SELECT CASE
      WHEN total_requests = 0 THEN 80 -- Default for new clubs
      ELSE LEAST((processed_requests * 100.0 / total_requests), 100)
    END INTO reliability_score
    FROM (
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN club_confirmed IS NOT NULL THEN 1 END) as processed_requests
      FROM public.challenges 
      WHERE club_id = entity_id
      AND created_at > NOW() - INTERVAL '3 months'
    ) stats;
  END IF;
  
  -- FIXED LOGIC: Adjust weights based on rating quality
  IF avg_rating >= 4.5 AND total_ratings > 0 THEN
    -- Perfect/near-perfect ratings: Give more weight to ratings
    final_trust_score := (rating_score * 0.7) + (activity_score * 0.15) + (reliability_score * 0.15);
    -- Ensure minimum 85% for perfect 5-star ratings
    IF avg_rating = 5.0 THEN
      final_trust_score := GREATEST(final_trust_score, 85.0);
    END IF;
  ELSIF total_ratings = 0 THEN
    -- No ratings yet: Base on activity and reliability only
    final_trust_score := (activity_score * 0.5) + (reliability_score * 0.5);
    -- Cap new users without ratings at 75%
    final_trust_score := LEAST(final_trust_score, 75.0);
  ELSE
    -- Mixed ratings: Use balanced weights
    final_trust_score := (rating_score * 0.4) + (activity_score * 0.3) + (reliability_score * 0.3);
  END IF;
  
  RETURN LEAST(final_trust_score, 100.0); -- Cap at 100%
END;
$$;

-- Recalculate all user trust scores with fixed logic
UPDATE player_rankings 
SET trust_score = calculate_trust_score('user', user_id),
    updated_at = NOW()
WHERE user_id IN (
  SELECT DISTINCT rated_entity_id 
  FROM mutual_ratings 
  WHERE rated_entity_type = 'user'
);