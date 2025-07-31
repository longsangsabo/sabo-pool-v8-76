-- Create comprehensive double elimination tournament management system

-- First, create the double elimination bracket generation function
CREATE OR REPLACE FUNCTION public.generate_double_elimination_bracket(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_participants uuid[];
  v_participant_count INTEGER;
  v_rounds_needed INTEGER;
  v_bye_count INTEGER;
  v_match_id uuid;
  v_result jsonb;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  -- Verify this is a double elimination tournament
  IF v_tournament.tournament_type != 'double_elimination' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a double elimination tournament');
  END IF;
  
  -- Get confirmed participants
  SELECT ARRAY_AGG(user_id ORDER BY created_at) INTO v_participants
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id 
    AND registration_status = 'confirmed'
    AND user_id IS NOT NULL;
  
  v_participant_count := array_length(v_participants, 1);
  
  IF v_participant_count < 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Need at least 2 participants');
  END IF;
  
  -- Calculate number of rounds needed for Winner Bracket
  v_rounds_needed := CEIL(LOG(2, v_participant_count));
  
  -- Calculate byes needed
  v_bye_count := POWER(2, v_rounds_needed) - v_participant_count;
  
  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Create Winner Bracket Round 1 matches
  FOR i IN 1..(v_participant_count / 2) LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      player1_id, player2_id, status, scheduled_time
    ) VALUES (
      p_tournament_id, 1, i, 'winner',
      v_participants[i * 2 - 1], v_participants[i * 2], 
      'scheduled', v_tournament.tournament_start
    );
  END LOOP;
  
  -- Handle odd participant (gets bye to round 2)
  IF v_participant_count % 2 = 1 THEN
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      player1_id, player2_id, status, scheduled_time, winner_id
    ) VALUES (
      p_tournament_id, 2, 1, 'winner',
      v_participants[v_participant_count], NULL,
      'completed', v_tournament.tournament_start, v_participants[v_participant_count]
    );
  END IF;
  
  -- Create Winner Bracket structure for remaining rounds
  FOR round IN 2..v_rounds_needed LOOP
    FOR match IN 1..(POWER(2, v_rounds_needed - round)) LOOP
      INSERT INTO tournament_matches (
        tournament_id, round_number, match_number, bracket_type,
        status, scheduled_time
      ) VALUES (
        p_tournament_id, round, match, 'winner',
        'pending', v_tournament.tournament_start
      );
    END LOOP;
  END LOOP;
  
  -- Create Loser Bracket structure
  -- Loser bracket has 2n-2 rounds where n is the number of winner bracket rounds
  FOR round IN 1..(2 * v_rounds_needed - 2) LOOP
    FOR match IN 1..(CASE 
      WHEN round % 2 = 1 THEN POWER(2, (v_rounds_needed - CEIL(round::numeric / 2)))
      ELSE POWER(2, (v_rounds_needed - CEIL(round::numeric / 2) - 1))
    END) LOOP
      INSERT INTO tournament_matches (
        tournament_id, round_number, match_number, bracket_type,
        status, scheduled_time, branch_type
      ) VALUES (
        p_tournament_id, round, match, 'loser',
        'pending', v_tournament.tournament_start,
        CASE WHEN match <= (POWER(2, (v_rounds_needed - CEIL(round::numeric / 2))) / 2) 
             THEN 'branch_a' ELSE 'branch_b' END
      );
    END LOOP;
  END LOOP;
  
  -- Create Grand Final match
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type,
    status, scheduled_time
  ) VALUES (
    p_tournament_id, 1, 1, 'final',
    'pending', v_tournament.tournament_start
  );
  
  -- Create Grand Final Reset match (in case loser bracket winner wins first grand final)
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type,
    status, scheduled_time, is_grand_final_reset
  ) VALUES (
    p_tournament_id, 2, 1, 'final',
    'pending', v_tournament.tournament_start, true
  );
  
  -- Update tournament status
  UPDATE tournaments 
  SET status = 'bracket_generated',
      management_status = 'bracket_ready',
      updated_at = NOW()
  WHERE id = p_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'participants', v_participant_count,
    'winner_rounds', v_rounds_needed,
    'loser_rounds', 2 * v_rounds_needed - 2,
    'total_matches', (
      SELECT COUNT(*) FROM tournament_matches 
      WHERE tournament_id = p_tournament_id
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;

-- Create function to advance winners in double elimination
CREATE OR REPLACE FUNCTION public.advance_double_elimination_winner(p_match_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_match RECORD;
  v_tournament RECORD;
  v_next_match_id uuid;
  v_loser_match_id uuid;
  v_result jsonb;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;
  
  IF v_match.status != 'completed' OR v_match.winner_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not completed or no winner');
  END IF;
  
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = v_match.tournament_id;
  
  -- Handle Winner Bracket advancement
  IF v_match.bracket_type = 'winner' THEN
    -- Find next winner bracket match
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'winner'
      AND round_number = v_match.round_number + 1
      AND match_number = CEIL(v_match.match_number::numeric / 2)
      AND status = 'pending';
    
    -- Advance winner to next winner bracket match
    IF v_next_match_id IS NOT NULL THEN
      IF v_match.match_number % 2 = 1 THEN
        UPDATE tournament_matches 
        SET player1_id = v_match.winner_id, updated_at = NOW()
        WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_match.winner_id, updated_at = NOW()
        WHERE id = v_next_match_id;
      END IF;
      
      -- Update match status if both players assigned
      UPDATE tournament_matches 
      SET status = 'scheduled'
      WHERE id = v_next_match_id 
        AND player1_id IS NOT NULL 
        AND player2_id IS NOT NULL;
    END IF;
    
    -- Move loser to loser bracket
    DECLARE
      v_loser_id uuid;
      v_loser_round INTEGER;
      v_loser_match_number INTEGER;
    BEGIN
      -- Determine loser
      v_loser_id := CASE 
        WHEN v_match.winner_id = v_match.player1_id THEN v_match.player2_id
        ELSE v_match.player1_id
      END;
      
      -- Calculate loser bracket position
      v_loser_round := (v_match.round_number - 1) * 2 + 1;
      v_loser_match_number := v_match.match_number;
      
      -- Find appropriate loser bracket match
      SELECT id INTO v_loser_match_id
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'loser'
        AND round_number = v_loser_round
        AND status = 'pending'
      ORDER BY match_number
      LIMIT 1;
      
      -- Assign loser to loser bracket
      IF v_loser_match_id IS NOT NULL THEN
        UPDATE tournament_matches 
        SET player1_id = COALESCE(player1_id, v_loser_id),
            player2_id = CASE WHEN player1_id IS NULL THEN player2_id ELSE v_loser_id END,
            updated_at = NOW()
        WHERE id = v_loser_match_id;
        
        -- Update status if both players assigned
        UPDATE tournament_matches 
        SET status = 'scheduled'
        WHERE id = v_loser_match_id 
          AND player1_id IS NOT NULL 
          AND player2_id IS NOT NULL;
      END IF;
    END;
  
  -- Handle Loser Bracket advancement
  ELSIF v_match.bracket_type = 'loser' THEN
    -- Find next loser bracket match
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'loser'
      AND round_number = v_match.round_number + 1
      AND status = 'pending'
    ORDER BY match_number
    LIMIT 1;
    
    -- If no more loser bracket matches, advance to grand final
    IF v_next_match_id IS NULL THEN
      SELECT id INTO v_next_match_id
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'final'
        AND round_number = 1
        AND status = 'pending';
      
      IF v_next_match_id IS NOT NULL THEN
        UPDATE tournament_matches 
        SET player2_id = v_match.winner_id, updated_at = NOW()
        WHERE id = v_next_match_id;
        
        -- Check if grand final is ready
        UPDATE tournament_matches 
        SET status = 'scheduled'
        WHERE id = v_next_match_id 
          AND player1_id IS NOT NULL 
          AND player2_id IS NOT NULL;
      END IF;
    ELSE
      -- Advance to next loser bracket match
      UPDATE tournament_matches 
      SET player1_id = COALESCE(player1_id, v_match.winner_id),
          player2_id = CASE WHEN player1_id IS NULL THEN player2_id ELSE v_match.winner_id END,
          updated_at = NOW()
      WHERE id = v_next_match_id;
      
      -- Update status if both players assigned
      UPDATE tournament_matches 
      SET status = 'scheduled'
      WHERE id = v_next_match_id 
        AND player1_id IS NOT NULL 
        AND player2_id IS NOT NULL;
    END IF;
  
  -- Handle Grand Final
  ELSIF v_match.bracket_type = 'final' THEN
    -- Check if this is the first grand final and loser bracket winner won
    IF v_match.round_number = 1 AND v_match.player2_id = v_match.winner_id THEN
      -- Loser bracket winner won, trigger grand final reset
      SELECT id INTO v_next_match_id
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'final'
        AND round_number = 2
        AND is_grand_final_reset = true;
      
      IF v_next_match_id IS NOT NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_match.player1_id,
            player2_id = v_match.player2_id,
            status = 'scheduled',
            updated_at = NOW()
        WHERE id = v_next_match_id;
      END IF;
    ELSE
      -- Tournament is complete
      UPDATE tournaments 
      SET status = 'completed',
          management_status = 'completed',
          completed_at = NOW(),
          updated_at = NOW()
      WHERE id = v_match.tournament_id;
      
      -- Process tournament completion
      PERFORM complete_tournament_automatically(v_match.tournament_id);
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'next_match_advanced', v_next_match_id IS NOT NULL,
    'tournament_status', COALESCE(v_tournament.status, 'ongoing')
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;

-- Create function to validate double elimination bracket assignments
CREATE OR REPLACE FUNCTION public.validate_double_elimination_assignments(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_issues jsonb := '[]'::jsonb;
  v_total_matches INTEGER;
  v_pending_matches INTEGER;
  v_ready_matches INTEGER;
  v_completed_matches INTEGER;
  v_tournament RECORD;
  v_participants INTEGER;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  -- Count participants
  SELECT COUNT(*) INTO v_participants
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id 
    AND registration_status = 'confirmed';
  
  -- Count matches by status
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as ready,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
  INTO v_total_matches, v_pending_matches, v_ready_matches, v_completed_matches
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id;
  
  -- Check for duplicate player assignments
  WITH player_assignments AS (
    SELECT 
      tournament_id,
      round_number,
      bracket_type,
      player1_id as player_id
    FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
      AND player1_id IS NOT NULL
      AND status = 'scheduled'
    
    UNION ALL
    
    SELECT 
      tournament_id,
      round_number,
      bracket_type,
      player2_id as player_id
    FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
      AND player2_id IS NOT NULL
      AND status = 'scheduled'
  ),
  duplicates AS (
    SELECT player_id, round_number, bracket_type, COUNT(*) as count
    FROM player_assignments
    GROUP BY player_id, round_number, bracket_type
    HAVING COUNT(*) > 1
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'type', 'duplicate_assignment',
      'player_id', player_id,
      'round', round_number,
      'bracket', bracket_type,
      'count', count
    )
  ) INTO v_issues
  FROM duplicates;
  
  -- Check for missing player assignments in ready matches
  WITH missing_players AS (
    SELECT id, round_number, match_number, bracket_type
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND status = 'scheduled'
      AND (player1_id IS NULL OR player2_id IS NULL)
  )
  SELECT v_issues || jsonb_agg(
    jsonb_build_object(
      'type', 'missing_player',
      'match_id', id,
      'round', round_number,
      'match', match_number,
      'bracket', bracket_type
    )
  ) INTO v_issues
  FROM missing_players;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'validation', jsonb_build_object(
      'total_participants', v_participants,
      'total_matches', v_total_matches,
      'pending_matches', v_pending_matches,
      'ready_matches', v_ready_matches,
      'completed_matches', v_completed_matches,
      'issues', COALESCE(v_issues, '[]'::jsonb),
      'is_valid', (v_issues IS NULL OR jsonb_array_length(v_issues) = 0)
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;

-- Create function to get double elimination tournament status
CREATE OR REPLACE FUNCTION public.get_double_elimination_status(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_participants jsonb;
  v_bracket_status jsonb;
  v_current_matches jsonb;
  v_completed_matches jsonb;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  -- Get participants
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', tr.user_id,
      'name', COALESCE(p.full_name, p.display_name, 'Unknown Player'),
      'avatar_url', p.avatar_url,
      'registration_status', tr.registration_status
    )
  ) INTO v_participants
  FROM tournament_registrations tr
  LEFT JOIN profiles p ON p.user_id = tr.user_id
  WHERE tr.tournament_id = p_tournament_id;
  
  -- Get bracket status
  SELECT jsonb_build_object(
    'winner_bracket', jsonb_build_object(
      'total_rounds', (SELECT MAX(round_number) FROM tournament_matches 
                      WHERE tournament_id = p_tournament_id AND bracket_type = 'winner'),
      'completed_rounds', (SELECT COUNT(DISTINCT round_number) FROM tournament_matches 
                          WHERE tournament_id = p_tournament_id AND bracket_type = 'winner' AND status = 'completed'),
      'active_matches', (SELECT COUNT(*) FROM tournament_matches 
                        WHERE tournament_id = p_tournament_id AND bracket_type = 'winner' AND status = 'scheduled')
    ),
    'loser_bracket', jsonb_build_object(
      'total_rounds', (SELECT MAX(round_number) FROM tournament_matches 
                      WHERE tournament_id = p_tournament_id AND bracket_type = 'loser'),
      'completed_rounds', (SELECT COUNT(DISTINCT round_number) FROM tournament_matches 
                          WHERE tournament_id = p_tournament_id AND bracket_type = 'loser' AND status = 'completed'),
      'active_matches', (SELECT COUNT(*) FROM tournament_matches 
                        WHERE tournament_id = p_tournament_id AND bracket_type = 'loser' AND status = 'scheduled')
    ),
    'grand_final', jsonb_build_object(
      'first_match_completed', (SELECT COUNT(*) > 0 FROM tournament_matches 
                               WHERE tournament_id = p_tournament_id AND bracket_type = 'final' 
                               AND round_number = 1 AND status = 'completed'),
      'reset_match_needed', (SELECT COUNT(*) > 0 FROM tournament_matches 
                            WHERE tournament_id = p_tournament_id AND bracket_type = 'final' 
                            AND is_grand_final_reset = true AND status = 'scheduled'),
      'tournament_complete', (SELECT COUNT(*) > 0 FROM tournament_matches 
                             WHERE tournament_id = p_tournament_id AND bracket_type = 'final' 
                             AND ((round_number = 1 AND player1_id = winner_id) OR 
                                  (round_number = 2 AND status = 'completed')))
    )
  ) INTO v_bracket_status;
  
  -- Get current active matches
  SELECT jsonb_agg(
    jsonb_build_object(
      'match_id', tm.id,
      'round_number', tm.round_number,
      'match_number', tm.match_number,
      'bracket_type', tm.bracket_type,
      'player1', jsonb_build_object(
        'id', p1.user_id,
        'name', COALESCE(p1.full_name, p1.display_name, 'TBD')
      ),
      'player2', jsonb_build_object(
        'id', p2.user_id,
        'name', COALESCE(p2.full_name, p2.display_name, 'TBD')
      ),
      'status', tm.status
    )
  ) INTO v_current_matches
  FROM tournament_matches tm
  LEFT JOIN profiles p1 ON p1.user_id = tm.player1_id
  LEFT JOIN profiles p2 ON p2.user_id = tm.player2_id
  WHERE tm.tournament_id = p_tournament_id 
    AND tm.status IN ('scheduled', 'in_progress');
  
  -- Get recently completed matches
  SELECT jsonb_agg(
    jsonb_build_object(
      'match_id', tm.id,
      'round_number', tm.round_number,
      'match_number', tm.match_number,
      'bracket_type', tm.bracket_type,
      'winner', jsonb_build_object(
        'id', pw.user_id,
        'name', COALESCE(pw.full_name, pw.display_name, 'Unknown')
      ),
      'score_player1', tm.score_player1,
      'score_player2', tm.score_player2,
      'completed_at', tm.updated_at
    )
  ) INTO v_completed_matches
  FROM tournament_matches tm
  LEFT JOIN profiles pw ON pw.user_id = tm.winner_id
  WHERE tm.tournament_id = p_tournament_id 
    AND tm.status = 'completed'
  ORDER BY tm.updated_at DESC
  LIMIT 10;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament', jsonb_build_object(
      'id', v_tournament.id,
      'name', v_tournament.name,
      'status', v_tournament.status,
      'management_status', v_tournament.management_status,
      'tournament_type', v_tournament.tournament_type,
      'max_participants', v_tournament.max_participants,
      'entry_fee', v_tournament.entry_fee,
      'tournament_start', v_tournament.tournament_start
    ),
    'participants', COALESCE(v_participants, '[]'::jsonb),
    'bracket_status', v_bracket_status,
    'current_matches', COALESCE(v_current_matches, '[]'::jsonb),
    'recent_completed', COALESCE(v_completed_matches, '[]'::jsonb)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;