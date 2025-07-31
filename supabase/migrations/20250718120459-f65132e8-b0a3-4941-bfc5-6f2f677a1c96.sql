
-- Create comprehensive single elimination tournament system functions

-- Function to generate real bracket for single elimination tournament
CREATE OR REPLACE FUNCTION public.generate_single_elimination_bracket(p_tournament_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_participants UUID[];
  v_participant_count INTEGER;
  v_round_1_matches INTEGER;
  v_match_id UUID;
  v_round INTEGER := 1;
  v_match_number INTEGER := 1;
  i INTEGER;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Check if bracket already exists
  IF EXISTS (SELECT 1 FROM tournament_matches WHERE tournament_id = p_tournament_id) THEN
    RETURN jsonb_build_object('error', 'Bracket already generated for this tournament');
  END IF;
  
  -- Get confirmed participants
  SELECT ARRAY_AGG(user_id ORDER BY created_at) INTO v_participants
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id 
    AND registration_status = 'confirmed';
  
  v_participant_count := array_length(v_participants, 1);
  
  -- Validate participant count for single elimination
  IF v_participant_count < 4 OR v_participant_count NOT IN (4, 8, 16, 32) THEN
    RETURN jsonb_build_object('error', 'Invalid participant count for single elimination: ' || v_participant_count || '. Must be 4, 8, 16, or 32.');
  END IF;
  
  -- Calculate first round matches
  v_round_1_matches := v_participant_count / 2;
  
  -- Generate Round 1 matches
  FOR i IN 1..v_round_1_matches LOOP
    INSERT INTO tournament_matches (
      tournament_id,
      round_number,
      match_number,
      bracket_type,
      player1_id,
      player2_id,
      status,
      scheduled_time,
      created_at,
      updated_at
    ) VALUES (
      p_tournament_id,
      1,
      i,
      'single_elimination',
      v_participants[i * 2 - 1],  -- Player 1: 1st, 3rd, 5th...
      v_participants[i * 2],      -- Player 2: 2nd, 4th, 6th...
      'scheduled',
      v_tournament.tournament_start,
      NOW(),
      NOW()
    );
  END LOOP;
  
  -- Generate empty matches for subsequent rounds
  v_round := 2;
  v_match_number := 1;
  v_round_1_matches := v_round_1_matches / 2;
  
  WHILE v_round_1_matches >= 1 LOOP
    FOR i IN 1..v_round_1_matches LOOP
      INSERT INTO tournament_matches (
        tournament_id,
        round_number,
        match_number,
        bracket_type,
        status,
        created_at,
        updated_at
      ) VALUES (
        p_tournament_id,
        v_round,
        i,
        'single_elimination',
        'pending',
        NOW(),
        NOW()
      );
    END LOOP;
    
    v_round := v_round + 1;
    v_round_1_matches := v_round_1_matches / 2;
  END LOOP;
  
  -- Update tournament status
  UPDATE tournaments 
  SET status = 'ongoing',
      updated_at = NOW()
  WHERE id = p_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'participant_count', v_participant_count,
    'total_rounds', CASE v_participant_count
      WHEN 4 THEN 2
      WHEN 8 THEN 3
      WHEN 16 THEN 4
      WHEN 32 THEN 5
    END,
    'message', 'Single elimination bracket generated successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to generate bracket: ' || SQLERRM
    );
END;
$$;

-- Fixed function to advance winner with proper bracket logic
CREATE OR REPLACE FUNCTION public.advance_single_elimination_winner(p_match_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_next_match RECORD;
  v_next_round INTEGER;
  v_next_match_number INTEGER;
  v_is_player1_slot BOOLEAN;
  v_max_rounds INTEGER;
BEGIN
  -- Get completed match details
  SELECT * INTO v_match
  FROM tournament_matches 
  WHERE id = p_match_id 
    AND status = 'completed' 
    AND winner_id IS NOT NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found or not completed');
  END IF;
  
  -- Calculate next round and match position
  v_next_round := v_match.round_number + 1;
  v_next_match_number := CEIL(v_match.match_number::NUMERIC / 2);
  
  -- Get max rounds for this tournament
  SELECT MAX(round_number) INTO v_max_rounds
  FROM tournament_matches 
  WHERE tournament_id = v_match.tournament_id;
  
  -- Check if this was the final match
  IF v_match.round_number >= v_max_rounds THEN
    -- This was the final match
    UPDATE tournaments 
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_match.tournament_id;
    
    -- Calculate final results
    PERFORM public.calculate_single_elimination_results(v_match.tournament_id);
    
    RETURN jsonb_build_object(
      'success', true,
      'tournament_complete', true,
      'champion_id', v_match.winner_id,
      'message', 'Tournament completed successfully'
    );
  END IF;
  
  -- Find next round match
  SELECT * INTO v_next_match
  FROM tournament_matches 
  WHERE tournament_id = v_match.tournament_id 
    AND round_number = v_next_round 
    AND match_number = v_next_match_number;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Next round match not found');
  END IF;
  
  -- Determine correct slot based on match pairing logic
  -- For single elimination: match 1,2 -> match 1, match 3,4 -> match 2, etc.
  v_is_player1_slot := (v_match.match_number % 2 = 1);
  
  -- Advance winner to correct slot in next match
  IF v_is_player1_slot THEN
    -- Winner from odd numbered matches goes to player1 slot
    UPDATE tournament_matches 
    SET player1_id = v_match.winner_id,
        status = CASE 
          WHEN player2_id IS NOT NULL AND player2_id != v_match.winner_id THEN 'scheduled'
          ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = v_next_match.id;
  ELSE
    -- Winner from even numbered matches goes to player2 slot
    UPDATE tournament_matches 
    SET player2_id = v_match.winner_id,
        status = CASE 
          WHEN player1_id IS NOT NULL AND player1_id != v_match.winner_id THEN 'scheduled'
          ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = v_next_match.id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'advanced_to_round', v_next_round,
    'advanced_to_match', v_next_match_number,
    'winner_id', v_match.winner_id,
    'slot', CASE WHEN v_is_player1_slot THEN 'player1' ELSE 'player2' END,
    'message', 'Winner advanced to next round'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to advance winner: ' || SQLERRM
    );
END;
$$;

-- Function to calculate final results for single elimination tournament
CREATE OR REPLACE FUNCTION public.calculate_single_elimination_results(p_tournament_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_participant RECORD;
  v_max_round INTEGER;
  v_position INTEGER;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Get maximum round number
  SELECT MAX(round_number) INTO v_max_round
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id;
  
  -- Calculate positions for all participants
  FOR v_participant IN 
    SELECT DISTINCT 
      CASE 
        WHEN tm.player1_id = tr.user_id THEN tm.player1_id
        ELSE tm.player2_id
      END as user_id,
      tr.user_id as registration_user_id,
      MAX(CASE 
        WHEN tm.winner_id = tr.user_id THEN tm.round_number
        ELSE tm.round_number - 1
      END) as elimination_round
    FROM tournament_registrations tr
    LEFT JOIN tournament_matches tm ON 
      (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id)
      AND tm.tournament_id = p_tournament_id
      AND tm.status = 'completed'
    WHERE tr.tournament_id = p_tournament_id 
      AND tr.registration_status = 'confirmed'
    GROUP BY tr.user_id
  LOOP
    -- Calculate final position based on elimination round
    v_position := CASE 
      -- Champion (won final match)
      WHEN v_participant.elimination_round = v_max_round THEN 1
      -- Runner-up (lost final match)
      WHEN v_participant.elimination_round = v_max_round - 1 THEN 2
      -- Semifinal losers
      WHEN v_participant.elimination_round = v_max_round - 2 THEN 3 + FLOOR(RANDOM() * 2)::INTEGER
      -- Quarter-final losers (if applicable)
      WHEN v_participant.elimination_round = v_max_round - 3 THEN 5 + FLOOR(RANDOM() * 4)::INTEGER
      -- First round losers
      ELSE 9 + FLOOR(RANDOM() * 8)::INTEGER
    END;
    
    -- Insert tournament results
    INSERT INTO tournament_results (
      tournament_id,
      user_id,
      final_position,
      matches_played,
      matches_won,
      matches_lost,
      spa_points_earned,
      elo_points_earned,
      prize_money
    )
    SELECT 
      p_tournament_id,
      v_participant.registration_user_id,
      v_position,
      COUNT(tm.id) as matches_played,
      COUNT(CASE WHEN tm.winner_id = v_participant.registration_user_id THEN 1 END) as matches_won,
      COUNT(CASE WHEN tm.winner_id != v_participant.registration_user_id AND tm.status = 'completed' THEN 1 END) as matches_lost,
      -- SPA points based on position and tournament configuration
      CASE 
        WHEN v_position = 1 THEN GREATEST(v_tournament.prize_pool * 0.15 / 1000, 1000)::INTEGER
        WHEN v_position = 2 THEN GREATEST(v_tournament.prize_pool * 0.10 / 1000, 700)::INTEGER
        WHEN v_position <= 4 THEN GREATEST(v_tournament.prize_pool * 0.05 / 1000, 500)::INTEGER
        WHEN v_position <= 8 THEN 300
        ELSE 100
      END as spa_points,
      -- ELO points based on position
      CASE 
        WHEN v_position = 1 THEN 100
        WHEN v_position = 2 THEN 50
        WHEN v_position <= 4 THEN 25
        WHEN v_position <= 8 THEN 12
        ELSE 5
      END as elo_points,
      -- Prize money based on tournament prize pool
      CASE 
        WHEN v_position = 1 THEN v_tournament.prize_pool * 0.50
        WHEN v_position = 2 THEN v_tournament.prize_pool * 0.30
        WHEN v_position = 3 THEN v_tournament.prize_pool * 0.15
        WHEN v_position = 4 THEN v_tournament.prize_pool * 0.05
        ELSE 0
      END as prize_money
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND (tm.player1_id = v_participant.registration_user_id OR tm.player2_id = v_participant.registration_user_id)
      AND tm.status = 'completed'
    ON CONFLICT (tournament_id, user_id) DO UPDATE SET
      final_position = EXCLUDED.final_position,
      matches_played = EXCLUDED.matches_played,
      matches_won = EXCLUDED.matches_won,
      matches_lost = EXCLUDED.matches_lost,
      spa_points_earned = EXCLUDED.spa_points_earned,
      elo_points_earned = EXCLUDED.elo_points_earned,
      prize_money = EXCLUDED.prize_money,
      updated_at = NOW();
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'message', 'Tournament results calculated successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to calculate results: ' || SQLERRM
    );
END;
$$;

-- Trigger to auto-advance winner when match is completed
CREATE OR REPLACE FUNCTION public.auto_advance_tournament_winner()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when match status changes to completed and winner is set
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND 
     (OLD.status IS NULL OR OLD.status != 'completed' OR OLD.winner_id IS NULL) THEN
    
    -- Advance winner to next round
    PERFORM public.advance_single_elimination_winner(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-advancement
DROP TRIGGER IF EXISTS tournament_match_completion_trigger ON tournament_matches;
CREATE TRIGGER tournament_match_completion_trigger
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_advance_tournament_winner();

-- Function to submit match score
CREATE OR REPLACE FUNCTION public.submit_match_score(
  p_match_id UUID,
  p_player1_score INTEGER,
  p_player2_score INTEGER,
  p_submitted_by UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_winner_id UUID;
  v_tournament RECORD;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = v_match.tournament_id;
  
  -- Validate scores
  IF p_player1_score < 0 OR p_player2_score < 0 THEN
    RETURN jsonb_build_object('error', 'Scores cannot be negative');
  END IF;
  
  IF p_player1_score = p_player2_score THEN
    RETURN jsonb_build_object('error', 'Scores cannot be tied in single elimination');
  END IF;
  
  -- Determine winner
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
  ELSE
    v_winner_id := v_match.player2_id;
  END IF;
  
  -- Update match with scores and winner
  UPDATE tournament_matches
  SET 
    score_player1 = p_player1_score,
    score_player2 = p_player2_score,
    winner_id = v_winner_id,
    status = 'completed',
    score_confirmed_by = p_submitted_by,
    score_confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- Log the action
  INSERT INTO automation_performance_log (
    automation_type,
    tournament_id,
    success,
    metadata
  ) VALUES (
    'match_score_submission',
    v_match.tournament_id,
    true,
    jsonb_build_object(
      'match_id', p_match_id,
      'player1_score', p_player1_score,
      'player2_score', p_player2_score,
      'winner_id', v_winner_id,
      'submitted_by', p_submitted_by
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_id', v_winner_id,
    'message', 'Match score submitted successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to submit score: ' || SQLERRM
    );
END;
$$;
