-- Fix double elimination tournament "double-2" issues
-- Step 1: Delete existing problematic matches for tournament "double-2"
DELETE FROM public.tournament_matches 
WHERE tournament_id IN (
  SELECT id FROM public.tournaments 
  WHERE name = 'double-2'
);

-- Step 2: Create improved double elimination advancement function
CREATE OR REPLACE FUNCTION public.advance_double_elimination_winner_comprehensive(p_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_tournament RECORD;
  v_winner_id UUID;
  v_loser_id UUID;
  v_next_match_id UUID;
  v_loser_match_id UUID;
  v_result JSONB;
  v_winner_advanced BOOLEAN := FALSE;
  v_loser_placed BOOLEAN := FALSE;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = v_match.tournament_id;
  
  IF v_tournament.tournament_type != 'double_elimination' THEN
    RETURN jsonb_build_object('error', 'Not a double elimination tournament');
  END IF;
  
  -- Ensure match is completed with a winner
  IF v_match.status != 'completed' OR v_match.winner_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Match must be completed with a winner');
  END IF;
  
  v_winner_id := v_match.winner_id;
  v_loser_id := CASE 
    WHEN v_match.player1_id = v_winner_id THEN v_match.player2_id 
    ELSE v_match.player1_id 
  END;
  
  -- Handle winner advancement based on bracket type
  IF v_match.bracket_type = 'winners' THEN
    -- Winner advances in winners bracket
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'winners'
      AND round_number = v_match.round_number + 1
      AND (
        (v_match.match_number % 2 = 1 AND match_number = (v_match.match_number + 1) / 2) OR
        (v_match.match_number % 2 = 0 AND match_number = v_match.match_number / 2)
      );
      
    IF FOUND THEN
      -- Place winner in next winners bracket match
      UPDATE tournament_matches
      SET player1_id = COALESCE(player1_id, v_winner_id),
          player2_id = CASE WHEN player1_id IS NULL THEN player2_id ELSE COALESCE(player2_id, v_winner_id) END,
          updated_at = NOW()
      WHERE id = v_next_match_id;
      
      v_winner_advanced := TRUE;
    END IF;
    
    -- Loser goes to losers bracket
    SELECT id INTO v_loser_match_id
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'losers'
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY round_number ASC, match_number ASC
    LIMIT 1;
    
    IF FOUND THEN
      UPDATE tournament_matches
      SET player1_id = COALESCE(player1_id, v_loser_id),
          player2_id = CASE WHEN player1_id IS NULL THEN player2_id ELSE COALESCE(player2_id, v_loser_id) END,
          updated_at = NOW()
      WHERE id = v_loser_match_id;
      
      v_loser_placed := TRUE;
    END IF;
    
  ELSIF v_match.bracket_type = 'losers' THEN
    -- Winner advances in losers bracket or to grand final
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND (
        (bracket_type = 'losers' AND round_number = v_match.round_number + 1) OR
        (bracket_type = 'grand_final' AND v_match.round_number = (SELECT MAX(round_number) FROM tournament_matches WHERE tournament_id = v_match.tournament_id AND bracket_type = 'losers'))
      )
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY round_number ASC, match_number ASC
    LIMIT 1;
    
    IF FOUND THEN
      UPDATE tournament_matches
      SET player1_id = COALESCE(player1_id, v_winner_id),
          player2_id = CASE WHEN player1_id IS NULL THEN player2_id ELSE COALESCE(player2_id, v_winner_id) END,
          updated_at = NOW()
      WHERE id = v_next_match_id;
      
      v_winner_advanced := TRUE;
    END IF;
    
    -- Loser is eliminated (no further placement needed)
    
  ELSIF v_match.bracket_type = 'grand_final' THEN
    -- Tournament is complete, update tournament status
    UPDATE tournaments
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_match.tournament_id;
    
    v_winner_advanced := TRUE;
  END IF;
  
  -- Log the advancement
  INSERT INTO tournament_automation_log (
    tournament_id, automation_type, status, details, completed_at
  ) VALUES (
    v_match.tournament_id, 'double_elimination_advancement', 'completed',
    jsonb_build_object(
      'match_id', p_match_id,
      'bracket_type', v_match.bracket_type,
      'winner_id', v_winner_id,
      'loser_id', v_loser_id,
      'winner_advanced', v_winner_advanced,
      'loser_placed', v_loser_placed
    ),
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'match_id', p_match_id,
    'bracket_type', v_match.bracket_type,
    'winner_id', v_winner_id,
    'loser_id', v_loser_id,
    'winner_advanced', v_winner_advanced,
    'loser_placed', v_loser_placed,
    'next_match_id', v_next_match_id,
    'loser_match_id', v_loser_match_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Double elimination advancement failed: %s', SQLERRM)
    );
END;
$$;

-- Step 3: Create function to properly populate double elimination bracket
CREATE OR REPLACE FUNCTION public.generate_double_elimination_bracket_complete(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_participants UUID[];
  v_participant_count INTEGER;
  v_bracket_size INTEGER;
  v_winners_rounds INTEGER;
  v_losers_rounds INTEGER;
  v_match_counter INTEGER := 1;
  v_round INTEGER;
  v_match_in_round INTEGER;
  v_total_matches INTEGER := 0;
  v_player1_id UUID;
  v_player2_id UUID;
  v_result JSONB;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Get participants
  SELECT array_agg(user_id) INTO v_participants
  FROM tournament_registrations
  WHERE tournament_id = p_tournament_id 
    AND registration_status = 'confirmed';
  
  v_participant_count := array_length(v_participants, 1);
  
  IF v_participant_count < 4 THEN
    RETURN jsonb_build_object('error', 'Need at least 4 participants for double elimination');
  END IF;
  
  -- Calculate bracket size (next power of 2)
  v_bracket_size := power(2, ceil(log(2, v_participant_count)))::INTEGER;
  v_winners_rounds := log(2, v_bracket_size)::INTEGER;
  v_losers_rounds := (v_winners_rounds - 1) * 2;
  
  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Create Winners Bracket Round 1 with actual participants
  FOR v_match_in_round IN 1..(v_bracket_size / 2) LOOP
    v_player1_id := CASE WHEN (v_match_in_round - 1) * 2 + 1 <= v_participant_count 
                         THEN v_participants[(v_match_in_round - 1) * 2 + 1] 
                         ELSE NULL END;
    v_player2_id := CASE WHEN (v_match_in_round - 1) * 2 + 2 <= v_participant_count 
                         THEN v_participants[(v_match_in_round - 1) * 2 + 2] 
                         ELSE NULL END;
    
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, 
      player1_id, player2_id, bracket_type, status
    ) VALUES (
      p_tournament_id, 1, v_match_in_round,
      v_player1_id, v_player2_id, 'winners', 
      CASE WHEN v_player1_id IS NULL OR v_player2_id IS NULL THEN 'completed' ELSE 'pending' END
    );
    
    -- Auto-advance bye matches
    IF v_player1_id IS NULL OR v_player2_id IS NULL THEN
      UPDATE tournament_matches 
      SET winner_id = COALESCE(v_player1_id, v_player2_id),
          status = 'completed'
      WHERE tournament_id = p_tournament_id 
        AND round_number = 1 
        AND match_number = v_match_in_round;
    END IF;
    
    v_total_matches := v_total_matches + 1;
  END LOOP;
  
  -- Create remaining Winners Bracket rounds (placeholders)
  FOR v_round IN 2..v_winners_rounds LOOP
    FOR v_match_in_round IN 1..(power(2, v_winners_rounds - v_round))::INTEGER LOOP
      INSERT INTO tournament_matches (
        tournament_id, round_number, match_number, 
        bracket_type, status
      ) VALUES (
        p_tournament_id, v_round, v_match_in_round,
        'winners', 'pending'
      );
      v_total_matches := v_total_matches + 1;
    END LOOP;
  END LOOP;
  
  -- Create Losers Bracket (placeholders)
  FOR v_round IN 1..v_losers_rounds LOOP
    FOR v_match_in_round IN 1..(CASE 
      WHEN v_round % 2 = 1 THEN power(2, (v_losers_rounds - v_round) / 2)::INTEGER
      ELSE power(2, (v_losers_rounds - v_round + 1) / 2)::INTEGER
    END) LOOP
      INSERT INTO tournament_matches (
        tournament_id, round_number, match_number, 
        bracket_type, status, branch_type
      ) VALUES (
        p_tournament_id, v_round, v_match_in_round,
        'losers', 'pending',
        CASE WHEN v_round <= v_losers_rounds / 2 THEN 'A' ELSE 'B' END
      );
      v_total_matches := v_total_matches + 1;
    END LOOP;
  END LOOP;
  
  -- Create Grand Final
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, 
    bracket_type, status
  ) VALUES (
    p_tournament_id, v_winners_rounds + v_losers_rounds + 1, 1,
    'grand_final', 'pending'
  );
  v_total_matches := v_total_matches + 1;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'tournament_id', p_tournament_id,
    'participant_count', v_participant_count,
    'bracket_size', v_bracket_size,
    'total_matches', v_total_matches,
    'winners_rounds', v_winners_rounds,
    'losers_rounds', v_losers_rounds,
    'message', 'Double elimination bracket created successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Failed to create double elimination bracket: %s', SQLERRM)
    );
END;
$$;