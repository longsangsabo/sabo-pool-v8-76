-- PHASE 3: Update score submission to use exact Double1 pattern
CREATE OR REPLACE FUNCTION public.submit_sabo_match_score(
  p_match_id uuid,
  p_player1_score integer,
  p_player2_score integer,
  p_submitted_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match record;
  v_winner_id uuid;
  v_advancement_result jsonb;
  v_tournament record;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF v_match IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;
  
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = v_match.tournament_id;
  
  -- Check if submitter is one of the players OR an admin/club owner
  IF p_submitted_by NOT IN (v_match.player1_id, v_match.player2_id) THEN
    -- Check if user is admin or club owner
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = p_submitted_by 
      AND (is_admin = true OR role = 'club_owner')
    ) THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Only match participants, admins, or club owners can submit scores'
      );
    END IF;
  END IF;
  
  -- Auto-start match if scheduled
  IF v_match.status = 'scheduled' THEN
    UPDATE tournament_matches 
    SET status = 'in_progress', updated_at = NOW()
    WHERE id = p_match_id;
  END IF;
  
  -- Determine winner based on scores
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
  ELSIF p_player2_score > p_player1_score THEN
    v_winner_id := v_match.player2_id;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Scores cannot be tied');
  END IF;
  
  -- Update match with scores and winner (using correct column names)
  UPDATE tournament_matches 
  SET 
    score_player1 = p_player1_score,
    score_player2 = p_player2_score,
    winner_id = v_winner_id,
    status = 'completed',
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- Use exact Double1 pattern for advancement
  SELECT advance_tournament_exact_double1_pattern(
    v_match.tournament_id,
    p_match_id,
    v_winner_id
  ) INTO v_advancement_result;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', format('SABO score submitted using exact Double1 pattern: %s', v_advancement_result->>'message'),
    'winner_id', v_winner_id,
    'match_id', p_match_id,
    'player1_score', p_player1_score,
    'player2_score', p_player2_score,
    'advancement_result', v_advancement_result
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('SABO score submission failed: %s', SQLERRM)
    );
END;
$$;

-- PHASE 4: Create validation system for Double1 pattern compliance
CREATE OR REPLACE FUNCTION public.verify_double1_pattern_compliance(p_tournament_id uuid)
RETURNS TABLE(
  round_number integer,
  bracket_type text,
  expected_matches integer,
  actual_matches integer,
  compliance_status text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH expected_from_double1 AS (
    SELECT 
      dam.to_round as round_num,
      COALESCE(dam.to_bracket, 'winners') as bracket,
      COUNT(*) as expected_matches
    FROM double1_advancement_mapping dam
    WHERE dam.to_round IS NOT NULL
    GROUP BY dam.to_round, COALESCE(dam.to_bracket, 'winners')
  ),
  actual_tournament AS (
    SELECT 
      tm.round_number as round_num,
      COALESCE(tm.bracket_type, 'winners') as bracket,
      COUNT(*) as actual_matches
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
    GROUP BY tm.round_number, COALESCE(tm.bracket_type, 'winners')
  )
  SELECT 
    COALESCE(e.round_num, a.round_num) as round_number,
    COALESCE(e.bracket, a.bracket) as bracket_type,
    COALESCE(e.expected_matches, 0) as expected_matches,
    COALESCE(a.actual_matches, 0) as actual_matches,
    CASE 
      WHEN COALESCE(e.expected_matches, 0) = COALESCE(a.actual_matches, 0) THEN '✅ COMPLIANT'
      ELSE '❌ NON-COMPLIANT'
    END as compliance_status
  FROM expected_from_double1 e
  FULL OUTER JOIN actual_tournament a ON e.round_num = a.round_num AND e.bracket = a.bracket
  ORDER BY COALESCE(e.round_num, a.round_num), COALESCE(e.bracket, a.bracket);
END;
$$;

-- Create analysis function to show extracted Double1 patterns
CREATE OR REPLACE FUNCTION public.analyze_double1_advancement_patterns()
RETURNS TABLE(
  from_round integer,
  from_bracket text,
  player_role text,
  to_round integer,
  to_bracket text,
  advancement_count bigint,
  pattern_description text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dar.from_round,
    COALESCE(dar.from_bracket, 'winners') as from_bracket,
    dar.player_role,
    dar.to_round,
    COALESCE(dar.to_bracket, 'winners') as to_bracket,
    COUNT(*) as advancement_count,
    format('%s from R%s.%s → R%s.%s', 
      dar.player_role, 
      dar.from_round, 
      COALESCE(dar.from_bracket, 'W'),
      dar.to_round, 
      COALESCE(dar.to_bracket, 'W')
    ) as pattern_description
  FROM double1_advancement_rules dar
  GROUP BY dar.from_round, dar.from_bracket, dar.player_role, dar.to_round, dar.to_bracket
  ORDER BY dar.from_round, dar.from_bracket, dar.player_role;