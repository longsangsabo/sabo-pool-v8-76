-- Fix lỗi SQL trong function double elimination
CREATE OR REPLACE FUNCTION public.generate_double_elimination_bracket_complete(p_tournament_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_participants UUID[];
  v_participant_count INTEGER;
  v_round_number INTEGER;
  v_match_number INTEGER;
  v_winners_bracket_matches INTEGER := 0;
  v_losers_bracket_matches INTEGER := 0;
  v_total_matches INTEGER := 0;
  v_bracket_structure JSONB;
  v_winners_bracket_rounds INTEGER;
  v_losers_bracket_rounds INTEGER;
  v_pair_count INTEGER;
  v_i INTEGER;
  v_j INTEGER;
  v_loser_round INTEGER;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Verify this is a double elimination tournament
  IF v_tournament.tournament_type != 'double_elimination' THEN
    RETURN jsonb_build_object('error', 'This function is only for double elimination tournaments');
  END IF;
  
  -- Get confirmed participants - FIX: Add registration_date to SELECT and ORDER BY
  SELECT array_agg(user_id ORDER BY registration_date) INTO v_participants
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id 
  AND registration_status = 'confirmed';
  
  v_participant_count := array_length(v_participants, 1);
  
  IF v_participant_count < 2 THEN
    RETURN jsonb_build_object('error', 'Need at least 2 participants for double elimination');
  END IF;
  
  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Calculate bracket structure for double elimination
  v_winners_bracket_rounds := CEIL(LOG(2, v_participant_count));
  v_losers_bracket_rounds := (v_winners_bracket_rounds - 1) * 2;
  
  -- Create winners bracket matches (same as single elimination)
  v_round_number := 1;
  v_pair_count := v_participant_count;
  
  WHILE v_pair_count > 1 LOOP
    v_match_number := 1;
    
    -- Create matches for this round
    FOR v_i IN 1..CEIL(v_pair_count::float / 2) LOOP
      INSERT INTO tournament_matches (
        tournament_id, round_number, match_number, bracket_type,
        player1_id, player2_id, status, created_at, updated_at
      ) VALUES (
        p_tournament_id, v_round_number, v_match_number, 'winners',
        CASE WHEN v_round_number = 1 AND (v_i * 2 - 1) <= v_participant_count 
             THEN v_participants[v_i * 2 - 1] ELSE NULL END,
        CASE WHEN v_round_number = 1 AND (v_i * 2) <= v_participant_count 
             THEN v_participants[v_i * 2] ELSE NULL END,
        'pending', NOW(), NOW()
      );
      
      v_match_number := v_match_number + 1;
      v_winners_bracket_matches := v_winners_bracket_matches + 1;
    END LOOP;
    
    v_pair_count := CEIL(v_pair_count::float / 2);
    v_round_number := v_round_number + 1;
  END LOOP;
  
  -- Create losers bracket structure
  -- For double elimination with 16 participants, we need approximately 14 losers bracket matches
  v_loser_round := 1;
  
  -- Round 1: Initial losers from winners bracket R1 (8 losers -> 4 matches)
  FOR v_i IN 1..4 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      status, created_at, updated_at
    ) VALUES (
      p_tournament_id, v_loser_round, v_i, 'losers',
      'pending', NOW(), NOW()
    );
    
    v_losers_bracket_matches := v_losers_bracket_matches + 1;
  END LOOP;
  
  -- Round 2: Winners from L1 vs Losers from W2 (4 winners + 4 losers -> 4 matches)
  v_loser_round := v_loser_round + 1;
  FOR v_i IN 1..4 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      status, created_at, updated_at
    ) VALUES (
      p_tournament_id, v_loser_round, v_i, 'losers',
      'pending', NOW(), NOW()
    );
    
    v_losers_bracket_matches := v_losers_bracket_matches + 1;
  END LOOP;
  
  -- Round 3: Winners from L2 vs Losers from W3 (4 winners + 2 losers -> 2 matches)
  v_loser_round := v_loser_round + 1;
  FOR v_i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      status, created_at, updated_at
    ) VALUES (
      p_tournament_id, v_loser_round, v_i, 'losers',
      'pending', NOW(), NOW()
    );
    
    v_losers_bracket_matches := v_losers_bracket_matches + 1;
  END LOOP;
  
  -- Round 4: Winners from L3 face each other (2 winners -> 1 match)
  v_loser_round := v_loser_round + 1;
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type,
    status, created_at, updated_at
  ) VALUES (
    p_tournament_id, v_loser_round, 1, 'losers',
    'pending', NOW(), NOW()
  );
  
  v_losers_bracket_matches := v_losers_bracket_matches + 1;
  
  -- Round 5: Winner from L4 vs Loser from W4 (finals winner) (1 match)
  v_loser_round := v_loser_round + 1;
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type,
    status, created_at, updated_at
  ) VALUES (
    p_tournament_id, v_loser_round, 1, 'losers',
    'pending', NOW(), NOW()
  );
  
  v_losers_bracket_matches := v_losers_bracket_matches + 1;
  
  -- Create grand final match
  v_loser_round := v_loser_round + 1;
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type,
    status, created_at, updated_at
  ) VALUES (
    p_tournament_id, v_loser_round, 1, 'grand_final',
    'pending', NOW(), NOW()
  );
  
  v_losers_bracket_matches := v_losers_bracket_matches + 1;
  
  -- Potential second grand final (if losers bracket winner wins first grand final)
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type,
    status, created_at, updated_at
  ) VALUES (
    p_tournament_id, v_loser_round + 1, 1, 'grand_final_reset',
    'pending', NOW(), NOW()
  );
  
  v_losers_bracket_matches := v_losers_bracket_matches + 1;
  
  v_total_matches := v_winners_bracket_matches + v_losers_bracket_matches;
  
  -- Build bracket structure info
  v_bracket_structure := jsonb_build_object(
    'tournament_type', 'double_elimination',
    'participant_count', v_participant_count,
    'winners_bracket_rounds', v_winners_bracket_rounds,
    'losers_bracket_rounds', v_losers_bracket_rounds,
    'winners_bracket_matches', v_winners_bracket_matches,
    'losers_bracket_matches', v_losers_bracket_matches,
    'total_matches', v_total_matches,
    'has_grand_final', true,
    'has_grand_final_reset', true
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'tournament_type', 'double_elimination',
    'participant_count', v_participant_count,
    'total_matches', v_total_matches,
    'winners_bracket_matches', v_winners_bracket_matches,
    'losers_bracket_matches', v_losers_bracket_matches,
    'rounds_created', v_loser_round + 1,
    'bracket_structure', v_bracket_structure,
    'message', 'Double elimination bracket created successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Failed to create double elimination bracket: %s', SQLERRM)
    );
END;
$$;

-- Tạo lại triggers cho auto-advancement
CREATE OR REPLACE FUNCTION public.trigger_tournament_match_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament_type TEXT;
  v_advancement_result JSONB;
BEGIN
  -- Only process when match is completed and has a winner
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL 
     AND (OLD.status != 'completed' OR OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
    
    -- Get tournament type
    SELECT tournament_type INTO v_tournament_type
    FROM tournaments 
    WHERE id = NEW.tournament_id;
    
    -- Call appropriate advancement function based on tournament type
    IF v_tournament_type = 'double_elimination' THEN
      SELECT public.advance_double_elimination_winner_comprehensive(NEW.id) INTO v_advancement_result;
    ELSE
      SELECT public.advance_winner_to_next_round_enhanced(NEW.id, FALSE) INTO v_advancement_result;
    END IF;
    
    RAISE NOTICE 'Auto-advancement triggered for match %: %', NEW.id, v_advancement_result;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Tạo trigger
DROP TRIGGER IF EXISTS tournament_match_completion_trigger ON tournament_matches;
CREATE TRIGGER tournament_match_completion_trigger
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_tournament_match_completion();

-- Test tạo lại bracket cho giải double-3 với structure đúng
SELECT generate_double_elimination_bracket_complete('2651c29c-2388-4687-8034-f8659491a409');