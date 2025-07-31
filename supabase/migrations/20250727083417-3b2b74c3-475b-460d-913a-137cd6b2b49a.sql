-- 1.2 Rewrite Advancement Functions and Supporting Functions

-- New function: Assign loser to specific branch
CREATE OR REPLACE FUNCTION assign_loser_to_branch(
  p_loser_id UUID,
  p_branch CHAR(1), -- 'A' or 'B'
  p_tournament_id UUID
) RETURNS void AS $$
DECLARE
  v_next_match RECORD;
BEGIN
  -- Find next available match in specified branch
  SELECT * INTO v_next_match
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND loser_branch = p_branch
    AND (participant1_id IS NULL OR participant2_id IS NULL)
    AND status = 'scheduled'
  ORDER BY round_number, match_number
  LIMIT 1;
  
  IF FOUND THEN
    -- Insert participant into correct position
    IF v_next_match.participant1_id IS NULL THEN
      UPDATE tournament_matches 
      SET participant1_id = p_loser_id
      WHERE id = v_next_match.id;
    ELSE
      UPDATE tournament_matches 
      SET participant2_id = p_loser_id
      WHERE id = v_next_match.id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- New function: Setup semifinal when branches complete
CREATE OR REPLACE FUNCTION setup_semifinal_participants(
  p_tournament_id UUID
) RETURNS jsonb AS $$
DECLARE
  v_wb_winners UUID[];
  v_branch_a_winner UUID;
  v_branch_b_winner UUID;
  v_semifinal_matches UUID[];
BEGIN
  -- Get 2 winners from Winners Bracket Round 3
  SELECT array_agg(winner_id) INTO v_wb_winners
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND match_stage = 'winners_round_3'
    AND status = 'completed'
    AND winner_id IS NOT NULL;
  
  -- Get winner from Losers Branch A (final match)
  SELECT winner_id INTO v_branch_a_winner
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND loser_branch = 'A'
    AND round_number = 3
    AND status = 'completed'
    AND winner_id IS NOT NULL;
  
  -- Get winner from Losers Branch B (final match)
  SELECT winner_id INTO v_branch_b_winner
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND loser_branch = 'B'
    AND round_number = 3
    AND status = 'completed'
    AND winner_id IS NOT NULL;
  
  -- Check if all prerequisites are met
  IF array_length(v_wb_winners, 1) = 2 AND v_branch_a_winner IS NOT NULL AND v_branch_b_winner IS NOT NULL THEN
    -- Get semifinal match IDs
    SELECT array_agg(id ORDER BY match_number) INTO v_semifinal_matches
    FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
      AND match_stage = 'semifinal';
    
    -- Setup Semifinal Match 1: WB Winner 1 vs LB Branch A Winner
    UPDATE tournament_matches 
    SET participant1_id = v_wb_winners[1],
        participant2_id = v_branch_a_winner
    WHERE id = v_semifinal_matches[1];
    
    -- Setup Semifinal Match 2: WB Winner 2 vs LB Branch B Winner
    UPDATE tournament_matches 
    SET participant1_id = v_wb_winners[2],
        participant2_id = v_branch_b_winner
    WHERE id = v_semifinal_matches[2];
    
    -- Update tournament progression
    UPDATE tournaments 
    SET bracket_progression = bracket_progression || '{"semifinal_ready": true, "semifinal_setup": true}'::jsonb
    WHERE id = p_tournament_id;
    
    RETURN jsonb_build_object('success', true, 'semifinal_setup', true);
  END IF;
  
  RETURN jsonb_build_object('success', false, 'error', 'Prerequisites not met for semifinal setup');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- New function: Setup final when semifinal complete
CREATE OR REPLACE FUNCTION setup_final_participants(
  p_tournament_id UUID
) RETURNS jsonb AS $$
DECLARE
  v_semifinal_winners UUID[];
  v_final_match_id UUID;
BEGIN
  -- Get 2 semifinal winners
  SELECT array_agg(winner_id ORDER BY match_number) INTO v_semifinal_winners
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND match_stage = 'semifinal'
    AND status = 'completed'
    AND winner_id IS NOT NULL;
  
  IF array_length(v_semifinal_winners, 1) = 2 THEN
    -- Get final match ID
    SELECT id INTO v_final_match_id
    FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
      AND match_stage = 'final';
    
    -- Setup final match
    UPDATE tournament_matches 
    SET participant1_id = v_semifinal_winners[1],
        participant2_id = v_semifinal_winners[2]
    WHERE id = v_final_match_id;
    
    -- Update tournament progression
    UPDATE tournaments 
    SET bracket_progression = bracket_progression || '{"final_ready": true, "final_setup": true}'::jsonb
    WHERE id = p_tournament_id;
    
    RETURN jsonb_build_object('success', true, 'final_setup', true);
  END IF;
  
  RETURN jsonb_build_object('success', false, 'error', 'Prerequisites not met for final setup');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Complete rewrite with SABO DE16 logic
CREATE OR REPLACE FUNCTION advance_double_elimination_winner_comprehensive(
  p_match_id UUID
) RETURNS jsonb AS $$
DECLARE
  v_match RECORD;
  v_loser_id UUID;
  v_winner_id UUID;
  v_next_match RECORD;
  v_result jsonb;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Get winner and loser
  v_winner_id := v_match.winner_id;
  v_loser_id := CASE WHEN v_match.participant1_id = v_winner_id 
                THEN v_match.participant2_id 
                ELSE v_match.participant1_id END;
  
  -- SABO DE16 Logic Implementation
  IF v_match.match_stage = 'winners_round_1' THEN
    -- Move winner to WB Round 2
    SELECT * INTO v_next_match
    FROM tournament_matches 
    WHERE tournament_id = v_match.tournament_id 
      AND match_stage = 'winners_round_2'
      AND (participant1_id IS NULL OR participant2_id IS NULL)
      AND round_position = CEIL(v_match.round_position::numeric / 2)
    LIMIT 1;
    
    IF FOUND THEN
      IF v_next_match.participant1_id IS NULL THEN
        UPDATE tournament_matches SET participant1_id = v_winner_id WHERE id = v_next_match.id;
      ELSE
        UPDATE tournament_matches SET participant2_id = v_winner_id WHERE id = v_next_match.id;
      END IF;
    END IF;
    
    -- Move loser to Losers Branch A
    PERFORM assign_loser_to_branch(v_loser_id, 'A', v_match.tournament_id);
    
  ELSIF v_match.match_stage = 'winners_round_2' THEN
    -- Move winner to WB Round 3
    SELECT * INTO v_next_match
    FROM tournament_matches 
    WHERE tournament_id = v_match.tournament_id 
      AND match_stage = 'winners_round_3'
      AND (participant1_id IS NULL OR participant2_id IS NULL)
      AND round_position = CEIL(v_match.round_position::numeric / 2)
    LIMIT 1;
    
    IF FOUND THEN
      IF v_next_match.participant1_id IS NULL THEN
        UPDATE tournament_matches SET participant1_id = v_winner_id WHERE id = v_next_match.id;
      ELSE
        UPDATE tournament_matches SET participant2_id = v_winner_id WHERE id = v_next_match.id;
      END IF;
    END IF;
    
    -- Move loser to Losers Branch B
    PERFORM assign_loser_to_branch(v_loser_id, 'B', v_match.tournament_id);
    
  ELSIF v_match.match_stage = 'winners_round_3' THEN
    -- Check if we can setup semifinal
    PERFORM setup_semifinal_participants(v_match.tournament_id);
    
  ELSIF v_match.loser_branch = 'A' THEN
    -- Losers Branch A Logic - move winner to next round in Branch A
    SELECT * INTO v_next_match
    FROM tournament_matches 
    WHERE tournament_id = v_match.tournament_id 
      AND loser_branch = 'A'
      AND round_number = v_match.round_number + 1
      AND (participant1_id IS NULL OR participant2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF FOUND THEN
      IF v_next_match.participant1_id IS NULL THEN
        UPDATE tournament_matches SET participant1_id = v_winner_id WHERE id = v_next_match.id;
      ELSE
        UPDATE tournament_matches SET participant2_id = v_winner_id WHERE id = v_next_match.id;
      END IF;
    END IF;
    
  ELSIF v_match.loser_branch = 'B' THEN
    -- Losers Branch B Logic - move winner to next round in Branch B
    SELECT * INTO v_next_match
    FROM tournament_matches 
    WHERE tournament_id = v_match.tournament_id 
      AND loser_branch = 'B'
      AND round_number = v_match.round_number + 1
      AND (participant1_id IS NULL OR participant2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF FOUND THEN
      IF v_next_match.participant1_id IS NULL THEN
        UPDATE tournament_matches SET participant1_id = v_winner_id WHERE id = v_next_match.id;
      ELSE
        UPDATE tournament_matches SET participant2_id = v_winner_id WHERE id = v_next_match.id;
      END IF;
    END IF;
    
  ELSIF v_match.match_stage = 'semifinal' THEN
    -- Check if we can setup final
    PERFORM setup_final_participants(v_match.tournament_id);
    
  ELSIF v_match.match_stage = 'final' THEN
    -- Tournament completed
    UPDATE tournaments 
    SET status = 'completed',
        bracket_progression = bracket_progression || '{"tournament_complete": true}'::jsonb,
        completed_at = NOW()
    WHERE id = v_match.tournament_id;
    
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'advancement_completed', true,
    'match_stage', v_match.match_stage,
    'winner_id', v_winner_id,
    'loser_id', v_loser_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Enhanced score submission with automation
CREATE OR REPLACE FUNCTION submit_double_elimination_score(
  p_match_id UUID,
  p_player1_score INTEGER,
  p_player2_score INTEGER
) RETURNS jsonb AS $$
DECLARE
  v_winner_id UUID;
  v_match RECORD;
  v_result jsonb;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Determine winner based on scores
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.participant1_id;
  ELSIF p_player2_score > p_player1_score THEN
    v_winner_id := v_match.participant2_id;
  ELSE
    RETURN jsonb_build_object('error', 'Scores cannot be tied');
  END IF;
  
  -- Update match with scores and winner
  UPDATE tournament_matches 
  SET participant1_score = p_player1_score,
      participant2_score = p_player2_score,
      winner_id = v_winner_id,
      status = 'completed',
      completed_at = NOW()
  WHERE id = p_match_id;
  
  -- Automatic advancement
  SELECT advance_double_elimination_winner_comprehensive(p_match_id) INTO v_result;
  
  RETURN jsonb_build_object(
    'score_submitted', true,
    'winner_id', v_winner_id,
    'advancement_result', v_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Add new columns for DE16 structure
ALTER TABLE tournament_matches 
ADD COLUMN IF NOT EXISTS match_stage VARCHAR(30) 
CHECK (match_stage IN (
  'winners_round_1', 'winners_round_2', 'winners_round_3',
  'losers_branch_a_round_1', 'losers_branch_a_round_2', 'losers_branch_a_round_3',
  'losers_branch_b_round_1', 'losers_branch_b_round_2', 'losers_branch_b_round_3',
  'semifinal', 'final'
));

ALTER TABLE tournament_matches 
ADD COLUMN IF NOT EXISTS loser_branch CHAR(1) 
CHECK (loser_branch IN ('A', 'B'));

ALTER TABLE tournament_matches
ADD COLUMN IF NOT EXISTS round_position INTEGER;

-- Add tournament progression tracking
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS bracket_progression JSONB DEFAULT '{
  "winners_bracket_completed": false,
  "branch_a_completed": false, 
  "branch_b_completed": false,
  "semifinal_ready": false,
  "final_ready": false,
  "tournament_complete": false
}'::jsonb;