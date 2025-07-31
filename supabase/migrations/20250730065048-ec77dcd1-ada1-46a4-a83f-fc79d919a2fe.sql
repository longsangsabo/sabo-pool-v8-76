-- Fix type mismatch in verify_double1_pattern_compliance function
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
      COUNT(*)::integer as expected_matches  -- Cast to integer
    FROM double1_advancement_mapping dam
    WHERE dam.to_round IS NOT NULL
    GROUP BY dam.to_round, COALESCE(dam.to_bracket, 'winners')
  ),
  actual_tournament AS (
    SELECT 
      tm.round_number as round_num,
      COALESCE(tm.bracket_type, 'winners') as bracket,
      COUNT(*)::integer as actual_matches  -- Cast to integer
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