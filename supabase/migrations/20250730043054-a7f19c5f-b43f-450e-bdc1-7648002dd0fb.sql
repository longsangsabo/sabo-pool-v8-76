-- Function to clone Double1 structure for new tournaments
CREATE OR REPLACE FUNCTION public.create_tournament_from_double1_template(
  p_new_tournament_id uuid,
  p_player_ids uuid[]
)
RETURNS TABLE(success boolean, message text, matches_created integer, template_used text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_double1_id uuid;
  v_match_record record;
  v_matches_created integer := 0;
  v_player_index integer := 1;
BEGIN
  -- Validate exactly 16 players
  IF array_length(p_player_ids, 1) != 16 THEN
    RETURN QUERY SELECT false, 'Exactly 16 players required', 0, null::text;
    RETURN;
  END IF;
  
  -- Find Double1 tournament (our proven template)
  SELECT id INTO v_double1_id 
  FROM tournaments 
  WHERE name ILIKE '%double1%' 
     OR tournament_type = 'double_elimination'
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Fallback: Use any completed double elimination as template
  IF v_double1_id IS NULL THEN
    SELECT id INTO v_double1_id 
    FROM tournaments 
    WHERE tournament_type = 'double_elimination' 
      AND EXISTS (
        SELECT 1 FROM tournament_matches 
        WHERE tournament_id = tournaments.id 
          AND round_number = 300 
      )
    ORDER BY created_at DESC 
    LIMIT 1;
  END IF;
  
  IF v_double1_id IS NULL THEN
    RETURN QUERY SELECT false, 'No Double1 template found', 0, null::text;
    RETURN;
  END IF;
  
  -- Clone exact match structure from Double1
  FOR v_match_record IN 
    SELECT 
      round_number,
      match_number,
      bracket_type,
      ROW_NUMBER() OVER (ORDER BY round_number, match_number) as sequence
    FROM tournament_matches 
    WHERE tournament_id = v_double1_id
    ORDER BY round_number, match_number
  LOOP
    INSERT INTO tournament_matches (
      id,
      tournament_id,
      round_number,
      match_number,
      bracket_type,
      player1_id,
      player2_id,
      status,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      p_new_tournament_id,
      v_match_record.round_number,
      v_match_record.match_number,
      COALESCE(v_match_record.bracket_type, 'winners'),
      -- Assign players to Round 1 matches only (1-8)
      CASE 
        WHEN v_match_record.round_number = 1 AND v_match_record.match_number <= 8 
        THEN p_player_ids[(v_match_record.match_number - 1) * 2 + 1]
        ELSE NULL 
      END,
      CASE 
        WHEN v_match_record.round_number = 1 AND v_match_record.match_number <= 8 
        THEN p_player_ids[(v_match_record.match_number - 1) * 2 + 2]
        ELSE NULL 
      END,
      CASE 
        WHEN v_match_record.round_number = 1 THEN 'scheduled'
        ELSE 'pending' 
      END,
      NOW(),
      NOW()
    );
    
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  RETURN QUERY SELECT 
    true, 
    format('New tournament created with %s matches cloned from Double1', v_matches_created),
    v_matches_created,
    v_double1_id::text;
END;
$$;

-- Function to verify tournament structure matches Double1
CREATE OR REPLACE FUNCTION public.verify_tournament_structure(
  p_tournament_id uuid
)
RETURNS TABLE(
  round_number integer, 
  expected_matches integer, 
  actual_matches integer, 
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH expected_structure AS (
    SELECT 1 as round_num, 8 as expected_count UNION ALL
    SELECT 2, 4 UNION ALL
    SELECT 3, 2 UNION ALL
    SELECT 101, 4 UNION ALL
    SELECT 102, 2 UNION ALL
    SELECT 103, 1 UNION ALL
    SELECT 201, 2 UNION ALL
    SELECT 202, 1 UNION ALL
    SELECT 250, 2 UNION ALL
    SELECT 300, 1
  ),
  actual_structure AS (
    SELECT 
      tm.round_number as round_num, 
      COUNT(*) as actual_count
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
    GROUP BY tm.round_number
  )
  SELECT 
    e.round_num,
    e.expected_count,
    COALESCE(a.actual_count, 0),
    CASE 
      WHEN COALESCE(a.actual_count, 0) = e.expected_count THEN '✅ Correct'
      ELSE '❌ Mismatch'
    END as status
  FROM expected_structure e
  LEFT JOIN actual_structure a ON e.round_num = a.round_num
  ORDER BY e.round_num;
END;
$$;