-- Clean up broken double elimination system and implement modified version - Fixed approach

-- 1. First, add necessary columns without any data modifications
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS current_phase TEXT DEFAULT 'single_elimination',
ADD COLUMN IF NOT EXISTS top4_qualified JSONB DEFAULT NULL;

-- 2. Add bracket_type column to tournament_matches if not exists
ALTER TABLE tournament_matches 
ADD COLUMN IF NOT EXISTS bracket_type TEXT DEFAULT 'single';

-- 3. Create enum for tournament phases (if not exists)
DO $$ BEGIN
  CREATE TYPE tournament_phase AS ENUM ('double_elimination', 'single_elimination_top4', 'completed', 'single_elimination');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. Update existing tournament phases to use enum
UPDATE tournaments SET current_phase = 'single_elimination' WHERE current_phase IS NULL;
ALTER TABLE tournaments 
ALTER COLUMN current_phase TYPE tournament_phase USING current_phase::tournament_phase;

-- 5. Update existing matches to have proper bracket_type
UPDATE tournament_matches 
SET bracket_type = 'single' 
WHERE bracket_type IS NULL;

-- 6. Create function to generate modified double elimination bracket
CREATE OR REPLACE FUNCTION generate_modified_double_elimination(
  p_tournament_id UUID,
  p_participants UUID[]
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_participant_count INTEGER;
  v_bracket_data JSONB;
  i INTEGER;
BEGIN
  v_participant_count := array_length(p_participants, 1);
  
  IF v_participant_count != 16 THEN
    RETURN jsonb_build_object('error', 'Modified DE requires exactly 16 participants');
  END IF;
  
  -- Clear existing matches for this tournament
  DELETE FROM public.tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- PHASE 1: WINNER BRACKET (16 → 8 → 4 → 2)
  -- WB Round 1: 16 → 8 (8 matches)
  FOR i IN 0..7 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, i + 1,
      p_participants[i * 2 + 1], p_participants[i * 2 + 2], 
      'scheduled', 'winner',
      now(), now()
    );
  END LOOP;
  
  -- WB Round 2: 8 → 4 (4 matches)
  FOR i IN 0..3 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 2, i + 1,
      NULL, NULL, 'pending', 'winner',
      now(), now()
    );
  END LOOP;
  
  -- WB Round 3: 4 → 2 (2 matches)
  FOR i IN 0..1 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 3, i + 1,
      NULL, NULL, 'pending', 'winner',
      now(), now()
    );
  END LOOP;
  
  -- PHASE 1: LOSER BRACKET (Collect losers → 2 survivors)
  -- LB Round 1: 8 losers from WB-R1 (4 matches)
  FOR i IN 0..3 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, i + 1,
      NULL, NULL, 'pending', 'loser',
      now(), now()
    );
  END LOOP;
  
  -- LB Round 2: 4 survivors + 4 losers from WB-R2 (4 matches)
  FOR i IN 0..3 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 2, i + 1,
      NULL, NULL, 'pending', 'loser',
      now(), now()
    );
  END LOOP;
  
  -- LB Round 3: 4 survivors + 2 losers from WB-R3 (3 matches)
  FOR i IN 0..2 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 3, i + 1,
      NULL, NULL, 'pending', 'loser',
      now(), now()
    );
  END LOOP;
  
  -- LB Final: Last 3 → 2 survivors
  INSERT INTO public.tournament_matches (
    tournament_id, round_number, match_number,
    player1_id, player2_id, status, bracket_type,
    created_at, updated_at
  ) VALUES (
    p_tournament_id, 4, 1,
    NULL, NULL, 'pending', 'loser',
    now(), now()
  );
  
  -- PHASE 2: SINGLE ELIMINATION (Top 4 → Champion)
  -- Semifinals: 4 → 2 (2 matches)
  FOR i IN 0..1 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, i + 1,
      NULL, NULL, 'pending', 'single_elimination',
      now(), now()
    );
  END LOOP;
  
  -- Final: 2 → 1 champion
  INSERT INTO public.tournament_matches (
    tournament_id, round_number, match_number,
    player1_id, player2_id, status, bracket_type,
    created_at, updated_at
  ) VALUES (
    p_tournament_id, 2, 1,
    NULL, NULL, 'pending', 'single_elimination',
    now(), now()
  );
  
  -- Update tournament status
  UPDATE public.tournaments
  SET status = 'in_progress',
      current_phase = 'double_elimination',
      has_bracket = true,
      updated_at = now()
  WHERE id = p_tournament_id;
  
  -- Create bracket data
  v_bracket_data := jsonb_build_object(
    'tournament_id', p_tournament_id,
    'type', 'modified_double_elimination',
    'current_phase', 'double_elimination',
    'participants_count', v_participant_count,
    'generated_at', now()
  );
  
  -- Store bracket
  INSERT INTO public.tournament_brackets (tournament_id, bracket_data, created_at)
  VALUES (p_tournament_id, v_bracket_data, now())
  ON CONFLICT (tournament_id) 
  DO UPDATE SET 
    bracket_data = EXCLUDED.bracket_data,
    updated_at = now();
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'bracket_type', 'modified_double_elimination',
    'total_matches', (
      SELECT COUNT(*) FROM public.tournament_matches 
      WHERE tournament_id = p_tournament_id
    ),
    'message', 'Modified double elimination bracket generated'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 7. Create advancement function for modified DE
CREATE OR REPLACE FUNCTION advance_modified_de_player(
  p_match_id UUID,
  p_winner_id UUID,
  p_loser_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_match RECORD;
  v_tournament RECORD;
  v_next_match_id UUID;
  v_wb_winners UUID[];
  v_lb_winners UUID[];
BEGIN
  -- Get match and tournament details
  SELECT * INTO v_match FROM public.tournament_matches WHERE id = p_match_id;
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = v_match.tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Update match result
  UPDATE public.tournament_matches
  SET winner_id = p_winner_id, loser_id = p_loser_id, 
      status = 'completed', updated_at = now()
  WHERE id = p_match_id;
  
  -- Handle different phases
  IF v_tournament.current_phase = 'double_elimination' THEN
    
    -- Winner Bracket advancement
    IF v_match.bracket_type = 'winner' THEN
      SELECT id INTO v_next_match_id
      FROM public.tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'winner'
        AND round_number = v_match.round_number + 1
        AND match_number = CEIL(v_match.match_number / 2.0)
        AND status = 'pending';
      
      IF v_next_match_id IS NOT NULL THEN
        IF v_match.match_number % 2 = 1 THEN
          UPDATE public.tournament_matches
          SET player1_id = p_winner_id, updated_at = now()
          WHERE id = v_next_match_id;
        ELSE
          UPDATE public.tournament_matches
          SET player2_id = p_winner_id, updated_at = now()
          WHERE id = v_next_match_id;
        END IF;
      END IF;
      
    -- Loser Bracket advancement
    ELSIF v_match.bracket_type = 'loser' THEN
      SELECT id INTO v_next_match_id
      FROM public.tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'loser'
        AND round_number = v_match.round_number + 1
        AND status = 'pending'
      LIMIT 1;
      
      IF v_next_match_id IS NOT NULL THEN
        UPDATE public.tournament_matches
        SET player1_id = COALESCE(player1_id, p_winner_id),
            player2_id = CASE WHEN player1_id IS NOT NULL THEN p_winner_id ELSE player2_id END,
            updated_at = now()
        WHERE id = v_next_match_id;
      END IF;
    END IF;
    
    -- Check for Top 4 transition
    SELECT ARRAY_AGG(winner_id) INTO v_wb_winners
    FROM public.tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'winner' AND round_number = 3 AND winner_id IS NOT NULL;
    
    SELECT ARRAY_AGG(winner_id) INTO v_lb_winners
    FROM public.tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'loser' AND round_number = 4 AND winner_id IS NOT NULL;
    
    IF array_length(v_wb_winners, 1) = 2 AND array_length(v_lb_winners, 1) = 2 THEN
      -- Transition to Single Elimination Top 4
      UPDATE public.tournaments
      SET current_phase = 'single_elimination_top4',
          top4_qualified = jsonb_build_object('wb_players', v_wb_winners, 'lb_players', v_lb_winners),
          updated_at = now()
      WHERE id = v_match.tournament_id;
      
      -- Setup semifinals
      UPDATE public.tournament_matches
      SET player1_id = v_wb_winners[1], player2_id = v_lb_winners[1], status = 'scheduled'
      WHERE tournament_id = v_match.tournament_id AND bracket_type = 'single_elimination' 
        AND round_number = 1 AND match_number = 1;
      
      UPDATE public.tournament_matches
      SET player1_id = v_wb_winners[2], player2_id = v_lb_winners[2], status = 'scheduled'
      WHERE tournament_id = v_match.tournament_id AND bracket_type = 'single_elimination' 
        AND round_number = 1 AND match_number = 2;
    END IF;
    
  ELSIF v_tournament.current_phase = 'single_elimination_top4' THEN
    -- Single elimination advancement
    IF v_match.round_number = 1 THEN
      SELECT id INTO v_next_match_id
      FROM public.tournament_matches
      WHERE tournament_id = v_match.tournament_id AND bracket_type = 'single_elimination' AND round_number = 2;
      
      IF v_match.match_number = 1 THEN
        UPDATE public.tournament_matches SET player1_id = p_winner_id WHERE id = v_next_match_id;
      ELSE
        UPDATE public.tournament_matches SET player2_id = p_winner_id WHERE id = v_next_match_id;
      END IF;
      
    ELSIF v_match.round_number = 2 THEN
      UPDATE public.tournaments SET current_phase = 'completed', status = 'completed' WHERE id = v_match.tournament_id;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_id', p_winner_id,
    'phase', v_tournament.current_phase
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;