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
      'player1_id', NULL, -- Will be filled by winner from WB R1 match (i*2-1)
      'player2_id', NULL, -- Will be filled by winner from WB R1 match (i*2)
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
    'player1_id', NULL, -- Winner from WB R2 match 1
    'player2_id', NULL, -- Winner from WB R2 match 2
    'status', 'pending'
  );
  
  -- LOSERS BRANCH A GENERATION (for 8-player tournament)
  -- Round 101: Losers from WB R1 (8 losers -> 4 matches)
  FOR i IN 1..(v_participant_count / 2) LOOP
    v_losers_branch_a_matches := v_losers_branch_a_matches || jsonb_build_object(
      'tournament_id', p_tournament_id,
      'round_number', 101,
      'match_number', i,
      'bracket_type', 'losers',
      'match_stage', 'losers_branch_a',
      'branch_type', 'branch_a',
      'player1_id', NULL, -- Loser from WB R1 match (i*2-1)
      'player2_id', NULL, -- Loser from WB R1 match (i*2)
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
      'player1_id', NULL, -- Winner from LBA R101 match (i*2-1)
      'player2_id', NULL, -- Winner from LBA R101 match (i*2)
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
    'player1_id', NULL, -- Winner from LBA R102 match 1
    'player2_id', NULL, -- Winner from LBA R102 match 2
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
      'player1_id', NULL, -- Loser from WB R2 match i
      'player2_id', NULL, -- Winner from LBA R103 (when i=1) or Loser from WB R3 (when i=2)
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
    'player1_id', NULL, -- Winner from LBB R201 match 1
    'player2_id', NULL, -- Winner from LBB R201 match 2
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
    'player1_id', NULL, -- Winner from WB R3 (Winners Bracket Champion)
    'player2_id', NULL, -- Winner from LBB R202 (Losers Bracket Finalist)
    'status', 'pending'
  );
  
  -- Potential Round 302: Grand Final Reset (if LBB Finalist wins)
  v_final_matches := v_final_matches || jsonb_build_object(
    'tournament_id', p_tournament_id,
    'round_number', 302,
    'match_number', 1,
    'bracket_type', 'final',
    'match_stage', 'grand_final_reset',
    'player1_id', NULL, -- Same players as R301
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

-- Create enhanced winner advancement function for double elimination
CREATE OR REPLACE FUNCTION public.advance_winner_to_next_round_enhanced(
  p_match_id UUID,
  p_force_advance BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_tournament_type TEXT;
  v_next_match RECORD;
  v_loser_match RECORD;
  v_result JSONB;
BEGIN
  -- Get current match details
  SELECT * INTO v_match 
  FROM tournament_matches 
  WHERE id = p_match_id;
  
  IF v_match IS NULL THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Check if match has a winner
  IF v_match.winner_id IS NULL AND NOT p_force_advance THEN
    RETURN jsonb_build_object('error', 'Match has no winner');
  END IF;
  
  -- Get tournament type
  SELECT tournament_type INTO v_tournament_type
  FROM tournaments 
  WHERE id = v_match.tournament_id;
  
  IF v_tournament_type != 'double_elimination' THEN
    RETURN jsonb_build_object('error', 'This function only supports double elimination tournaments');
  END IF;
  
  -- Handle different bracket stages
  CASE v_match.bracket_type
    WHEN 'winners' THEN
      -- WINNERS BRACKET ADVANCEMENT
      IF v_match.round_number < 3 THEN
        -- Find next winners bracket match
        SELECT * INTO v_next_match
        FROM tournament_matches
        WHERE tournament_id = v_match.tournament_id
          AND bracket_type = 'winners'
          AND round_number = v_match.round_number + 1
          AND match_number = CEIL(v_match.match_number::NUMERIC / 2)
        LIMIT 1;
        
        IF v_next_match.id IS NOT NULL THEN
          -- Determine position in next match
          IF v_match.match_number % 2 = 1 THEN
            UPDATE tournament_matches 
            SET player1_id = v_match.winner_id
            WHERE id = v_next_match.id;
          ELSE
            UPDATE tournament_matches 
            SET player2_id = v_match.winner_id
            WHERE id = v_next_match.id;
          END IF;
        END IF;
      ELSIF v_match.round_number = 3 THEN
        -- Winners bracket champion to grand final
        UPDATE tournament_matches 
        SET player1_id = v_match.winner_id
        WHERE tournament_id = v_match.tournament_id
          AND round_number = 301
          AND match_number = 1;
      END IF;
      
      -- Send loser to appropriate losers bracket
      DECLARE
        v_loser_id UUID;
      BEGIN
        v_loser_id := CASE 
          WHEN v_match.winner_id = v_match.player1_id THEN v_match.player2_id
          ELSE v_match.player1_id
        END;
        
        IF v_match.round_number = 1 THEN
          -- Losers from WB R1 go to LBA R101
          UPDATE tournament_matches 
          SET CASE WHEN v_match.match_number % 2 = 1 THEN player1_id ELSE player2_id END = v_loser_id
          WHERE tournament_id = v_match.tournament_id
            AND round_number = 101
            AND match_number = CEIL(v_match.match_number::NUMERIC / 2);
            
        ELSIF v_match.round_number = 2 THEN
          -- Losers from WB R2 go to LBB R201
          UPDATE tournament_matches 
          SET player1_id = v_loser_id
          WHERE tournament_id = v_match.tournament_id
            AND round_number = 201
            AND match_number = v_match.match_number;
            
        ELSIF v_match.round_number = 3 THEN
          -- Loser from WB R3 goes to LBB R201 match 2
          UPDATE tournament_matches 
          SET player2_id = v_loser_id
          WHERE tournament_id = v_match.tournament_id
            AND round_number = 201
            AND match_number = 2;
        END IF;
      END;
      
    WHEN 'losers' THEN
      -- LOSERS BRACKET ADVANCEMENT
      IF v_match.match_stage = 'losers_branch_a' THEN
        IF v_match.round_number < 103 THEN
          -- Advance within LBA
          SELECT * INTO v_next_match
          FROM tournament_matches
          WHERE tournament_id = v_match.tournament_id
            AND bracket_type = 'losers'
            AND match_stage = 'losers_branch_a'
            AND round_number = v_match.round_number + 1
            AND match_number = CEIL(v_match.match_number::NUMERIC / 2)
          LIMIT 1;
          
          IF v_next_match.id IS NOT NULL THEN
            IF v_match.match_number % 2 = 1 THEN
              UPDATE tournament_matches 
              SET player1_id = v_match.winner_id
              WHERE id = v_next_match.id;
            ELSE
              UPDATE tournament_matches 
              SET player2_id = v_match.winner_id
              WHERE id = v_next_match.id;
            END IF;
          END IF;
        ELSIF v_match.round_number = 103 THEN
          -- LBA finalist goes to LBB R201 match 1
          UPDATE tournament_matches 
          SET player2_id = v_match.winner_id
          WHERE tournament_id = v_match.tournament_id
            AND round_number = 201
            AND match_number = 1;
        END IF;
        
      ELSIF v_match.match_stage = 'losers_branch_b' THEN
        IF v_match.round_number = 201 THEN
          -- Advance to LBB final
          SELECT * INTO v_next_match
          FROM tournament_matches
          WHERE tournament_id = v_match.tournament_id
            AND round_number = 202
            AND match_number = 1
          LIMIT 1;
          
          IF v_next_match.id IS NOT NULL THEN
            IF v_match.match_number = 1 THEN
              UPDATE tournament_matches 
              SET player1_id = v_match.winner_id
              WHERE id = v_next_match.id;
            ELSE
              UPDATE tournament_matches 
              SET player2_id = v_match.winner_id
              WHERE id = v_next_match.id;
            END IF;
          END IF;
        ELSIF v_match.round_number = 202 THEN
          -- LBB finalist goes to grand final
          UPDATE tournament_matches 
          SET player2_id = v_match.winner_id
          WHERE tournament_id = v_match.tournament_id
            AND round_number = 301
            AND match_number = 1;
        END IF;
      END IF;
      
    WHEN 'final' THEN
      -- GRAND FINAL HANDLING
      IF v_match.round_number = 301 THEN
        -- Check if losers bracket finalist won
        IF v_match.winner_id = v_match.player2_id THEN
          -- Reset grand final - both players advance to R302
          UPDATE tournament_matches 
          SET player1_id = v_match.player1_id,
              player2_id = v_match.player2_id
          WHERE tournament_id = v_match.tournament_id
            AND round_number = 302
            AND match_number = 1;
        ELSE
          -- Winners bracket champion wins tournament
          UPDATE tournaments 
          SET status = 'completed'
          WHERE id = v_match.tournament_id;
        END IF;
      ELSIF v_match.round_number = 302 THEN
        -- Grand final reset completed
        UPDATE tournaments 
        SET status = 'completed'
        WHERE id = v_match.tournament_id;
      END IF;
  END CASE;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_advanced', true,
    'message', 'Winner successfully advanced'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;