-- SABO Database Schema Implementation
-- Phase 1: Core SABO constraints and validation functions

-- Add SABO round number constraint
ALTER TABLE tournament_matches 
ADD CONSTRAINT sabo_round_check 
CHECK (round_number IN (1,2,3,101,102,103,201,202,250,300));

-- Add SABO bracket type constraint  
ALTER TABLE tournament_matches
ADD CONSTRAINT sabo_bracket_type_check
CHECK (bracket_type IN ('winners', 'losers', 'semifinals', 'finals'));

-- Add match_stage column for detailed SABO stage tracking
ALTER TABLE tournament_matches 
ADD COLUMN match_stage TEXT;

-- Create SABO bracket info function
CREATE OR REPLACE FUNCTION get_sabo_bracket_info(p_round INTEGER)
RETURNS jsonb AS $$
BEGIN
  CASE p_round
    WHEN 1 THEN RETURN jsonb_build_object('bracket', 'winners', 'stage', 'winners_r1', 'branch', null);
    WHEN 2 THEN RETURN jsonb_build_object('bracket', 'winners', 'stage', 'winners_r2', 'branch', null);
    WHEN 3 THEN RETURN jsonb_build_object('bracket', 'winners', 'stage', 'winners_r3', 'branch', null);
    WHEN 101 THEN RETURN jsonb_build_object('bracket', 'losers', 'stage', 'losers_branch_a_r1', 'branch', 'A');
    WHEN 102 THEN RETURN jsonb_build_object('bracket', 'losers', 'stage', 'losers_branch_a_r2', 'branch', 'A');
    WHEN 103 THEN RETURN jsonb_build_object('bracket', 'losers', 'stage', 'losers_branch_a_r3', 'branch', 'A');
    WHEN 201 THEN RETURN jsonb_build_object('bracket', 'losers', 'stage', 'losers_branch_b_r1', 'branch', 'B');
    WHEN 202 THEN RETURN jsonb_build_object('bracket', 'losers', 'stage', 'losers_branch_b_r2', 'branch', 'B');
    WHEN 250 THEN RETURN jsonb_build_object('bracket', 'semifinals', 'stage', 'semifinals', 'branch', null);
    WHEN 300 THEN RETURN jsonb_build_object('bracket', 'finals', 'stage', 'final', 'branch', null);
    ELSE RAISE EXCEPTION 'Invalid SABO round: %', p_round;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validate SABO tournament structure function
CREATE OR REPLACE FUNCTION validate_sabo_tournament_structure(p_tournament_id UUID)
RETURNS jsonb AS $$
DECLARE
  v_match_counts JSONB;
  v_errors TEXT[] := '{}';
  v_total_matches INTEGER;
  v_round_count RECORD;
BEGIN
  -- Get total matches
  SELECT COUNT(*) INTO v_total_matches
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id;
  
  -- Check total matches = 27
  IF v_total_matches != 27 THEN
    v_errors := v_errors || format('Expected 27 matches, found %s', v_total_matches);
  END IF;
  
  -- Check matches per round
  FOR v_round_count IN
    SELECT round_number, COUNT(*) as match_count
    FROM tournament_matches 
    WHERE tournament_id = p_tournament_id
    GROUP BY round_number
    ORDER BY round_number
  LOOP
    CASE v_round_count.round_number
      WHEN 1 THEN
        IF v_round_count.match_count != 8 THEN
          v_errors := v_errors || format('Winners R1 should have 8 matches, found %s', v_round_count.match_count);
        END IF;
      WHEN 2 THEN
        IF v_round_count.match_count != 4 THEN
          v_errors := v_errors || format('Winners R2 should have 4 matches, found %s', v_round_count.match_count);
        END IF;
      WHEN 3 THEN
        IF v_round_count.match_count != 2 THEN
          v_errors := v_errors || format('Winners R3 should have 2 matches, found %s', v_round_count.match_count);
        END IF;
      WHEN 101 THEN
        IF v_round_count.match_count != 4 THEN
          v_errors := v_errors || format('Losers Branch A R1 should have 4 matches, found %s', v_round_count.match_count);
        END IF;
      WHEN 102 THEN
        IF v_round_count.match_count != 2 THEN
          v_errors := v_errors || format('Losers Branch A R2 should have 2 matches, found %s', v_round_count.match_count);
        END IF;
      WHEN 103 THEN
        IF v_round_count.match_count != 1 THEN
          v_errors := v_errors || format('Losers Branch A R3 should have 1 match, found %s', v_round_count.match_count);
        END IF;
      WHEN 201 THEN
        IF v_round_count.match_count != 2 THEN
          v_errors := v_errors || format('Losers Branch B R1 should have 2 matches, found %s', v_round_count.match_count);
        END IF;
      WHEN 202 THEN
        IF v_round_count.match_count != 1 THEN
          v_errors := v_errors || format('Losers Branch B R2 should have 1 match, found %s', v_round_count.match_count);
        END IF;
      WHEN 250 THEN
        IF v_round_count.match_count != 2 THEN
          v_errors := v_errors || format('Semifinals should have 2 matches, found %s', v_round_count.match_count);
        END IF;
      WHEN 300 THEN
        IF v_round_count.match_count != 1 THEN
          v_errors := v_errors || format('Final should have 1 match, found %s', v_round_count.match_count);
        END IF;
      ELSE
        v_errors := v_errors || format('Invalid round number found: %s', v_round_count.round_number);
    END CASE;
  END LOOP;
  
  -- Build match count summary
  SELECT jsonb_object_agg(
    CASE round_number
      WHEN 1,2,3 THEN 'winners_r' || round_number
      WHEN 101,102,103 THEN 'losers_a_r' || (round_number - 100)
      WHEN 201,202 THEN 'losers_b_r' || (round_number - 200)
      WHEN 250 THEN 'semifinals'
      WHEN 300 THEN 'final'
    END,
    COUNT(*)
  ) INTO v_match_counts
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id
  GROUP BY round_number;
  
  RETURN jsonb_build_object(
    'valid', array_length(v_errors, 1) = 0 OR v_errors IS NULL,
    'total_matches', v_total_matches,
    'match_counts', COALESCE(v_match_counts, '{}'::jsonb),
    'errors', COALESCE(v_errors, '{}'),
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
  v_round INTEGER;
  v_match_num INTEGER;
  v_bracket_info JSONB;
BEGIN
  -- Delete existing matches for this tournament
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Winners Bracket: Round 1 (8 matches)
  FOR v_match_num IN 1..8 LOOP
    v_bracket_info := get_sabo_bracket_info(1);
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, match_stage, status
    ) VALUES (
      p_tournament_id, 1, v_match_num, 
      v_bracket_info->>'bracket', v_bracket_info->>'stage', 'pending'
    );
    v_match_count := v_match_count + 1;
  END LOOP;
  
  -- Winners Bracket: Round 2 (4 matches)  
  FOR v_match_num IN 1..4 LOOP
    v_bracket_info := get_sabo_bracket_info(2);
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, match_stage, status
    ) VALUES (
      p_tournament_id, 2, v_match_num,
      v_bracket_info->>'bracket', v_bracket_info->>'stage', 'pending'
    );
    v_match_count := v_match_count + 1;
  END LOOP;
  
  -- Winners Bracket: Round 3 (2 matches)
  FOR v_match_num IN 1..2 LOOP
    v_bracket_info := get_sabo_bracket_info(3);
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, match_stage, status
    ) VALUES (
      p_tournament_id, 3, v_match_num,
      v_bracket_info->>'bracket', v_bracket_info->>'stage', 'pending'
    );
    v_match_count := v_match_count + 1;
  END LOOP;
  
  -- Losers Branch A: Round 101 (4 matches)
  FOR v_match_num IN 1..4 LOOP
    v_bracket_info := get_sabo_bracket_info(101);
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, match_stage, status
    ) VALUES (
      p_tournament_id, 101, v_match_num,
      v_bracket_info->>'bracket', v_bracket_info->>'stage', 'pending'
    );
    v_match_count := v_match_count + 1;
  END LOOP;
  
  -- Losers Branch A: Round 102 (2 matches)
  FOR v_match_num IN 1..2 LOOP
    v_bracket_info := get_sabo_bracket_info(102);
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, match_stage, status
    ) VALUES (
      p_tournament_id, 102, v_match_num,
      v_bracket_info->>'bracket', v_bracket_info->>'stage', 'pending'
    );
    v_match_count := v_match_count + 1;
  END LOOP;
  
  -- Losers Branch A: Round 103 (1 match)
  v_bracket_info := get_sabo_bracket_info(103);
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type, match_stage, status
  ) VALUES (
    p_tournament_id, 103, 1,
    v_bracket_info->>'bracket', v_bracket_info->>'stage', 'pending'
  );
  v_match_count := v_match_count + 1;
  
  -- Losers Branch B: Round 201 (2 matches)
  FOR v_match_num IN 1..2 LOOP
    v_bracket_info := get_sabo_bracket_info(201);
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, match_stage, status
    ) VALUES (
      p_tournament_id, 201, v_match_num,
      v_bracket_info->>'bracket', v_bracket_info->>'stage', 'pending'
    );
    v_match_count := v_match_count + 1;
  END LOOP;
  
  -- Losers Branch B: Round 202 (1 match)
  v_bracket_info := get_sabo_bracket_info(202);
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type, match_stage, status
  ) VALUES (
    p_tournament_id, 202, 1,
    v_bracket_info->>'bracket', v_bracket_info->>'stage', 'pending'
  );
  v_match_count := v_match_count + 1;
  
  -- Semifinals: Round 250 (2 matches)
  FOR v_match_num IN 1..2 LOOP
    v_bracket_info := get_sabo_bracket_info(250);
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, match_stage, status
    ) VALUES (
      p_tournament_id, 250, v_match_num,
      v_bracket_info->>'bracket', v_bracket_info->>'stage', 'pending'
    );
    v_match_count := v_match_count + 1;
  END LOOP;
  
  -- Final: Round 300 (1 match)
  v_bracket_info := get_sabo_bracket_info(300);
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type, match_stage, status
  ) VALUES (
    p_tournament_id, 300, 1,
    v_bracket_info->>'bracket', v_bracket_info->>'stage', 'pending'
  );
  v_match_count := v_match_count + 1;
  
  -- Validate the created structure
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'matches_created', v_match_count,
    'structure_type', 'SABO',
    'validation_result', validate_sabo_tournament_structure(p_tournament_id),
    'created_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournament_id', p_tournament_id,
      'matches_created', v_match_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;