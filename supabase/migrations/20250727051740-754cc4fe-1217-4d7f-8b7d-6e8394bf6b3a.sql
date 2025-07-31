-- Fix existing tournament structures and create standardized function
-- First, let's create a function to fix existing tournaments

CREATE OR REPLACE FUNCTION public.standardize_double_elimination_structure()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_fixed_count INTEGER := 0;
BEGIN
  -- Fix existing double elimination tournaments
  FOR v_tournament IN 
    SELECT DISTINCT t.id, t.name
    FROM tournaments t
    JOIN tournament_matches tm ON t.id = tm.tournament_id
    WHERE t.tournament_type = 'double_elimination'
    AND (
      tm.bracket_type IN ('winner', 'loser', 'grand_final') 
      OR (tm.bracket_type = 'losers' AND tm.branch_type IS NULL)
    )
  LOOP
    -- Standardize bracket_type names
    UPDATE tournament_matches SET 
      bracket_type = 'winners'
    WHERE tournament_id = v_tournament.id 
      AND bracket_type = 'winner';
      
    UPDATE tournament_matches SET 
      bracket_type = 'losers'
    WHERE tournament_id = v_tournament.id 
      AND bracket_type = 'loser';
      
    UPDATE tournament_matches SET 
      bracket_type = 'final'
    WHERE tournament_id = v_tournament.id 
      AND bracket_type = 'grand_final';
    
    -- Set branch_type for losers bracket based on round logic
    -- Branch A: Receives losers from Winners Round 1 (typically earlier rounds in losers)
    -- Branch B: Receives losers from Winners Round 2 (typically later rounds in losers)
    
    -- For losers bracket without branch_type, set them based on pattern
    UPDATE tournament_matches SET 
      branch_type = CASE 
        WHEN round_number <= 3 THEN 'branch_a'
        ELSE 'branch_b'
      END
    WHERE tournament_id = v_tournament.id 
      AND bracket_type = 'losers' 
      AND branch_type IS NULL;
    
    -- For complex structures, try to detect pattern from existing data
    WITH loser_analysis AS (
      SELECT 
        round_number,
        COUNT(*) as match_count,
        MIN(match_number) as min_match,
        MAX(match_number) as max_match
      FROM tournament_matches 
      WHERE tournament_id = v_tournament.id 
        AND bracket_type = 'losers'
        AND branch_type IS NULL
      GROUP BY round_number
      ORDER BY round_number
    )
    UPDATE tournament_matches tm SET 
      branch_type = CASE 
        -- If more matches in early rounds, likely branch_a pattern
        WHEN round_number = 1 AND match_number <= 4 THEN 'branch_a'
        WHEN round_number = 1 AND match_number > 4 THEN 'branch_b'
        WHEN round_number = 2 AND match_number <= 2 THEN 'branch_a' 
        WHEN round_number = 2 AND match_number > 2 THEN 'branch_b'
        WHEN round_number = 3 THEN 'branch_a'
        WHEN round_number >= 4 THEN 'branch_b'
        ELSE 'branch_a'
      END
    FROM loser_analysis la
    WHERE tm.tournament_id = v_tournament.id 
      AND tm.bracket_type = 'losers' 
      AND tm.branch_type IS NULL
      AND tm.round_number = la.round_number;
    
    v_fixed_count := v_fixed_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournaments_fixed', v_fixed_count,
    'message', 'Double elimination structures standardized'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to standardize structures: ' || SQLERRM
    );
END;
$$;

-- Now create the standardized bracket generation function
CREATE OR REPLACE FUNCTION public.generate_double_elimination_bracket_complete(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_participants UUID[];
  v_participant_count INTEGER;
  v_total_matches INTEGER := 0;
  v_round INTEGER;
  v_match_number INTEGER;
  v_player_idx INTEGER;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Get confirmed participants
  SELECT array_agg(user_id ORDER BY created_at) INTO v_participants
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id 
    AND registration_status = 'confirmed';
  
  v_participant_count := array_length(v_participants, 1);
  
  IF v_participant_count != 16 THEN
    RETURN jsonb_build_object('error', 'This function is designed for 16-player tournaments only');
  END IF;
  
  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- 1. WINNER'S BRACKET (3 rounds: 16→8→4→2)
  
  -- Round 1: 16→8 (8 matches)
  FOR i IN 1..8 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, 
      player1_id, player2_id, 
      bracket_type, branch_type,
      status, scheduled_time
    ) VALUES (
      p_tournament_id, 1, i,
      v_participants[i*2-1], v_participants[i*2],
      'winners', NULL,
      'scheduled', NOW() + (i-1) * INTERVAL '30 minutes'
    );
    v_total_matches := v_total_matches + 1;
  END LOOP;
  
  -- Round 2: 8→4 (4 matches) 
  FOR i IN 1..4 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id,
      bracket_type, branch_type,
      status, scheduled_time
    ) VALUES (
      p_tournament_id, 2, i,
      NULL, NULL, -- Will be filled by winners from R1
      'winners', NULL,
      'waiting', NULL
    );
    v_total_matches := v_total_matches + 1;
  END LOOP;
  
  -- Round 3: 4→2 (2 matches)
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id,
      bracket_type, branch_type,
      status, scheduled_time
    ) VALUES (
      p_tournament_id, 3, i,
      NULL, NULL, -- Will be filled by winners from R2
      'winners', NULL,
      'waiting', NULL
    );
    v_total_matches := v_total_matches + 1;
  END LOOP;
  
  -- 2. LOSER'S BRACKET
  
  -- Branch A: Losers from WB R1 (8→4→2→1)
  -- Branch A Round 1: 8→4 (4 matches)
  FOR i IN 1..4 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id,
      bracket_type, branch_type,
      status, scheduled_time
    ) VALUES (
      p_tournament_id, 1, i,
      NULL, NULL, -- Will be filled by losers from WB R1
      'losers', 'branch_a',
      'waiting', NULL
    );
    v_total_matches := v_total_matches + 1;
  END LOOP;
  
  -- Branch A Round 2: 4→2 (2 matches)
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id,
      bracket_type, branch_type,
      status, scheduled_time
    ) VALUES (
      p_tournament_id, 2, i,
      NULL, NULL,
      'losers', 'branch_a',
      'waiting', NULL
    );
    v_total_matches := v_total_matches + 1;
  END LOOP;
  
  -- Branch A Round 3: 2→1 (1 match) 
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number,
    player1_id, player2_id,
    bracket_type, branch_type,
    status, scheduled_time
  ) VALUES (
    p_tournament_id, 3, 1,
    NULL, NULL,
    'losers', 'branch_a',
    'waiting', NULL
  );
  v_total_matches := v_total_matches + 1;
  
  -- Branch B: Losers from WB R2 (4→2→1)
  -- Branch B Round 1: 4→2 (2 matches)
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id,
      bracket_type, branch_type,
      status, scheduled_time
    ) VALUES (
      p_tournament_id, 1, i,
      NULL, NULL, -- Will be filled by losers from WB R2
      'losers', 'branch_b',
      'waiting', NULL
    );
    v_total_matches := v_total_matches + 1;
  END LOOP;
  
  -- Branch B Round 2: 2→1 (1 match)
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number,
    player1_id, player2_id,
    bracket_type, branch_type,
    status, scheduled_time
  ) VALUES (
    p_tournament_id, 2, 1,
    NULL, NULL,
    'losers', 'branch_b',
    'waiting', NULL
  );
  v_total_matches := v_total_matches + 1;
  
  -- 3. SEMIFINAL (4→2)
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id,
      bracket_type, branch_type,
      status, scheduled_time
    ) VALUES (
      p_tournament_id, 1, i,
      NULL, NULL, -- 2 from winners + 1 from branch_a + 1 from branch_b
      'semifinal', NULL,
      'waiting', NULL
    );
    v_total_matches := v_total_matches + 1;
  END LOOP;
  
  -- 4. FINAL (2→1)
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number,
    player1_id, player2_id,
    bracket_type, branch_type,
    status, scheduled_time
  ) VALUES (
    p_tournament_id, 1, 1,
    NULL, NULL, -- Winners from semifinal
    'final', NULL,
    'waiting', NULL
  );
  v_total_matches := v_total_matches + 1;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'participant_count', v_participant_count,
    'total_matches', v_total_matches,
    'bracket_structure', jsonb_build_object(
      'winners_rounds', 3,
      'loser_branch_a_rounds', 3, 
      'loser_branch_b_rounds', 2,
      'semifinal_rounds', 1,
      'final_rounds', 1
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to generate bracket: ' || SQLERRM
    );
END;
$$;