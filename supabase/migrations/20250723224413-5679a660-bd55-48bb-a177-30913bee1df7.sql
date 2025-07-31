-- Fix advance_winner_to_next_round_enhanced function to properly handle tournament progression
-- The issue is that the function is checking MAX(round_number) from existing matches only
-- For a 16-player tournament, we need 4 rounds total, but only round 1 exists initially

CREATE OR REPLACE FUNCTION public.advance_winner_to_next_round_enhanced(p_match_id uuid, p_force_advance boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_match RECORD;
  v_next_match RECORD;
  v_tournament RECORD;
  v_next_match_number INTEGER;
  v_slot_position TEXT;
  v_total_rounds INTEGER;
  v_expected_rounds INTEGER;
  v_current_round_completed BOOLEAN;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF v_match IS NULL THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;

  IF v_match.winner_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No winner set for this match');
  END IF;

  -- Get tournament details and count total participants
  SELECT t.*, COUNT(tr.user_id) as participant_count INTO v_tournament
  FROM tournaments t
  LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id AND tr.registration_status = 'confirmed'
  WHERE t.id = v_match.tournament_id
  GROUP BY t.id;

  -- Calculate expected number of rounds based on participant count
  -- For single elimination: rounds = ceil(log2(participants))
  v_expected_rounds := CEIL(LOG(2, v_tournament.participant_count));
  
  -- Get actual max round number from existing matches
  SELECT MAX(round_number) INTO v_total_rounds
  FROM tournament_matches 
  WHERE tournament_id = v_match.tournament_id;

  RAISE NOTICE 'Tournament has % participants, expected % rounds, current max round is %', 
    v_tournament.participant_count, v_expected_rounds, v_total_rounds;

  -- Check if current round is completed (all matches have winners)
  SELECT COUNT(*) = 0 INTO v_current_round_completed
  FROM tournament_matches
  WHERE tournament_id = v_match.tournament_id
  AND round_number = v_match.round_number
  AND (winner_id IS NULL OR status != 'completed');

  -- If this is the last expected round and round is completed, tournament is done
  IF v_match.round_number = v_expected_rounds AND v_current_round_completed THEN
    UPDATE tournaments 
    SET status = 'completed', completed_at = NOW(), updated_at = NOW()
    WHERE id = v_match.tournament_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Tournament completed',
      'tournament_winner', v_match.winner_id,
      'is_final_match', true,
      'tournament_completed', true
    );
  END IF;

  -- If we need to create the next round (doesn't exist yet)
  IF v_match.round_number = v_total_rounds THEN
    -- Create next round matches
    DECLARE
      v_round_winners uuid[];
      v_next_round_matches INTEGER;
      i INTEGER;
    BEGIN
      -- Get all winners from current round
      SELECT array_agg(winner_id ORDER BY match_number) INTO v_round_winners
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
      AND round_number = v_match.round_number
      AND winner_id IS NOT NULL;

      -- Calculate number of matches for next round
      v_next_round_matches := CEIL(array_length(v_round_winners, 1)::DECIMAL / 2);

      -- Create next round matches
      FOR i IN 1..v_next_round_matches LOOP
        INSERT INTO tournament_matches (
          tournament_id,
          round_number,
          match_number,
          player1_id,
          player2_id,
          status,
          created_at,
          updated_at
        ) VALUES (
          v_match.tournament_id,
          v_match.round_number + 1,
          i,
          CASE WHEN (i-1)*2+1 <= array_length(v_round_winners, 1) THEN v_round_winners[(i-1)*2+1] ELSE NULL END,
          CASE WHEN (i-1)*2+2 <= array_length(v_round_winners, 1) THEN v_round_winners[(i-1)*2+2] ELSE NULL END,
          CASE WHEN (i-1)*2+2 <= array_length(v_round_winners, 1) THEN 'scheduled' ELSE 'pending' END,
          NOW(),
          NOW()
        );
      END LOOP;

      RAISE NOTICE 'Created % matches for round %', v_next_round_matches, v_match.round_number + 1;
    END;
  END IF;

  -- Now advance winner to next match
  v_next_match_number := CEIL(v_match.match_number::DECIMAL / 2);
  v_slot_position := CASE WHEN v_match.match_number % 2 = 1 THEN 'player1_id' ELSE 'player2_id' END;
  
  -- Find the next round match
  SELECT * INTO v_next_match
  FROM tournament_matches
  WHERE tournament_id = v_match.tournament_id
  AND round_number = v_match.round_number + 1
  AND match_number = v_next_match_number;
  
  IF v_next_match IS NULL THEN
    RETURN jsonb_build_object('error', 'Next round match not found');
  END IF;

  -- Advance winner to next match
  IF v_slot_position = 'player1_id' THEN
    UPDATE tournament_matches
    SET player1_id = v_match.winner_id,
        status = CASE 
          WHEN player2_id IS NOT NULL THEN 'scheduled'
          ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = v_next_match.id;
  ELSE
    UPDATE tournament_matches
    SET player2_id = v_match.winner_id,
        status = CASE 
          WHEN player1_id IS NOT NULL THEN 'scheduled'
          ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = v_next_match.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'winner_advanced', true,
    'next_match_id', v_next_match.id,
    'slot_position', v_slot_position,
    'winner_id', v_match.winner_id,
    'advanced_to_round', v_match.round_number + 1,
    'advanced_to_match', v_next_match_number,
    'is_final_match', false,
    'tournament_completed', false,
    'expected_rounds', v_expected_rounds,
    'current_round', v_match.round_number
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Failed to advance winner: %s', SQLERRM)
    );
END;
$function$;