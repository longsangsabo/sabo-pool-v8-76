-- Chuẩn hóa double elimination: loại bỏ Grand Final Reset, chỉ giữ Semifinal (R250) và Final (R300)
-- 1. Update existing tournaments to remove Grand Final Reset matches (Round 302)
UPDATE tournament_matches 
SET status = 'cancelled', 
    updated_at = NOW()
WHERE round_number = 302 
  AND (bracket_type = 'grand_final' OR match_stage LIKE '%reset%');

-- 2. Ensure Semifinal Round 250 has exactly 2 matches for 4→2 logic
-- Mark any extra semifinal matches as cancelled
WITH semifinal_excess AS (
  SELECT id, tournament_id,
    ROW_NUMBER() OVER (PARTITION BY tournament_id ORDER BY match_number) as rn
  FROM tournament_matches 
  WHERE round_number = 250 
    AND bracket_type != 'losers'
    AND NOT is_third_place_match
    AND status != 'cancelled'
)
UPDATE tournament_matches 
SET status = 'cancelled', 
    updated_at = NOW()
WHERE id IN (
  SELECT id FROM semifinal_excess WHERE rn > 2
);

-- 3. Ensure Final Round 300 has exactly 1 match for 2→1 logic  
WITH final_excess AS (
  SELECT id, tournament_id,
    ROW_NUMBER() OVER (PARTITION BY tournament_id ORDER BY match_number) as rn
  FROM tournament_matches 
  WHERE round_number = 300 
    AND bracket_type != 'losers'
    AND NOT is_third_place_match
    AND status != 'cancelled'
)
UPDATE tournament_matches 
SET status = 'cancelled', 
    updated_at = NOW()
WHERE id IN (
  SELECT id FROM final_excess WHERE rn > 1
);

-- 4. Create function to validate double elimination bracket structure
CREATE OR REPLACE FUNCTION validate_double_elimination_structure(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_semifinal_count INTEGER;
  v_final_count INTEGER;
  v_reset_count INTEGER;
  v_issues TEXT[] := '{}';
BEGIN
  -- Count semifinal matches (should be exactly 2)
  SELECT COUNT(*) INTO v_semifinal_count
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id
    AND round_number = 250
    AND bracket_type != 'losers'
    AND NOT is_third_place_match
    AND status != 'cancelled';
    
  -- Count final matches (should be exactly 1)
  SELECT COUNT(*) INTO v_final_count
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id
    AND round_number = 300
    AND bracket_type != 'losers'
    AND NOT is_third_place_match
    AND status != 'cancelled';
    
  -- Count reset matches (should be 0 in new standard)
  SELECT COUNT(*) INTO v_reset_count
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id
    AND round_number = 302;
    
  -- Check for issues
  IF v_semifinal_count != 2 THEN
    v_issues := v_issues || format('Semifinal should have exactly 2 matches, found %s', v_semifinal_count);
  END IF;
  
  IF v_final_count != 1 THEN
    v_issues := v_issues || format('Final should have exactly 1 match, found %s', v_final_count);
  END IF;
  
  IF v_reset_count > 0 THEN
    v_issues := v_issues || format('Found %s Grand Final Reset matches (should be 0)', v_reset_count);
  END IF;
  
  RETURN jsonb_build_object(
    'tournament_id', p_tournament_id,
    'semifinal_matches', v_semifinal_count,
    'final_matches', v_final_count,
    'reset_matches', v_reset_count,
    'is_valid', array_length(v_issues, 1) IS NULL,
    'issues', v_issues,
    'standard', '4→2 Semifinal, 2→1 Final, No Reset'
  );
END;
$$;

-- 5. Create trigger to enforce double elimination standards on new matches
CREATE OR REPLACE FUNCTION enforce_double_elimination_standards()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Prevent creation of Grand Final Reset matches
  IF NEW.round_number = 302 THEN
    RAISE EXCEPTION 'Grand Final Reset (Round 302) is not allowed in standardized double elimination';
  END IF;
  
  -- Prevent more than 2 semifinal matches per tournament
  IF NEW.round_number = 250 AND NEW.bracket_type != 'losers' AND NOT COALESCE(NEW.is_third_place_match, false) THEN
    IF (SELECT COUNT(*) FROM tournament_matches 
        WHERE tournament_id = NEW.tournament_id 
          AND round_number = 250 
          AND bracket_type != 'losers'
          AND NOT COALESCE(is_third_place_match, false)
          AND status != 'cancelled') >= 2 THEN
      RAISE EXCEPTION 'Tournament can have maximum 2 semifinal matches (4→2 standard)';
    END IF;
  END IF;
  
  -- Prevent more than 1 final match per tournament
  IF NEW.round_number = 300 AND NEW.bracket_type != 'losers' AND NOT COALESCE(NEW.is_third_place_match, false) THEN
    IF (SELECT COUNT(*) FROM tournament_matches 
        WHERE tournament_id = NEW.tournament_id 
          AND round_number = 300 
          AND bracket_type != 'losers'
          AND NOT COALESCE(is_third_place_match, false)
          AND status != 'cancelled') >= 1 THEN
      RAISE EXCEPTION 'Tournament can have maximum 1 final match (2→1 standard)';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply the trigger
DROP TRIGGER IF EXISTS enforce_double_elimination_standards_trigger ON tournament_matches;
CREATE TRIGGER enforce_double_elimination_standards_trigger
  BEFORE INSERT ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION enforce_double_elimination_standards();