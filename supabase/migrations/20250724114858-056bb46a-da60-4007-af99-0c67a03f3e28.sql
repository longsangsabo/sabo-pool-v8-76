-- Fix generate_double_elimination_bracket_complete to create proper branched losers bracket
CREATE OR REPLACE FUNCTION public.generate_double_elimination_bracket_complete(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_participants RECORD[];
  v_participant_count INTEGER;
  v_bracket_size INTEGER;
  v_wb_rounds INTEGER;
  v_lb_rounds INTEGER;
  v_match_id UUID;
  v_round INTEGER;
  v_match_number INTEGER;
  v_total_matches INTEGER := 0;
  i INTEGER;
  j INTEGER;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Get participants
  SELECT array_agg(ROW(user_id, ROW_NUMBER() OVER (ORDER BY registration_date))::text) 
  INTO v_participants
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id AND registration_status = 'confirmed';
  
  v_participant_count := array_length(v_participants, 1);
  
  IF v_participant_count < 2 THEN
    RETURN jsonb_build_object('error', 'Need at least 2 participants');
  END IF;
  
  -- Calculate bracket size (next power of 2)
  v_bracket_size := 1;
  WHILE v_bracket_size < v_participant_count LOOP
    v_bracket_size := v_bracket_size * 2;
  END LOOP;
  
  v_wb_rounds := CASE 
    WHEN v_bracket_size = 2 THEN 1
    WHEN v_bracket_size = 4 THEN 2  
    WHEN v_bracket_size = 8 THEN 3
    WHEN v_bracket_size = 16 THEN 4
    WHEN v_bracket_size = 32 THEN 5
    ELSE CEIL(LOG(2, v_bracket_size))
  END;
  
  v_lb_rounds := CASE
    WHEN v_bracket_size <= 4 THEN 1
    ELSE (v_wb_rounds - 1) * 2 - 1  -- Standard double elimination formula
  END;
  
  RAISE NOTICE 'Creating double elimination: % participants, % bracket size, % WB rounds, % LB rounds', 
    v_participant_count, v_bracket_size, v_wb_rounds, v_lb_rounds;
  
  -- ========== WINNER'S BRACKET ==========
  v_match_number := 1;
  FOR v_round IN 1..v_wb_rounds LOOP
    DECLARE
      v_matches_in_round INTEGER := v_bracket_size / POWER(2, v_round);
    BEGIN
      FOR j IN 1..v_matches_in_round LOOP
        INSERT INTO tournament_matches (
          id, tournament_id, round_number, match_number,
          bracket_type, branch_type, 
          player1_id, player2_id,
          status, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), p_tournament_id, v_round, v_match_number,
          'winners', NULL,
          CASE 
            WHEN v_round = 1 AND (j * 2 - 1) <= v_participant_count 
            THEN (v_participants[j * 2 - 1]::text::record).f1::uuid
          END,
          CASE 
            WHEN v_round = 1 AND (j * 2) <= v_participant_count 
            THEN (v_participants[j * 2]::text::record).f1::uuid
          END,
          'pending', NOW(), NOW()
        );
        
        v_match_number := v_match_number + 1;
        v_total_matches := v_total_matches + 1;
      END LOOP;
    END;
  END LOOP;
  
  -- ========== LOSER'S BRACKET - BRANCHED STRUCTURE ==========
  
  -- Branch A: Losers from WB Round 1 (8→4→2→1)
  IF v_wb_rounds >= 1 THEN
    DECLARE
      v_wb_r1_losers INTEGER := v_bracket_size / 2; -- 8 losers from WB Round 1
      v_branch_a_rounds INTEGER := CASE 
        WHEN v_wb_r1_losers <= 2 THEN 1
        ELSE CEIL(LOG(2, v_wb_r1_losers))
      END;
    BEGIN
      FOR v_round IN 1..v_branch_a_rounds LOOP
        DECLARE
          v_matches_in_round INTEGER := v_wb_r1_losers / POWER(2, v_round);
        BEGIN
          FOR j IN 1..v_matches_in_round LOOP
            INSERT INTO tournament_matches (
              id, tournament_id, round_number, match_number,
              bracket_type, branch_type,
              status, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), p_tournament_id, v_round, v_match_number,
              'losers', 'branch_a',
              'pending', NOW(), NOW()
            );
            
            v_match_number := v_match_number + 1;
            v_total_matches := v_total_matches + 1;
          END LOOP;
        END;
      END LOOP;
    END;
  END IF;
  
  -- Branch B: Losers from WB Round 2 (4→2→1)
  IF v_wb_rounds >= 2 THEN
    DECLARE
      v_wb_r2_losers INTEGER := v_bracket_size / 4; -- 4 losers from WB Round 2
      v_branch_b_rounds INTEGER := CASE 
        WHEN v_wb_r2_losers <= 2 THEN 1
        ELSE CEIL(LOG(2, v_wb_r2_losers))
      END;
    BEGIN
      FOR v_round IN 1..v_branch_b_rounds LOOP
        DECLARE
          v_matches_in_round INTEGER := v_wb_r2_losers / POWER(2, v_round);
        BEGIN
          FOR j IN 1..v_matches_in_round LOOP
            INSERT INTO tournament_matches (
              id, tournament_id, round_number, match_number,
              bracket_type, branch_type,
              status, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), p_tournament_id, v_round, v_match_number,
              'losers', 'branch_b',
              'pending', NOW(), NOW()
            );
            
            v_match_number := v_match_number + 1;
            v_total_matches := v_total_matches + 1;
          END LOOP;
        END;
      END LOOP;
    END;
  END IF;
  
  -- ========== SEMIFINAL STAGE (4 người: 2 từ WB + 2 từ LB) ==========
  FOR j IN 1..2 LOOP
    INSERT INTO tournament_matches (
      id, tournament_id, round_number, match_number,
      bracket_type, branch_type,
      status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), p_tournament_id, v_wb_rounds + v_lb_rounds + 1, v_match_number,
      'semifinal', NULL,
      'pending', NOW(), NOW()
    );
    
    v_match_number := v_match_number + 1;
    v_total_matches := v_total_matches + 1;
  END LOOP;
  
  -- ========== GRAND FINAL ==========
  INSERT INTO tournament_matches (
    id, tournament_id, round_number, match_number,
    bracket_type, branch_type,
    status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_tournament_id, v_wb_rounds + v_lb_rounds + 2, v_match_number,
    'grand_final', NULL,
    'pending', NOW(), NOW()
  );
  
  v_total_matches := v_total_matches + 1;
  
  -- ========== GRAND FINAL RESET (if needed) ==========
  INSERT INTO tournament_matches (
    id, tournament_id, round_number, match_number,
    bracket_type, branch_type,
    status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_tournament_id, v_wb_rounds + v_lb_rounds + 3, v_match_number + 1,
    'grand_final_reset', NULL,
    'pending', NOW(), NOW()
  );
  
  v_total_matches := v_total_matches + 1;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'participant_count', v_participant_count,
    'bracket_size', v_bracket_size,
    'total_matches', v_total_matches,
    'winners_bracket_rounds', v_wb_rounds,
    'losers_bracket_rounds', v_lb_rounds,
    'bracket_structure', jsonb_build_object(
      'winners_bracket', v_bracket_size / 2,
      'losers_branch_a', v_bracket_size / 4,
      'losers_branch_b', v_bracket_size / 8,
      'semifinal', 2,
      'grand_final', 1,
      'grand_final_reset', 1
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Failed to generate bracket: %s', SQLERRM)
    );
END;
$function$;

-- Create comprehensive auto-advancement function for branched double elimination
CREATE OR REPLACE FUNCTION public.advance_double_elimination_winner_branched(p_match_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_match RECORD;
  v_winner_id UUID;
  v_loser_id UUID;
  v_next_winner_match UUID;
  v_next_loser_match UUID;
  v_advancement_result JSONB := jsonb_build_object();
BEGIN
  -- Get match details
  SELECT * INTO v_match 
  FROM tournament_matches 
  WHERE id = p_match_id AND status = 'completed' AND winner_id IS NOT NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found or not completed');
  END IF;
  
  v_winner_id := v_match.winner_id;
  v_loser_id := CASE 
    WHEN v_match.player1_id = v_winner_id THEN v_match.player2_id 
    ELSE v_match.player1_id 
  END;
  
  -- WINNER'S BRACKET ADVANCEMENT
  IF v_match.bracket_type = 'winners' THEN
    -- Advance winner to next round in winners bracket
    SELECT id INTO v_next_winner_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'winners'
      AND round_number = v_match.round_number + 1
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF v_next_winner_match IS NOT NULL THEN
      UPDATE tournament_matches 
      SET player1_id = COALESCE(player1_id, v_winner_id),
          player2_id = CASE WHEN player1_id IS NULL THEN player2_id ELSE COALESCE(player2_id, v_winner_id) END,
          updated_at = NOW()
      WHERE id = v_next_winner_match;
      
      v_advancement_result := v_advancement_result || jsonb_build_object('winner_advanced', true);
    END IF;
    
    -- Place loser in appropriate branch
    IF v_match.round_number = 1 THEN
      -- Loser goes to Branch A
      SELECT id INTO v_next_loser_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'losers'
        AND branch_type = 'branch_a'
        AND round_number = 1
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
    ELSIF v_match.round_number = 2 THEN
      -- Loser goes to Branch B
      SELECT id INTO v_next_loser_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'losers'
        AND branch_type = 'branch_b'
        AND round_number = 1
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
    END IF;
    
    IF v_next_loser_match IS NOT NULL THEN
      UPDATE tournament_matches 
      SET player1_id = COALESCE(player1_id, v_loser_id),
          player2_id = CASE WHEN player1_id IS NULL THEN player2_id ELSE COALESCE(player2_id, v_loser_id) END,
          updated_at = NOW()
      WHERE id = v_next_loser_match;
      
      v_advancement_result := v_advancement_result || jsonb_build_object('loser_placed', true);
    END IF;
    
  -- LOSER'S BRACKET ADVANCEMENT
  ELSIF v_match.bracket_type = 'losers' THEN
    -- Advance winner within losers bracket
    IF v_match.branch_type = 'branch_a' THEN
      SELECT id INTO v_next_winner_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'losers'
        AND branch_type = 'branch_a'
        AND round_number = v_match.round_number + 1
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
    ELSIF v_match.branch_type = 'branch_b' THEN
      SELECT id INTO v_next_winner_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'losers'
        AND branch_type = 'branch_b'
        AND round_number = v_match.round_number + 1
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
    END IF;
    
    -- If no more matches in branch, advance to semifinal
    IF v_next_winner_match IS NULL THEN
      SELECT id INTO v_next_winner_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'semifinal'
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
    END IF;
    
    IF v_next_winner_match IS NOT NULL THEN
      UPDATE tournament_matches 
      SET player1_id = COALESCE(player1_id, v_winner_id),
          player2_id = CASE WHEN player1_id IS NULL THEN player2_id ELSE COALESCE(player2_id, v_winner_id) END,
          updated_at = NOW()
      WHERE id = v_next_winner_match;
      
      v_advancement_result := v_advancement_result || jsonb_build_object('winner_advanced', true);
    END IF;
    
  -- SEMIFINAL ADVANCEMENT
  ELSIF v_match.bracket_type = 'semifinal' THEN
    SELECT id INTO v_next_winner_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'grand_final'
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF v_next_winner_match IS NOT NULL THEN
      UPDATE tournament_matches 
      SET player1_id = COALESCE(player1_id, v_winner_id),
          player2_id = CASE WHEN player1_id IS NULL THEN player2_id ELSE COALESCE(player2_id, v_winner_id) END,
          updated_at = NOW()
      WHERE id = v_next_winner_match;
      
      v_advancement_result := v_advancement_result || jsonb_build_object('winner_advanced', true);
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'bracket_type', v_match.bracket_type,
    'branch_type', v_match.branch_type,
    'winner_id', v_winner_id,
    'loser_id', v_loser_id
  ) || v_advancement_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Auto-advancement failed: %s', SQLERRM)
    );
END;
$function$;

-- Create trigger for auto-advancement using branched logic
CREATE OR REPLACE FUNCTION public.trigger_branched_auto_advance_winner()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  -- Only trigger when a winner is set (new winner_id and status completed)
  IF NEW.status = 'completed' 
     AND NEW.winner_id IS NOT NULL 
     AND (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
    
    -- Log the automatic advancement
    RAISE NOTICE 'Branched auto-advancing winner % for match % in tournament %', 
      NEW.winner_id, NEW.id, NEW.tournament_id;
    
    -- Call the branched advancement function
    BEGIN
      SELECT public.advance_double_elimination_winner_branched(NEW.id) INTO v_result;
      RAISE NOTICE 'Branched advancement result: %', v_result;
      
      -- Log to automation table
      INSERT INTO public.tournament_automation_log (
        tournament_id, automation_type, status, details, completed_at
      ) VALUES (
        NEW.tournament_id, 'branched_auto_advancement', 'completed',
        jsonb_build_object(
          'match_id', NEW.id,
          'winner_id', NEW.winner_id,
          'bracket_type', NEW.bracket_type,
          'branch_type', NEW.branch_type,
          'advancement_result', v_result
        ),
        NOW()
      );
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to auto-advance winner for match %: %', NEW.id, SQLERRM;
        
        -- Log failed automation
        INSERT INTO public.tournament_automation_log (
          tournament_id, automation_type, status, error_message, created_at
        ) VALUES (
          NEW.tournament_id, 'branched_auto_advancement', 'failed', SQLERRM, NOW()
        );
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Drop existing trigger and create new one
DROP TRIGGER IF EXISTS trigger_tournament_match_completion ON tournament_matches;

CREATE TRIGGER trigger_branched_tournament_match_completion
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_branched_auto_advance_winner();