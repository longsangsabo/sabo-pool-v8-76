-- Test repair bracket function for the current tournament
CREATE OR REPLACE FUNCTION public.test_repair_current_tournament()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament_id UUID;
  v_repair_result JSONB;
BEGIN
  -- Find the current development test tournament
  SELECT id INTO v_tournament_id 
  FROM tournaments 
  WHERE name ILIKE '%Development Test%' 
     OR name ILIKE '%test%'
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF v_tournament_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No test tournament found');
  END IF;
  
  -- Run repair
  SELECT public.repair_double_elimination_bracket(v_tournament_id) INTO v_repair_result;
  
  -- Return detailed result
  RETURN jsonb_build_object(
    'tournament_id', v_tournament_id,
    'repair_result', v_repair_result,
    'test_completed_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM, 'tournament_id', v_tournament_id);
END;
$$;

-- Run the test
SELECT public.test_repair_current_tournament();