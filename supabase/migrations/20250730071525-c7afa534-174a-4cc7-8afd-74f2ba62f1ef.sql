-- COMPREHENSIVE DOUBLE1 ADVANCEMENT RULES FIX
-- Step 1: Clean existing incorrect rules
DELETE FROM public.double1_advancement_rules;

-- Step 2: Insert the 27 correct SABO advancement rules

-- WINNERS BRACKET ADVANCEMENT (14 rules)
-- Round 1 → Round 2 (8 rules)
INSERT INTO public.double1_advancement_rules (from_bracket, from_round, from_match, player_role, to_bracket, to_round, to_match, to_position) VALUES
('winners', 1, 1, 'winner', 'winners', 2, 1, 'player1'),
('winners', 1, 2, 'winner', 'winners', 2, 1, 'player2'),
('winners', 1, 3, 'winner', 'winners', 2, 2, 'player1'),
('winners', 1, 4, 'winner', 'winners', 2, 2, 'player2'),
('winners', 1, 5, 'winner', 'winners', 2, 3, 'player1'),
('winners', 1, 6, 'winner', 'winners', 2, 3, 'player2'),
('winners', 1, 7, 'winner', 'winners', 2, 4, 'player1'),
('winners', 1, 8, 'winner', 'winners', 2, 4, 'player2');

-- Round 2 → Round 3 (4 rules)
INSERT INTO public.double1_advancement_rules (from_bracket, from_round, from_match, player_role, to_bracket, to_round, to_match, to_position) VALUES
('winners', 2, 1, 'winner', 'winners', 3, 1, 'player1'),
('winners', 2, 2, 'winner', 'winners', 3, 1, 'player2'),
('winners', 2, 3, 'winner', 'winners', 3, 2, 'player1'),
('winners', 2, 4, 'winner', 'winners', 3, 2, 'player2');

-- Round 3 → Semifinals (2 rules)
INSERT INTO public.double1_advancement_rules (from_bracket, from_round, from_match, player_role, to_bracket, to_round, to_match, to_position) VALUES
('winners', 3, 1, 'winner', 'semifinals', 250, 1, 'player1'),
('winners', 3, 2, 'winner', 'semifinals', 250, 2, 'player1');

-- LOSERS BRACKET A ADVANCEMENT (7 rules)
-- Round 1 losers → Round 101 (4 rules)
INSERT INTO public.double1_advancement_rules (from_bracket, from_round, from_match, player_role, to_bracket, to_round, to_match, to_position) VALUES
('winners', 1, 1, 'loser', 'losers', 101, 1, 'player1'),
('winners', 1, 2, 'loser', 'losers', 101, 1, 'player2'),
('winners', 1, 3, 'loser', 'losers', 101, 2, 'player1'),
('winners', 1, 4, 'loser', 'losers', 101, 2, 'player2'),
('winners', 1, 5, 'loser', 'losers', 101, 3, 'player1'),
('winners', 1, 6, 'loser', 'losers', 101, 3, 'player2'),
('winners', 1, 7, 'loser', 'losers', 101, 4, 'player1'),
('winners', 1, 8, 'loser', 'losers', 101, 4, 'player2');

-- Round 101 → Round 102 (2 rules)
INSERT INTO public.double1_advancement_rules (from_bracket, from_round, from_match, player_role, to_bracket, to_round, to_match, to_position) VALUES
('losers', 101, 1, 'winner', 'losers', 102, 1, 'player1'),
('losers', 101, 2, 'winner', 'losers', 102, 1, 'player2'),
('losers', 101, 3, 'winner', 'losers', 102, 2, 'player1'),
('losers', 101, 4, 'winner', 'losers', 102, 2, 'player2');

-- Round 102 → Round 103 (1 rule)
INSERT INTO public.double1_advancement_rules (from_bracket, from_round, from_match, player_role, to_bracket, to_round, to_match, to_position) VALUES
('losers', 102, 1, 'winner', 'losers', 103, 1, 'player1'),
('losers', 102, 2, 'winner', 'losers', 103, 1, 'player2');

-- LOSERS BRACKET B ADVANCEMENT (3 rules)
-- Round 2 losers → Round 201 (2 rules)
INSERT INTO public.double1_advancement_rules (from_bracket, from_round, from_match, player_role, to_bracket, to_round, to_match, to_position) VALUES
('winners', 2, 1, 'loser', 'losers', 201, 1, 'player1'),
('winners', 2, 2, 'loser', 'losers', 201, 1, 'player2'),
('winners', 2, 3, 'loser', 'losers', 201, 2, 'player1'),
('winners', 2, 4, 'loser', 'losers', 201, 2, 'player2');

-- Round 201 → Round 202 (1 rule)
INSERT INTO public.double1_advancement_rules (from_bracket, from_round, from_match, player_role, to_bracket, to_round, to_match, to_position) VALUES
('losers', 201, 1, 'winner', 'losers', 202, 1, 'player1'),
('losers', 201, 2, 'winner', 'losers', 202, 1, 'player2');

-- FINALS ADVANCEMENT (3 rules)
-- Round 103 → Semifinals
INSERT INTO public.double1_advancement_rules (from_bracket, from_round, from_match, player_role, to_bracket, to_round, to_match, to_position) VALUES
('losers', 103, 1, 'winner', 'semifinals', 250, 1, 'player2');

-- Round 202 → Semifinals
INSERT INTO public.double1_advancement_rules (from_bracket, from_round, from_match, player_role, to_bracket, to_round, to_match, to_position) VALUES
('losers', 202, 1, 'winner', 'semifinals', 250, 2, 'player2');

-- Semifinals → Finals
INSERT INTO public.double1_advancement_rules (from_bracket, from_round, from_match, player_role, to_bracket, to_round, to_match, to_position) VALUES
('semifinals', 250, 1, 'winner', 'finals', 300, 1, 'player1'),
('semifinals', 250, 2, 'winner', 'finals', 300, 1, 'player2');

-- Step 3: Create function to fix tournaments with player duplicates
CREATE OR REPLACE FUNCTION public.fix_tournament_player_duplicates(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match RECORD;
  v_fixed_count INTEGER := 0;
  v_total_duplicates INTEGER := 0;
BEGIN
  -- Count total duplicates
  SELECT COUNT(*) INTO v_total_duplicates
  FROM public.tournament_matches
  WHERE tournament_id = p_tournament_id
    AND player1_id = player2_id
    AND player1_id IS NOT NULL;
  
  -- Reset matches where player1_id = player2_id
  FOR v_match IN
    SELECT id, round_number, match_number, bracket_type
    FROM public.tournament_matches
    WHERE tournament_id = p_tournament_id
      AND player1_id = player2_id
      AND player1_id IS NOT NULL
  LOOP
    -- Reset these matches
    UPDATE public.tournament_matches 
    SET player1_id = NULL,
        player2_id = NULL,
        winner_id = NULL,
        status = 'pending',
        player1_score = NULL,
        player2_score = NULL
    WHERE id = v_match.id;
    
    v_fixed_count := v_fixed_count + 1;
  END LOOP;
  
  -- Re-run advancement using fixed rules
  PERFORM public.advance_sabo_tournament_fixed(p_tournament_id, NULL, NULL);
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'total_duplicates_found', v_total_duplicates,
    'matches_reset', v_fixed_count,
    'advancement_reapplied', true,
    'fixed_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournament_id', p_tournament_id,
      'fixed_count', v_fixed_count
    );
END;
$$;

-- Step 4: Create function to validate the 27-rule structure
CREATE OR REPLACE FUNCTION public.validate_double1_advancement_rules()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_rules INTEGER;
  v_winners_rules INTEGER;
  v_losers_rules INTEGER;
  v_finals_rules INTEGER;
  v_validation_result jsonb;
BEGIN
  -- Count rules by category
  SELECT COUNT(*) INTO v_total_rules FROM public.double1_advancement_rules;
  
  SELECT COUNT(*) INTO v_winners_rules 
  FROM public.double1_advancement_rules 
  WHERE from_bracket = 'winners' AND to_bracket = 'winners';
  
  SELECT COUNT(*) INTO v_losers_rules 
  FROM public.double1_advancement_rules 
  WHERE to_bracket = 'losers';
  
  SELECT COUNT(*) INTO v_finals_rules 
  FROM public.double1_advancement_rules 
  WHERE to_bracket IN ('semifinals', 'finals');
  
  v_validation_result := jsonb_build_object(
    'total_rules', v_total_rules,
    'expected_total', 27,
    'total_valid', v_total_rules = 27,
    'winners_rules', v_winners_rules,
    'expected_winners', 14,
    'winners_valid', v_winners_rules = 14,
    'losers_rules', v_losers_rules,
    'expected_losers', 8,
    'losers_valid', v_losers_rules = 8,
    'finals_rules', v_finals_rules,
    'expected_finals', 5,
    'finals_valid', v_finals_rules = 5,
    'structure_valid', (v_total_rules = 27 AND v_winners_rules = 14 AND v_losers_rules = 8 AND v_finals_rules = 5)
  );
  
  RETURN v_validation_result;
END;
$$;