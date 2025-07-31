-- Create enhanced double elimination bracket generator with correct logic
CREATE OR REPLACE FUNCTION public.generate_double_elimination_bracket_complete_v6(
  p_tournament_id UUID,
  p_participants UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_participant_count INTEGER;
  v_winners_bracket_matches JSONB[] := '{}';
  v_losers_branch_a_matches JSONB[] := '{}';
  v_losers_branch_b_matches JSONB[] := '{}';
  v_final_matches JSONB[] := '{}';
  v_match_counter INTEGER := 1;
  i INTEGER;
  j INTEGER;
BEGIN
  v_participant_count := array_length(p_participants, 1);
  
  -- Validate participant count (must be power of 2, minimum 4)
  IF v_participant_count < 4 OR (v_participant_count & (v_participant_count - 1)) != 0 THEN
    RETURN jsonb_build_object('error', 'Participant count must be a power of 2 and at least 4');
  END IF;
  
  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- WINNERS BRACKET GENERATION
  -- Round 1: All participants (8 players -> 4 matches)
  FOR i IN 1..(v_participant_count / 2) LOOP
    v_winners_bracket_matches := v_winners_bracket_matches || jsonb_build_object(
      'tournament_id', p_tournament_id,
      'round_number', 1,
      'match_number', i,
      'bracket_type', 'winners',
      'match_stage', 'winners_bracket',
      'player1_id', p_participants[i * 2 - 1],
      'player2_id', p_participants[i * 2],
      'status', 'pending'
    );
  END LOOP;
  
  -- Round 2: Winners from R1 (4 winners -> 2 matches)
  FOR i IN 1..(v_participant_count / 4) LOOP
    v_winners_bracket_matches := v_winners_bracket_matches || jsonb_build_object(
      'tournament_id', p_tournament_id,
      'round_number', 2,
      'match_number', i,
      'bracket_type', 'winners',
      'match_stage', 'winners_bracket',
      'player1_id', NULL,
      'player2_id', NULL,
      'status', 'pending'
    );
  END LOOP;
  
  -- Round 3: Winners Bracket Final (2 winners -> 1 match)
  v_winners_bracket_matches := v_winners_bracket_matches || jsonb_build_object(
    'tournament_id', p_tournament_id,
    'round_number', 3,
    'match_number', 1,
    'bracket_type', 'winners',
    'match_stage', 'winners_bracket',
    'player1_id', NULL,
    'player2_id', NULL,
    'status', 'pending'
  );
  
  -- LOSERS BRANCH A GENERATION
  -- Round 101: Losers from WB R1 (8 losers -> 4 matches)
  FOR i IN 1..(v_participant_count / 2) LOOP
    v_losers_branch_a_matches := v_losers_branch_a_matches || jsonb_build_object(
      'tournament_id', p_tournament_id,
      'round_number', 101,
      'match_number', i,
      'bracket_type', 'losers',
      'match_stage', 'losers_branch_a',
      'branch_type', 'branch_a',
      'player1_id', NULL,
      'player2_id', NULL,
      'status', 'pending'
    );
  END LOOP;
  
  -- Round 102: Advance 4 winners from LBA R101 (4 players -> 2 matches)
  FOR i IN 1..(v_participant_count / 4) LOOP
    v_losers_branch_a_matches := v_losers_branch_a_matches || jsonb_build_object(
      'tournament_id', p_tournament_id,
      'round_number', 102,
      'match_number', i,
      'bracket_type', 'losers',
      'match_stage', 'losers_branch_a',
      'branch_type', 'branch_a',
      'player1_id', NULL,
      'player2_id', NULL,
      'status', 'pending'
    );
  END LOOP;
  
  -- Round 103: LBA Final (2 players -> 1 match, produces LBA Finalist)
  v_losers_branch_a_matches := v_losers_branch_a_matches || jsonb_build_object(
    'tournament_id', p_tournament_id,
    'round_number', 103,
    'match_number', 1,
    'bracket_type', 'losers',
    'match_stage', 'losers_branch_a',
    'branch_type', 'branch_a',
    'player1_id', NULL,
    'player2_id', NULL,
    'status', 'pending'
  );
  
  -- LOSERS BRANCH B GENERATION
  -- Round 201: Losers from WB R2 (4 losers -> 2 matches)
  FOR i IN 1..(v_participant_count / 4) LOOP
    v_losers_branch_b_matches := v_losers_branch_b_matches || jsonb_build_object(
      'tournament_id', p_tournament_id,
      'round_number', 201,
      'match_number', i,
      'bracket_type', 'losers',
      'match_stage', 'losers_branch_b',
      'branch_type', 'branch_b',
      'player1_id', NULL,
      'player2_id', NULL,
      'status', 'pending'
    );
  END LOOP;
  
  -- Round 202: LBB Final (2 players -> 1 match, produces LBB Finalist)
  v_losers_branch_b_matches := v_losers_branch_b_matches || jsonb_build_object(
    'tournament_id', p_tournament_id,
    'round_number', 202,
    'match_number', 1,
    'bracket_type', 'losers',
    'match_stage', 'losers_branch_b',
    'branch_type', 'branch_b',
    'player1_id', NULL,
    'player2_id', NULL,
    'status', 'pending'
  );
  
  -- GRAND FINAL GENERATION
  -- Round 301: Grand Final (WB Champion vs LBB Finalist)
  v_final_matches := v_final_matches || jsonb_build_object(
    'tournament_id', p_tournament_id,
    'round_number', 301,
    'match_number', 1,
    'bracket_type', 'final',
    'match_stage', 'grand_final',
    'player1_id', NULL,
    'player2_id', NULL,
    'status', 'pending'
  );
  
  -- Round 302: Grand Final Reset (if LBB Finalist wins)
  v_final_matches := v_final_matches || jsonb_build_object(
    'tournament_id', p_tournament_id,
    'round_number', 302,
    'match_number', 1,
    'bracket_type', 'final',
    'match_stage', 'grand_final_reset',
    'player1_id', NULL,
    'player2_id', NULL,
    'status', 'pending'
  );
  
  -- INSERT ALL MATCHES
  -- Insert Winners Bracket matches
  FOR i IN 1..array_length(v_winners_bracket_matches, 1) LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, match_stage,
      player1_id, player2_id, status
    ) VALUES (
      (v_winners_bracket_matches[i]->>'tournament_id')::UUID,
      (v_winners_bracket_matches[i]->>'round_number')::INTEGER,
      (v_winners_bracket_matches[i]->>'match_number')::INTEGER,
      v_winners_bracket_matches[i]->>'bracket_type',
      v_winners_bracket_matches[i]->>'match_stage',
      CASE WHEN v_winners_bracket_matches[i]->>'player1_id' = 'null' THEN NULL 
           ELSE (v_winners_bracket_matches[i]->>'player1_id')::UUID END,
      CASE WHEN v_winners_bracket_matches[i]->>'player2_id' = 'null' THEN NULL 
           ELSE (v_winners_bracket_matches[i]->>'player2_id')::UUID END,
      v_winners_bracket_matches[i]->>'status'
    );
  END LOOP;
  
  -- Insert Losers Branch A matches
  FOR i IN 1..array_length(v_losers_branch_a_matches, 1) LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, match_stage, branch_type,
      player1_id, player2_id, status
    ) VALUES (
      (v_losers_branch_a_matches[i]->>'tournament_id')::UUID,
      (v_losers_branch_a_matches[i]->>'round_number')::INTEGER,
      (v_losers_branch_a_matches[i]->>'match_number')::INTEGER,
      v_losers_branch_a_matches[i]->>'bracket_type',
      v_losers_branch_a_matches[i]->>'match_stage',
      v_losers_branch_a_matches[i]->>'branch_type',
      CASE WHEN v_losers_branch_a_matches[i]->>'player1_id' = 'null' THEN NULL 
           ELSE (v_losers_branch_a_matches[i]->>'player1_id')::UUID END,
      CASE WHEN v_losers_branch_a_matches[i]->>'player2_id' = 'null' THEN NULL 
           ELSE (v_losers_branch_a_matches[i]->>'player2_id')::UUID END,
      v_losers_branch_a_matches[i]->>'status'
    );
  END LOOP;
  
  -- Insert Losers Branch B matches
  FOR i IN 1..array_length(v_losers_branch_b_matches, 1) LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, match_stage, branch_type,
      player1_id, player2_id, status
    ) VALUES (
      (v_losers_branch_b_matches[i]->>'tournament_id')::UUID,
      (v_losers_branch_b_matches[i]->>'round_number')::INTEGER,
      (v_losers_branch_b_matches[i]->>'match_number')::INTEGER,
      v_losers_branch_b_matches[i]->>'bracket_type',
      v_losers_branch_b_matches[i]->>'match_stage',
      v_losers_branch_b_matches[i]->>'branch_type',
      CASE WHEN v_losers_branch_b_matches[i]->>'player1_id' = 'null' THEN NULL 
           ELSE (v_losers_branch_b_matches[i]->>'player1_id')::UUID END,
      CASE WHEN v_losers_branch_b_matches[i]->>'player2_id' = 'null' THEN NULL 
           ELSE (v_losers_branch_b_matches[i]->>'player2_id')::UUID END,
      v_losers_branch_b_matches[i]->>'status'
    );
  END LOOP;
  
  -- Insert Final matches
  FOR i IN 1..array_length(v_final_matches, 1) LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, match_stage,
      player1_id, player2_id, status
    ) VALUES (
      (v_final_matches[i]->>'tournament_id')::UUID,
      (v_final_matches[i]->>'round_number')::INTEGER,
      (v_final_matches[i]->>'match_number')::INTEGER,
      v_final_matches[i]->>'bracket_type',
      v_final_matches[i]->>'match_stage',
      CASE WHEN v_final_matches[i]->>'player1_id' = 'null' THEN NULL 
           ELSE (v_final_matches[i]->>'player1_id')::UUID END,
      CASE WHEN v_final_matches[i]->>'player2_id' = 'null' THEN NULL 
           ELSE (v_final_matches[i]->>'player2_id')::UUID END,
      v_final_matches[i]->>'status'
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Double elimination bracket generated successfully',
    'participant_count', v_participant_count,
    'total_matches', array_length(v_winners_bracket_matches, 1) + 
                    array_length(v_losers_branch_a_matches, 1) + 
                    array_length(v_losers_branch_b_matches, 1) + 
                    array_length(v_final_matches, 1)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;