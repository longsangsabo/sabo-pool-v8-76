-- SABO Database Schema Implementation (Simplified)
-- Add SABO constraints and core functions

-- Add SABO round number constraint
ALTER TABLE tournament_matches 
ADD CONSTRAINT sabo_round_check 
CHECK (round_number IN (1,2,3,101,102,103,201,202,250,300));

-- Add SABO bracket type constraint  
ALTER TABLE tournament_matches
ADD CONSTRAINT sabo_bracket_type_check
CHECK (bracket_type IN ('winners', 'losers', 'semifinals', 'finals'));

-- Create SABO bracket info function
CREATE OR REPLACE FUNCTION get_sabo_bracket_info(p_round INTEGER)
RETURNS jsonb AS $$
BEGIN
  CASE p_round
    WHEN 1 THEN RETURN jsonb_build_object('bracket', 'winners', 'stage', 'winners_r1');
    WHEN 2 THEN RETURN jsonb_build_object('bracket', 'winners', 'stage', 'winners_r2');
    WHEN 3 THEN RETURN jsonb_build_object('bracket', 'winners', 'stage', 'winners_r3');
    WHEN 101 THEN RETURN jsonb_build_object('bracket', 'losers', 'stage', 'losers_branch_a_r1');
    WHEN 102 THEN RETURN jsonb_build_object('bracket', 'losers', 'stage', 'losers_branch_a_r2');
    WHEN 103 THEN RETURN jsonb_build_object('bracket', 'losers', 'stage', 'losers_branch_a_r3');
    WHEN 201 THEN RETURN jsonb_build_object('bracket', 'losers', 'stage', 'losers_branch_b_r1');
    WHEN 202 THEN RETURN jsonb_build_object('bracket', 'losers', 'stage', 'losers_branch_b_r2');
    WHEN 250 THEN RETURN jsonb_build_object('bracket', 'semifinals', 'stage', 'semifinals');
    WHEN 300 THEN RETURN jsonb_build_object('bracket', 'finals', 'stage', 'final');
    ELSE RAISE EXCEPTION 'Invalid SABO round: %', p_round;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validate SABO tournament structure function
CREATE OR REPLACE FUNCTION validate_sabo_tournament_structure(p_tournament_id UUID)
RETURNS jsonb AS $$
DECLARE
  v_total_matches INTEGER;
  v_errors TEXT := '';
BEGIN
  -- Get total matches
  SELECT COUNT(*) INTO v_total_matches
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id;
  
  -- Check total matches = 27
  IF v_total_matches != 27 THEN
    v_errors := 'Expected 27 matches, found ' || v_total_matches::text;
  END IF;
  
  RETURN jsonb_build_object(
    'valid', v_errors = '',
    'total_matches', v_total_matches,
    'errors', CASE WHEN v_errors = '' THEN '[]'::jsonb ELSE jsonb_build_array(v_errors) END,
    'structure_type', 'SABO',
    'validated_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create SABO tournament structure function (27 matches)
CREATE OR REPLACE FUNCTION create_sabo_tournament_structure(p_tournament_id UUID)
RETURNS jsonb AS $$
DECLARE
  v_match_count INTEGER := 0;
BEGIN
  -- Delete existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Winners R1: 8 matches
  INSERT INTO tournament_matches (tournament_id, round_number, match_number, bracket_type, status)
  SELECT p_tournament_id, 1, generate_series(1,8), 'winners', 'pending';
  v_match_count := v_match_count + 8;
  
  -- Winners R2: 4 matches  
  INSERT INTO tournament_matches (tournament_id, round_number, match_number, bracket_type, status)
  SELECT p_tournament_id, 2, generate_series(1,4), 'winners', 'pending';
  v_match_count := v_match_count + 4;
  
  -- Winners R3: 2 matches
  INSERT INTO tournament_matches (tournament_id, round_number, match_number, bracket_type, status)
  SELECT p_tournament_id, 3, generate_series(1,2), 'winners', 'pending';
  v_match_count := v_match_count + 2;
  
  -- Losers Branch A R1: 4 matches
  INSERT INTO tournament_matches (tournament_id, round_number, match_number, bracket_type, status)
  SELECT p_tournament_id, 101, generate_series(1,4), 'losers', 'pending';
  v_match_count := v_match_count + 4;
  
  -- Losers Branch A R2: 2 matches
  INSERT INTO tournament_matches (tournament_id, round_number, match_number, bracket_type, status)
  SELECT p_tournament_id, 102, generate_series(1,2), 'losers', 'pending';
  v_match_count := v_match_count + 2;
  
  -- Losers Branch A R3: 1 match
  INSERT INTO tournament_matches (tournament_id, round_number, match_number, bracket_type, status)
  VALUES (p_tournament_id, 103, 1, 'losers', 'pending');
  v_match_count := v_match_count + 1;
  
  -- Losers Branch B R1: 2 matches
  INSERT INTO tournament_matches (tournament_id, round_number, match_number, bracket_type, status)
  SELECT p_tournament_id, 201, generate_series(1,2), 'losers', 'pending';
  v_match_count := v_match_count + 2;
  
  -- Losers Branch B R2: 1 match
  INSERT INTO tournament_matches (tournament_id, round_number, match_number, bracket_type, status)
  VALUES (p_tournament_id, 202, 1, 'losers', 'pending');
  v_match_count := v_match_count + 1;
  
  -- Semifinals: 2 matches
  INSERT INTO tournament_matches (tournament_id, round_number, match_number, bracket_type, status)
  SELECT p_tournament_id, 250, generate_series(1,2), 'semifinals', 'pending';
  v_match_count := v_match_count + 2;
  
  -- Final: 1 match
  INSERT INTO tournament_matches (tournament_id, round_number, match_number, bracket_type, status)
  VALUES (p_tournament_id, 300, 1, 'finals', 'pending');
  v_match_count := v_match_count + 1;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'matches_created', v_match_count,
    'structure_type', 'SABO',
    'validation_result', validate_sabo_tournament_structure(p_tournament_id)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournament_id', p_tournament_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;