-- PHASE 1: DATABASE FUNCTIONS ENHANCEMENT
-- 1.1 Enhance Existing Core Functions

-- Enhance main tournament creation function
CREATE OR REPLACE FUNCTION create_double_elimination_tournament(
  p_tournament_id UUID,
  p_participants UUID[],
  p_bracket_style TEXT DEFAULT 'sabo_de16'
) RETURNS jsonb AS $$
DECLARE
  v_participant_count INTEGER;
  v_result jsonb;
BEGIN
  v_participant_count := array_length(p_participants, 1);
  
  -- Validate participant count for DE16
  IF v_participant_count != 16 THEN
    RETURN jsonb_build_object('error', 'Double Elimination 16 requires exactly 16 participants');
  END IF;
  
  -- Clear existing matches for this tournament
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Create Winners Bracket Round 1 (8 matches: 16→8)
  FOR i IN 1..8 LOOP
    INSERT INTO tournament_matches (
      tournament_id, bracket_type, round_number, match_number, match_stage,
      participant1_id, participant2_id, status, round_position
    ) VALUES (
      p_tournament_id, 'winners', 1, i, 'winners_round_1',
      p_participants[i*2-1], p_participants[i*2], 'scheduled', i
    );
  END LOOP;
  
  -- Create Winners Bracket Round 2 (4 matches: 8→4)
  FOR i IN 1..4 LOOP
    INSERT INTO tournament_matches (
      tournament_id, bracket_type, round_number, match_number, match_stage,
      status, round_position
    ) VALUES (
      p_tournament_id, 'winners', 2, i, 'winners_round_2',
      'scheduled', i
    );
  END LOOP;
  
  -- Create Winners Bracket Round 3 (2 matches: 4→2)
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, bracket_type, round_number, match_number, match_stage,
      status, round_position
    ) VALUES (
      p_tournament_id, 'winners', 3, i, 'winners_round_3',
      'scheduled', i
    );
  END LOOP;
  
  -- Create Losers Branch A matches (7 matches)
  FOR i IN 1..7 LOOP
    INSERT INTO tournament_matches (
      tournament_id, bracket_type, round_number, match_number, match_stage,
      loser_branch, status, round_position
    ) VALUES (
      p_tournament_id, 'losers', 
      CASE WHEN i <= 4 THEN 1 WHEN i <= 6 THEN 2 ELSE 3 END,
      i, 
      'losers_branch_a_round_' || (CASE WHEN i <= 4 THEN 1 WHEN i <= 6 THEN 2 ELSE 3 END),
      'A', 'scheduled', i
    );
  END LOOP;
  
  -- Create Losers Branch B matches (3 matches)
  FOR i IN 1..3 LOOP
    INSERT INTO tournament_matches (
      tournament_id, bracket_type, round_number, match_number, match_stage,
      loser_branch, status, round_position
    ) VALUES (
      p_tournament_id, 'losers', i, i, 
      'losers_branch_b_round_' || i,
      'B', 'scheduled', i
    );
  END LOOP;
  
  -- Create Semifinal matches (2 matches)
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, bracket_type, round_number, match_number, match_stage,
      status, round_position
    ) VALUES (
      p_tournament_id, 'semifinal', 1, i, 'semifinal',
      'scheduled', i
    );
  END LOOP;
  
  -- Create Final match (1 match)
  INSERT INTO tournament_matches (
    tournament_id, bracket_type, round_number, match_number, match_stage,
    status, round_position
  ) VALUES (
    p_tournament_id, 'final', 1, 1, 'final',
    'scheduled', 1
  );
  
  -- Initialize tournament progression tracking
  UPDATE tournaments 
  SET bracket_progression = '{
    "winners_bracket_completed": false,
    "branch_a_completed": false, 
    "branch_b_completed": false,
    "semifinal_ready": false,
    "final_ready": false,
    "tournament_complete": false
  }'::jsonb
  WHERE id = p_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_matches', 27,
    'bracket_style', p_bracket_style,
    'participants_assigned', v_participant_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhance bracket generation function
CREATE OR REPLACE FUNCTION generate_double_elimination_bracket_complete(
  p_tournament_id UUID
) RETURNS jsonb AS $$
DECLARE
  v_participants UUID[];
  v_result jsonb;
BEGIN
  -- Get confirmed participants
  SELECT array_agg(user_id ORDER BY priority_order, created_at) 
  INTO v_participants
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id 
    AND registration_status = 'confirmed'
  LIMIT 16;
  
  IF array_length(v_participants, 1) != 16 THEN
    RETURN jsonb_build_object(
      'error', 'Exactly 16 participants required for Double Elimination 16',
      'current_count', array_length(v_participants, 1)
    );
  END IF;
  
  -- Create the bracket structure
  SELECT create_double_elimination_tournament(p_tournament_id, v_participants)
  INTO v_result;
  
  -- Update tournament status
  UPDATE tournaments 
  SET status = 'ongoing', updated_at = NOW()
  WHERE id = p_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'total_matches', 27,
    'participant_count', 16,
    'bracket_structure', v_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhance status tracking function
CREATE OR REPLACE FUNCTION get_double_elimination_status(
  p_tournament_id UUID
) RETURNS jsonb AS $$
DECLARE
  v_tournament RECORD;
  v_winners_round_1 jsonb;
  v_winners_round_2 jsonb;
  v_winners_round_3 jsonb;
  v_losers_branch_a jsonb;
  v_losers_branch_b jsonb;
  v_semifinal jsonb;
  v_final jsonb;
  v_completed_count INTEGER;
  v_total_count INTEGER := 27;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Get Winners Round 1 matches
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'match_number', match_number,
      'participant1_id', participant1_id,
      'participant2_id', participant2_id,
      'participant1_score', participant1_score,
      'participant2_score', participant2_score,
      'winner_id', winner_id,
      'status', status,
      'round_position', round_position
    ) ORDER BY match_number
  ) INTO v_winners_round_1
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND match_stage = 'winners_round_1';
  
  -- Get Winners Round 2 matches
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'match_number', match_number,
      'participant1_id', participant1_id,
      'participant2_id', participant2_id,
      'participant1_score', participant1_score,
      'participant2_score', participant2_score,
      'winner_id', winner_id,
      'status', status,
      'round_position', round_position
    ) ORDER BY match_number
  ) INTO v_winners_round_2
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND match_stage = 'winners_round_2';
  
  -- Get Winners Round 3 matches
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'match_number', match_number,
      'participant1_id', participant1_id,
      'participant2_id', participant2_id,
      'participant1_score', participant1_score,
      'participant2_score', participant2_score,
      'winner_id', winner_id,
      'status', status,
      'round_position', round_position
    ) ORDER BY match_number
  ) INTO v_winners_round_3
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND match_stage = 'winners_round_3';
  
  -- Get Losers Branch A matches
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'match_number', match_number,
      'round_number', round_number,
      'participant1_id', participant1_id,
      'participant2_id', participant2_id,
      'participant1_score', participant1_score,
      'participant2_score', participant2_score,
      'winner_id', winner_id,
      'status', status,
      'round_position', round_position
    ) ORDER BY round_number, match_number
  ) INTO v_losers_branch_a
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND loser_branch = 'A';
  
  -- Get Losers Branch B matches
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'match_number', match_number,
      'round_number', round_number,
      'participant1_id', participant1_id,
      'participant2_id', participant2_id,
      'participant1_score', participant1_score,
      'participant2_score', participant2_score,
      'winner_id', winner_id,
      'status', status,
      'round_position', round_position
    ) ORDER BY round_number, match_number
  ) INTO v_losers_branch_b
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND loser_branch = 'B';
  
  -- Get Semifinal matches
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'match_number', match_number,
      'participant1_id', participant1_id,
      'participant2_id', participant2_id,
      'participant1_score', participant1_score,
      'participant2_score', participant2_score,
      'winner_id', winner_id,
      'status', status,
      'round_position', round_position
    ) ORDER BY match_number
  ) INTO v_semifinal
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND match_stage = 'semifinal';
  
  -- Get Final match
  SELECT jsonb_build_object(
    'id', id,
    'match_number', match_number,
    'participant1_id', participant1_id,
    'participant2_id', participant2_id,
    'participant1_score', participant1_score,
    'participant2_score', participant2_score,
    'winner_id', winner_id,
    'status', status,
    'round_position', round_position
  ) INTO v_final
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND match_stage = 'final';
  
  -- Count completed matches
  SELECT COUNT(*) INTO v_completed_count
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND status = 'completed';
  
  RETURN jsonb_build_object(
    'tournament_id', p_tournament_id,
    'tournament_status', v_tournament.status,
    'bracket_progression', v_tournament.bracket_progression,
    'winners_round_1_matches', COALESCE(v_winners_round_1, '[]'::jsonb),
    'winners_round_2_matches', COALESCE(v_winners_round_2, '[]'::jsonb),
    'winners_round_3_matches', COALESCE(v_winners_round_3, '[]'::jsonb),
    'losers_branch_a_matches', COALESCE(v_losers_branch_a, '[]'::jsonb),
    'losers_branch_b_matches', COALESCE(v_losers_branch_b, '[]'::jsonb),
    'semifinal_matches', COALESCE(v_semifinal, '[]'::jsonb),
    'final_match', v_final,
    'completed_count', v_completed_count,
    'total_matches', v_total_count,
    'progress_percentage', ROUND((v_completed_count::numeric / v_total_count::numeric) * 100)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;