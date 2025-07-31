-- PHASE 1: Extract Exact Double1 Advancement Mapping
-- Create advancement mapping table from Double1's completed results
CREATE TABLE IF NOT EXISTS double1_advancement_mapping AS
WITH double1_tournament AS (
  SELECT id FROM tournaments WHERE name ILIKE '%double1%' LIMIT 1
),
player_movements AS (
  -- Track where each winner advanced to
  SELECT 
    tm1.round_number as from_round,
    tm1.match_number as from_match,
    tm1.bracket_type as from_bracket,
    tm1.winner_id as player_id,
    'winner' as player_role,
    tm2.round_number as to_round,
    tm2.match_number as to_match,
    tm2.bracket_type as to_bracket,
    CASE 
      WHEN tm2.player1_id = tm1.winner_id THEN 'player1'
      WHEN tm2.player2_id = tm1.winner_id THEN 'player2'
    END as to_position
  FROM tournament_matches tm1
  JOIN double1_tournament d1 ON tm1.tournament_id = d1.id
  LEFT JOIN tournament_matches tm2 ON tm2.tournament_id = d1.id
    AND (tm2.player1_id = tm1.winner_id OR tm2.player2_id = tm1.winner_id)
    AND tm2.round_number > tm1.round_number
  WHERE tm1.winner_id IS NOT NULL
  
  UNION ALL
  
  -- Track where each loser advanced to
  SELECT 
    tm1.round_number as from_round,
    tm1.match_number as from_match,
    tm1.bracket_type as from_bracket,
    CASE 
      WHEN tm1.winner_id = tm1.player1_id THEN tm1.player2_id
      ELSE tm1.player1_id
    END as player_id,
    'loser' as player_role,
    tm2.round_number as to_round,
    tm2.match_number as to_match,
    tm2.bracket_type as to_bracket,
    CASE 
      WHEN tm2.player1_id = CASE WHEN tm1.winner_id = tm1.player1_id THEN tm1.player2_id ELSE tm1.player1_id END THEN 'player1'
      WHEN tm2.player2_id = CASE WHEN tm1.winner_id = tm1.player1_id THEN tm1.player2_id ELSE tm1.player1_id END THEN 'player2'
    END as to_position
  FROM tournament_matches tm1
  JOIN double1_tournament d1 ON tm1.tournament_id = d1.id
  LEFT JOIN tournament_matches tm2 ON tm2.tournament_id = d1.id
    AND (tm2.player1_id = CASE WHEN tm1.winner_id = tm1.player1_id THEN tm1.player2_id ELSE tm1.player1_id END 
         OR tm2.player2_id = CASE WHEN tm1.winner_id = tm1.player1_id THEN tm1.player2_id ELSE tm1.player1_id END)
    AND tm2.round_number > tm1.round_number
  WHERE tm1.winner_id IS NOT NULL
)
SELECT * FROM player_movements WHERE to_round IS NOT NULL;

-- Create advancement rules table
CREATE TABLE IF NOT EXISTS double1_advancement_rules AS
SELECT 
  from_round,
  from_match,
  from_bracket,
  player_role,
  to_round,
  to_match,
  to_bracket,
  to_position,
  COUNT(*) OVER (PARTITION BY from_round, from_bracket, player_role, to_round) as rule_frequency
FROM double1_advancement_mapping
ORDER BY from_round, from_match, player_role;

-- PHASE 2: Create the exact advancement function based on Double1 patterns
CREATE OR REPLACE FUNCTION public.advance_tournament_exact_double1_pattern(
  p_tournament_id uuid,
  p_completed_match_id uuid,
  p_winner_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_completed_match record;
  v_loser_id uuid;
  v_winner_rule record;
  v_loser_rule record;
  v_target_match_id uuid;
  v_log text := '';
  v_advancement_count integer := 0;
BEGIN
  -- Get completed match details
  SELECT * INTO v_completed_match FROM tournament_matches WHERE id = p_completed_match_id;
  
  IF v_completed_match IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;
  
  -- Determine loser
  IF v_completed_match.player1_id = p_winner_id THEN
    v_loser_id := v_completed_match.player2_id;
  ELSE
    v_loser_id := v_completed_match.player1_id;
  END IF;
  
  -- Get advancement rules for winner from Double1 pattern
  SELECT * INTO v_winner_rule
  FROM double1_advancement_rules
  WHERE from_round = v_completed_match.round_number
    AND from_match = v_completed_match.match_number
    AND COALESCE(from_bracket, 'winners') = COALESCE(v_completed_match.bracket_type, 'winners')
    AND player_role = 'winner'
  LIMIT 1;
  
  -- Advance winner according to Double1 pattern
  IF v_winner_rule IS NOT NULL THEN
    SELECT id INTO v_target_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND round_number = v_winner_rule.to_round
      AND match_number = v_winner_rule.to_match
      AND COALESCE(bracket_type, 'winners') = COALESCE(v_winner_rule.to_bracket, 'winners');
    
    IF v_target_match_id IS NOT NULL THEN
      IF v_winner_rule.to_position = 'player1' THEN
        UPDATE tournament_matches 
        SET player1_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_target_match_id AND player1_id IS NULL;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_target_match_id AND player2_id IS NULL;
      END IF;
      
      v_advancement_count := v_advancement_count + 1;
      v_log := v_log || format('Winner %s: R%s.M%s.%s → R%s.M%s.%s.%s | ', 
        p_winner_id, v_completed_match.round_number, v_completed_match.match_number, 
        COALESCE(v_completed_match.bracket_type, 'W'),
        v_winner_rule.to_round, v_winner_rule.to_match, 
        COALESCE(v_winner_rule.to_bracket, 'W'), v_winner_rule.to_position);
    END IF;
  END IF;
  
  -- Get advancement rules for loser from Double1 pattern
  SELECT * INTO v_loser_rule
  FROM double1_advancement_rules
  WHERE from_round = v_completed_match.round_number
    AND from_match = v_completed_match.match_number
    AND COALESCE(from_bracket, 'winners') = COALESCE(v_completed_match.bracket_type, 'winners')
    AND player_role = 'loser'
  LIMIT 1;
  
  -- Advance loser according to Double1 pattern
  IF v_loser_rule IS NOT NULL THEN
    SELECT id INTO v_target_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND round_number = v_loser_rule.to_round
      AND match_number = v_loser_rule.to_match
      AND COALESCE(bracket_type, 'winners') = COALESCE(v_loser_rule.to_bracket, 'winners');
    
    IF v_target_match_id IS NOT NULL THEN
      IF v_loser_rule.to_position = 'player1' THEN
        UPDATE tournament_matches 
        SET player1_id = v_loser_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_target_match_id AND player1_id IS NULL;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_loser_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_target_match_id AND player2_id IS NULL;
      END IF;
      
      v_advancement_count := v_advancement_count + 1;
      v_log := v_log || format('Loser %s: R%s.M%s.%s → R%s.M%s.%s.%s | ', 
        v_loser_id, v_completed_match.round_number, v_completed_match.match_number, 
        COALESCE(v_completed_match.bracket_type, 'W'),
        v_loser_rule.to_round, v_loser_rule.to_match, 
        COALESCE(v_loser_rule.to_bracket, 'W'), v_loser_rule.to_position);
    END IF;
  END IF;
  
  -- Log the advancement in tournament automation log
  INSERT INTO tournament_automation_log (
    tournament_id, automation_type, status, details, completed_at
  ) VALUES (
    p_tournament_id, 'double1_pattern_advancement', 'completed',
    jsonb_build_object(
      'match_id', p_completed_match_id,
      'winner_id', p_winner_id,
      'loser_id', v_loser_id,
      'advancement_log', v_log,
      'advancements_made', v_advancement_count
    ),
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', format('Advanced using exact Double1 pattern - %s players advanced', v_advancement_count),
    'advancement_log', v_log,
    'advancements_made', v_advancement_count
  );
END;
$$;