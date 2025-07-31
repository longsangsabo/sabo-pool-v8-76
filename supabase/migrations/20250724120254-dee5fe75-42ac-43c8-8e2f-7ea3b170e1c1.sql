-- Fix Double Elimination Losers Bracket Logic

-- Enhanced function to properly generate double elimination bracket with correct losers bracket structure
CREATE OR REPLACE FUNCTION public.generate_double_elimination_bracket_complete(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_participants UUID[];
  v_participant_count INTEGER;
  v_bracket_size INTEGER;
  v_total_rounds INTEGER;
  v_losers_rounds INTEGER;
  v_match_counter INTEGER := 1;
  v_round INTEGER;
  v_match_in_round INTEGER;
  v_player1_id UUID;
  v_player2_id UUID;
  v_result JSONB;
  v_winners_matches_per_round INTEGER[];
  v_losers_matches_per_round INTEGER[];
BEGIN
  -- Get participants ordered by registration
  SELECT array_agg(tr.user_id ORDER BY tr.registration_date)
  INTO v_participants
  FROM tournament_registrations tr
  WHERE tr.tournament_id = p_tournament_id 
    AND tr.registration_status = 'confirmed';

  v_participant_count := array_length(v_participants, 1);
  
  IF v_participant_count < 2 THEN
    RETURN jsonb_build_object('error', 'Need at least 2 participants');
  END IF;

  -- Calculate bracket size (next power of 2)
  v_bracket_size := 2;
  WHILE v_bracket_size < v_participant_count LOOP
    v_bracket_size := v_bracket_size * 2;
  END LOOP;

  v_total_rounds := CEIL(LOG(2, v_bracket_size));
  v_losers_rounds := (v_total_rounds - 1) * 2; -- Losers bracket has 2*(n-1) rounds

  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;

  -- Pre-calculate matches per round for both brackets
  v_winners_matches_per_round := ARRAY[]::INTEGER[];
  v_losers_matches_per_round := ARRAY[]::INTEGER[];
  
  FOR v_round IN 1..v_total_rounds LOOP
    v_winners_matches_per_round := v_winners_matches_per_round || (v_bracket_size / (2^v_round));
  END LOOP;

  FOR v_round IN 1..v_losers_rounds LOOP
    IF v_round % 2 = 1 THEN -- Odd rounds receive losers from winners bracket
      v_losers_matches_per_round := v_losers_matches_per_round || (v_bracket_size / (2^((v_round + 1) / 2 + 1)));
    ELSE -- Even rounds are internal losers bracket matches
      v_losers_matches_per_round := v_losers_matches_per_round || (v_bracket_size / (2^(v_round / 2 + 1)));
    END IF;
  END LOOP;

  -- Generate Winners Bracket
  FOR v_round IN 1..v_total_rounds LOOP
    FOR v_match_in_round IN 1..v_winners_matches_per_round[v_round] LOOP
      v_player1_id := NULL;
      v_player2_id := NULL;
      
      -- First round gets actual participants
      IF v_round = 1 THEN
        v_player1_id := v_participants[(v_match_in_round - 1) * 2 + 1];
        IF (v_match_in_round - 1) * 2 + 2 <= v_participant_count THEN
          v_player2_id := v_participants[(v_match_in_round - 1) * 2 + 2];
        END IF;
      END IF;

      INSERT INTO tournament_matches (
        id, tournament_id, round_number, match_number, 
        player1_id, player2_id, bracket_type, 
        status, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), p_tournament_id, v_round, v_match_counter,
        v_player1_id, v_player2_id, 'winners',
        CASE WHEN v_round = 1 AND v_player2_id IS NOT NULL THEN 'scheduled' ELSE 'waiting' END,
        NOW(), NOW()
      );
      
      v_match_counter := v_match_counter + 1;
    END LOOP;
  END LOOP;

  -- Generate Losers Bracket with proper structure
  FOR v_round IN 1..v_losers_rounds LOOP
    FOR v_match_in_round IN 1..v_losers_matches_per_round[v_round] LOOP
      INSERT INTO tournament_matches (
        id, tournament_id, round_number, match_number, 
        player1_id, player2_id, bracket_type, 
        status, created_at, updated_at,
        metadata
      ) VALUES (
        gen_random_uuid(), p_tournament_id, v_round, v_match_counter,
        NULL, NULL, 'losers',
        'waiting', NOW(), NOW(),
        jsonb_build_object(
          'losers_round_type', CASE WHEN v_round % 2 = 1 THEN 'receive_from_winners' ELSE 'internal_losers' END,
          'receives_from_winners_round', CASE WHEN v_round % 2 = 1 THEN (v_round + 1) / 2 ELSE NULL END
        )
      );
      
      v_match_counter := v_match_counter + 1;
    END LOOP;
  END LOOP;

  -- Generate Grand Final
  INSERT INTO tournament_matches (
    id, tournament_id, round_number, match_number, 
    player1_id, player2_id, bracket_type, 
    status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_tournament_id, v_total_rounds + 1, v_match_counter,
    NULL, NULL, 'grand_final',
    'waiting', NOW(), NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'participant_count', v_participant_count,
    'total_matches', v_match_counter,
    'winners_rounds', v_total_rounds,
    'losers_rounds', v_losers_rounds,
    'bracket_structure', jsonb_build_object(
      'winners_matches_per_round', v_winners_matches_per_round,
      'losers_matches_per_round', v_losers_matches_per_round
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Enhanced function to properly advance winners and place losers in correct positions
CREATE OR REPLACE FUNCTION public.advance_double_elimination_winner_branched(p_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_match RECORD;
  v_winner_id UUID;
  v_loser_id UUID;
  v_next_winners_match_id UUID;
  v_losers_match_id UUID;
  v_tournament_info RECORD;
  v_winner_advanced BOOLEAN := FALSE;
  v_loser_placed BOOLEAN := FALSE;
  v_position_in_match INTEGER;
  v_existing_player UUID;
BEGIN
  -- Get match details
  SELECT * INTO v_match
  FROM tournament_matches 
  WHERE id = p_match_id AND status = 'completed' AND winner_id IS NOT NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found or not completed');
  END IF;

  v_winner_id := v_match.winner_id;
  v_loser_id := CASE WHEN v_match.player1_id = v_winner_id THEN v_match.player2_id ELSE v_match.player1_id END;

  -- Get tournament info
  SELECT t.*, COUNT(tr.user_id) as participant_count
  INTO v_tournament_info
  FROM tournaments t
  LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id AND tr.registration_status = 'confirmed'
  WHERE t.id = v_match.tournament_id
  GROUP BY t.id;

  -- Advance winner in Winners Bracket
  IF v_match.bracket_type = 'winners' THEN
    -- Find next winners bracket match
    SELECT tm.id INTO v_next_winners_match_id
    FROM tournament_matches tm
    WHERE tm.tournament_id = v_match.tournament_id
      AND tm.bracket_type = 'winners'
      AND tm.round_number = v_match.round_number + 1
      AND tm.match_number = CEIL(v_match.match_number::NUMERIC / 2)
      AND (tm.player1_id IS NULL OR tm.player2_id IS NULL);

    IF v_next_winners_match_id IS NOT NULL THEN
      -- Determine position (odd match numbers go to player1, even to player2)
      v_position_in_match := CASE WHEN v_match.match_number % 2 = 1 THEN 1 ELSE 2 END;
      
      IF v_position_in_match = 1 THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, updated_at = NOW()
        WHERE id = v_next_winners_match_id AND player1_id IS NULL;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_winner_id, updated_at = NOW()
        WHERE id = v_next_winners_match_id AND player2_id IS NULL;
      END IF;
      
      v_winner_advanced := TRUE;
      
      -- Update match status if both players are now assigned
      UPDATE tournament_matches 
      SET status = 'scheduled'
      WHERE id = v_next_winners_match_id 
        AND player1_id IS NOT NULL 
        AND player2_id IS NOT NULL 
        AND status = 'waiting';
    END IF;

    -- Place loser in Losers Bracket
    IF v_loser_id IS NOT NULL THEN
      -- Find appropriate losers bracket position
      -- Losers from winners round N go to losers round (2*N - 1)
      SELECT tm.id INTO v_losers_match_id
      FROM tournament_matches tm
      WHERE tm.tournament_id = v_match.tournament_id
        AND tm.bracket_type = 'losers'
        AND tm.round_number = (2 * v_match.round_number - 1)
        AND (tm.player1_id IS NULL OR tm.player2_id IS NULL)
        AND NOT (tm.player1_id = v_loser_id OR tm.player2_id = v_loser_id) -- Prevent duplicates
      ORDER BY tm.match_number
      LIMIT 1;

      IF v_losers_match_id IS NOT NULL THEN
        -- Check if we can place in player1 slot
        SELECT player1_id INTO v_existing_player
        FROM tournament_matches 
        WHERE id = v_losers_match_id;
        
        IF v_existing_player IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = v_loser_id, updated_at = NOW()
          WHERE id = v_losers_match_id;
        ELSE
          -- Place in player2 slot
          UPDATE tournament_matches 
          SET player2_id = v_loser_id, updated_at = NOW()
          WHERE id = v_losers_match_id AND player2_id IS NULL;
        END IF;
        
        v_loser_placed := TRUE;
        
        -- Update match status if both players are now assigned
        UPDATE tournament_matches 
        SET status = 'scheduled'
        WHERE id = v_losers_match_id 
          AND player1_id IS NOT NULL 
          AND player2_id IS NOT NULL 
          AND status = 'waiting';
      END IF;
    END IF;

  -- Handle Losers Bracket advancement
  ELSIF v_match.bracket_type = 'losers' THEN
    -- Find next losers bracket match
    SELECT tm.id INTO v_next_winners_match_id
    FROM tournament_matches tm
    WHERE tm.tournament_id = v_match.tournament_id
      AND tm.bracket_type = 'losers'
      AND tm.round_number = v_match.round_number + 1
      AND (tm.player1_id IS NULL OR tm.player2_id IS NULL)
    ORDER BY tm.match_number
    LIMIT 1;

    IF v_next_winners_match_id IS NOT NULL THEN
      -- Place winner in next losers match
      UPDATE tournament_matches 
      SET player1_id = CASE WHEN player1_id IS NULL THEN v_winner_id ELSE player1_id END,
          player2_id = CASE WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN v_winner_id ELSE player2_id END,
          updated_at = NOW()
      WHERE id = v_next_winners_match_id;
      
      v_winner_advanced := TRUE;
      
      -- Update match status if both players are now assigned
      UPDATE tournament_matches 
      SET status = 'scheduled'
      WHERE id = v_next_winners_match_id 
        AND player1_id IS NOT NULL 
        AND player2_id IS NOT NULL 
        AND status = 'waiting';
    ELSE
      -- Check if this is the final losers bracket match (advances to grand final)
      SELECT tm.id INTO v_next_winners_match_id
      FROM tournament_matches tm
      WHERE tm.tournament_id = v_match.tournament_id
        AND tm.bracket_type = 'grand_final'
        AND (tm.player1_id IS NULL OR tm.player2_id IS NULL);
        
      IF v_next_winners_match_id IS NOT NULL THEN
        UPDATE tournament_matches 
        SET player2_id = v_winner_id, updated_at = NOW()
        WHERE id = v_next_winners_match_id AND player2_id IS NULL;
        
        v_winner_advanced := TRUE;
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'match_id', p_match_id,
    'bracket_type', v_match.bracket_type,
    'winner_id', v_winner_id,
    'loser_id', v_loser_id,
    'winner_advanced', v_winner_advanced,
    'loser_placed', v_loser_placed,
    'next_winners_match', v_next_winners_match_id,
    'losers_match', v_losers_match_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;