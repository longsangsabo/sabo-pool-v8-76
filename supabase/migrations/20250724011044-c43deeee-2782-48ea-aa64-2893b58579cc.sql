-- Step 1: Fix tournament boda3 structure - Create missing Round 3 matches
-- Current: Only has 1 Round 3 match, should have 2 (4 Round 2 winners / 2 = 2 semifinals)

INSERT INTO tournament_matches (
  tournament_id, round_number, match_number, 
  status, created_at, updated_at
) VALUES 
-- Semifinal Match 2: Winners from Round 2 matches 3 & 4
('80043ef4-a833-43aa-a01b-4dec2a32ea16', 3, 2, 'pending', now(), now());

-- Step 2: Fix auto-advancement logic - Enhanced function with correct math
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
  v_participant_count INTEGER;
  v_expected_rounds INTEGER;
  v_current_round_completed BOOLEAN;
  v_current_round_matches INTEGER;
  v_next_round_matches INTEGER;
  i INTEGER;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF v_match IS NULL THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;

  IF v_match.winner_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No winner set for this match');
  END IF;

  -- Get tournament details and participant count
  SELECT t.*, COUNT(tr.user_id) as participant_count INTO v_tournament
  FROM tournaments t
  LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id AND tr.registration_status = 'confirmed'
  WHERE t.id = v_match.tournament_id
  GROUP BY t.id;

  v_participant_count := COALESCE(v_tournament.participant_count, 0);
  
  -- Calculate expected rounds: ceil(log2(participants))
  v_expected_rounds := CEIL(LOG(2, GREATEST(v_participant_count, 2)));
  
  -- Get actual max round number from existing matches
  SELECT MAX(round_number) INTO v_total_rounds
  FROM tournament_matches 
  WHERE tournament_id = v_match.tournament_id;

  -- Check if current round is completed (all matches have winners)
  SELECT COUNT(*) = 0 INTO v_current_round_completed
  FROM tournament_matches
  WHERE tournament_id = v_match.tournament_id
  AND round_number = v_match.round_number
  AND (winner_id IS NULL OR status != 'completed');

  -- If this is the final expected round and round is completed, tournament is done
  IF v_match.round_number >= v_expected_rounds AND v_current_round_completed THEN
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

  -- Calculate next round details
  v_next_match_number := CEIL(v_match.match_number::DECIMAL / 2);
  v_slot_position := CASE WHEN v_match.match_number % 2 = 1 THEN 'player1_id' ELSE 'player2_id' END;

  -- Get current round match count
  SELECT COUNT(*) INTO v_current_round_matches
  FROM tournament_matches
  WHERE tournament_id = v_match.tournament_id
  AND round_number = v_match.round_number;

  -- Calculate expected next round matches
  v_next_round_matches := CEIL(v_current_round_matches::DECIMAL / 2);

  -- If next round doesn't exist, create it
  IF v_match.round_number = v_total_rounds THEN
    -- Create all next round matches
    FOR i IN 1..v_next_round_matches LOOP
      INSERT INTO tournament_matches (
        tournament_id,
        round_number,
        match_number,
        status,
        created_at,
        updated_at
      ) VALUES (
        v_match.tournament_id,
        v_match.round_number + 1,
        i,
        'pending',
        NOW(),
        NOW()
      );
    END LOOP;

    RAISE NOTICE 'Created % matches for round %', v_next_round_matches, v_match.round_number + 1;
  END IF;

  -- Find the next round match
  SELECT * INTO v_next_match
  FROM tournament_matches
  WHERE tournament_id = v_match.tournament_id
  AND round_number = v_match.round_number + 1
  AND match_number = v_next_match_number;
  
  IF v_next_match IS NULL THEN
    RETURN jsonb_build_object('error', 'Next round match not found after creation');
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

-- Step 3: Reset tournament status and run progression repair
UPDATE tournaments 
SET status = 'ongoing', completed_at = NULL, updated_at = NOW()
WHERE id = '80043ef4-a833-43aa-a01b-4dec2a32ea16';

-- Run progression repair for boda3
SELECT public.fix_all_tournament_progression('80043ef4-a833-43aa-a01b-4dec2a32ea16'::uuid);

-- Step 4: Enhanced tournament completion trigger
CREATE OR REPLACE FUNCTION public.enhanced_tournament_completion_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_final_round INTEGER;
  v_final_matches_completed INTEGER;
  v_tournament_status TEXT;
  v_champion_id UUID;
  v_participant_count INTEGER;
  v_expected_rounds INTEGER;
BEGIN
  -- Get current tournament status
  SELECT status INTO v_tournament_status
  FROM tournaments 
  WHERE id = NEW.tournament_id;
  
  -- Only check completion for ongoing tournaments
  IF v_tournament_status != 'ongoing' THEN
    RETURN NEW;
  END IF;
  
  -- Get participant count and calculate expected rounds
  SELECT COUNT(tr.user_id) INTO v_participant_count
  FROM tournament_registrations tr
  WHERE tr.tournament_id = NEW.tournament_id AND tr.registration_status = 'confirmed';
  
  v_expected_rounds := CEIL(LOG(2, GREATEST(v_participant_count, 2)));
  
  -- Get actual final round number
  SELECT MAX(round_number) INTO v_final_round
  FROM tournament_matches 
  WHERE tournament_id = NEW.tournament_id;
  
  -- Use the higher of expected or actual rounds
  v_final_round := GREATEST(v_final_round, v_expected_rounds);
  
  -- Check if ALL final round matches are completed with winners
  SELECT COUNT(*) INTO v_final_matches_completed
  FROM tournament_matches 
  WHERE tournament_id = NEW.tournament_id 
  AND round_number = v_final_round 
  AND status = 'completed' 
  AND winner_id IS NOT NULL;
  
  -- Get total final round matches that should exist
  DECLARE
    v_total_final_matches INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_total_final_matches
    FROM tournament_matches 
    WHERE tournament_id = NEW.tournament_id 
    AND round_number = v_final_round;
    
    -- If all final round matches are completed, mark tournament as completed
    IF v_final_matches_completed > 0 AND v_final_matches_completed = v_total_final_matches THEN
      -- Get the champion (winner of match 1 in final round)
      SELECT winner_id INTO v_champion_id
      FROM tournament_matches 
      WHERE tournament_id = NEW.tournament_id 
      AND round_number = v_final_round 
      AND match_number = 1
      AND winner_id IS NOT NULL;
      
      UPDATE tournaments 
      SET status = 'completed',
          completed_at = NOW(),
          updated_at = NOW()
      WHERE id = NEW.tournament_id
      AND status != 'completed';
      
      RAISE NOTICE 'Tournament % automatically completed - champion: %', NEW.tournament_id, v_champion_id;
      
      -- Log tournament completion
      INSERT INTO public.tournament_automation_log (
        tournament_id, automation_type, status, details, completed_at
      ) VALUES (
        NEW.tournament_id, 'tournament_completion', 'completed',
        jsonb_build_object(
          'champion_id', v_champion_id,
          'completion_trigger', 'all_final_matches_completed',
          'final_round', v_final_round,
          'completed_matches', v_final_matches_completed
        ),
        NOW()
      );
      
      -- Process tournament completion (award points, etc.)
      PERFORM public.process_tournament_completion(NEW.tournament_id);
    END IF;
  END;
  
  RETURN NEW;
END;
$function$;

-- Step 5: Create comprehensive tournament results calculation
CREATE OR REPLACE FUNCTION public.process_tournament_completion(p_tournament_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_result JSONB;
  v_final_round INTEGER;
  v_champion_id UUID;
  v_runner_up_id UUID;
  v_semifinalists UUID[];
  v_position INTEGER;
  v_participant RECORD;
  v_base_spa_points INTEGER := 100;
  v_base_elo_points INTEGER := 50;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF v_tournament IS NULL THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Clear existing results
  DELETE FROM tournament_results WHERE tournament_id = p_tournament_id;
  
  -- Get final round
  SELECT MAX(round_number) INTO v_final_round
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id;
  
  -- Get champion (winner of final match)
  SELECT winner_id INTO v_champion_id
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
  AND round_number = v_final_round 
  AND match_number = 1;
  
  -- Get runner-up (loser of final match)
  SELECT CASE WHEN player1_id = v_champion_id THEN player2_id ELSE player1_id END
  INTO v_runner_up_id
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
  AND round_number = v_final_round 
  AND match_number = 1;
  
  -- Award 1st place
  IF v_champion_id IS NOT NULL THEN
    INSERT INTO tournament_results (
      tournament_id, user_id, position, points_earned, prize_amount, 
      placement_type, created_at, updated_at
    ) VALUES (
      p_tournament_id, v_champion_id, 1, v_base_spa_points * 5, 
      COALESCE(v_tournament.prize_pool * 0.5, 0), 'final', NOW(), NOW()
    );
    
    -- Update player rankings
    UPDATE player_rankings 
    SET spa_points = spa_points + (v_base_spa_points * 5),
        elo_points = elo_points + (v_base_elo_points * 2),
        wins = wins + 1,
        updated_at = NOW()
    WHERE user_id = v_champion_id;
  END IF;
  
  -- Award 2nd place
  IF v_runner_up_id IS NOT NULL THEN
    INSERT INTO tournament_results (
      tournament_id, user_id, position, points_earned, prize_amount, 
      placement_type, created_at, updated_at
    ) VALUES (
      p_tournament_id, v_runner_up_id, 2, v_base_spa_points * 3, 
      COALESCE(v_tournament.prize_pool * 0.3, 0), 'final', NOW(), NOW()
    );
    
    -- Update player rankings
    UPDATE player_rankings 
    SET spa_points = spa_points + (v_base_spa_points * 3),
        elo_points = elo_points + v_base_elo_points,
        updated_at = NOW()
    WHERE user_id = v_runner_up_id;
  END IF;
  
  -- Get semifinalists (losers of semifinal matches)
  IF v_final_round > 1 THEN
    SELECT array_agg(
      CASE WHEN player1_id != winner_id THEN player1_id ELSE player2_id END
    ) INTO v_semifinalists
    FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
    AND round_number = v_final_round - 1
    AND winner_id IS NOT NULL;
    
    -- Award 3rd/4th place to semifinalists
    FOR i IN 1..array_length(v_semifinalists, 1) LOOP
      INSERT INTO tournament_results (
        tournament_id, user_id, position, points_earned, prize_amount, 
        placement_type, created_at, updated_at
      ) VALUES (
        p_tournament_id, v_semifinalists[i], 2 + i, v_base_spa_points * 2, 
        COALESCE(v_tournament.prize_pool * 0.1, 0), 'semifinal', NOW(), NOW()
      );
      
      -- Update player rankings
      UPDATE player_rankings 
      SET spa_points = spa_points + (v_base_spa_points * 2),
          updated_at = NOW()
      WHERE user_id = v_semifinalists[i];
    END LOOP;
  END IF;
  
  -- Award participation points to remaining players
  v_position := 5;
  FOR v_participant IN
    SELECT DISTINCT user_id 
    FROM tournament_registrations 
    WHERE tournament_id = p_tournament_id 
    AND registration_status = 'confirmed'
    AND user_id NOT IN (
      SELECT user_id FROM tournament_results WHERE tournament_id = p_tournament_id
    )
  LOOP
    INSERT INTO tournament_results (
      tournament_id, user_id, position, points_earned, prize_amount, 
      placement_type, created_at, updated_at
    ) VALUES (
      p_tournament_id, v_participant.user_id, v_position, v_base_spa_points, 
      0, 'participation', NOW(), NOW()
    );
    
    -- Update player rankings
    UPDATE player_rankings 
    SET spa_points = spa_points + v_base_spa_points,
        total_matches = total_matches + 1,
        updated_at = NOW()
    WHERE user_id = v_participant.user_id;
    
    v_position := v_position + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'champion_id', v_champion_id,
    'runner_up_id', v_runner_up_id,
    'semifinalists', v_semifinalists,
    'results_created', true
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Failed to process tournament completion: %s', SQLERRM)
    );
END;
$function$;

-- Ensure the trigger is active
DROP TRIGGER IF EXISTS enhanced_tournament_completion ON tournament_matches;
CREATE TRIGGER enhanced_tournament_completion
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION enhanced_tournament_completion_trigger();