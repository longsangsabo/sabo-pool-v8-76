-- Fix the remaining functions that reference advance_sabo_tournament_fixed

-- Fix fix_tournament_player_duplicates
CREATE OR REPLACE FUNCTION public.fix_tournament_player_duplicates(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
        score_player1 = NULL,
        score_player2 = NULL
    WHERE id = v_match.id;
    
    v_fixed_count := v_fixed_count + 1;
  END LOOP;
  
  -- Re-run advancement using repair function
  PERFORM public.repair_double_elimination_bracket(p_tournament_id);
  
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
$function$;

-- Fix fix_double6_tournament_immediately  
CREATE OR REPLACE FUNCTION public.fix_double6_tournament_immediately()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament_id UUID := '2a6c88fe-07ec-4d29-bbf4-cc829439a7f8';
  v_result JSONB;
  v_fixed_count INTEGER := 0;
BEGIN
  -- Reset all matches from Round 2+ to remove duplicates
  UPDATE tournament_matches 
  SET player1_id = NULL, player2_id = NULL, winner_id = NULL, status = 'pending'
  WHERE tournament_id = v_tournament_id
  AND (round_number > 1 OR round_number > 100);
  
  GET DIAGNOSTICS v_fixed_count = ROW_COUNT;
  
  -- Now re-advance all Round 1 completed matches using repair function
  SELECT repair_double_elimination_bracket(v_tournament_id) INTO v_result;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', v_tournament_id,
    'matches_reset', v_fixed_count,
    'advancement_result', v_result,
    'message', 'Fixed double6 tournament using repair function'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournament_id', v_tournament_id
    );
END;
$function$;

-- Fix trigger_auto_advance_double_elimination_fixed
CREATE OR REPLACE FUNCTION public.trigger_auto_advance_double_elimination_fixed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only trigger if match was just completed and has a winner
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND 
     (OLD.status != 'completed' OR OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
    
    -- Execute repair function
    PERFORM repair_double_elimination_bracket(NEW.tournament_id);
    
    RAISE NOTICE '🎯 Auto-advancement completed for tournament: %', NEW.tournament_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix reset_broken_sabo_tournaments
CREATE OR REPLACE FUNCTION public.reset_broken_sabo_tournaments()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament record;
  v_match record;
  v_reset_count INTEGER := 0;
  v_advancement_count INTEGER := 0;
  v_results jsonb[] := '{}';
  v_advancement_result jsonb;
BEGIN
  -- Find tournaments with advancement issues (TBD players in later rounds with completed Round 1 matches)
  FOR v_tournament IN
    SELECT DISTINCT t.id, t.name
    FROM tournaments t
    JOIN tournament_matches tm1 ON t.id = tm1.tournament_id
    WHERE t.tournament_type = 'double_elimination'
      AND t.status IN ('ongoing', 'registration_closed')
      AND t.created_at > NOW() - INTERVAL '2 days'
      AND EXISTS (
        -- Has completed Round 1 matches
        SELECT 1 FROM tournament_matches tm_r1 
        WHERE tm_r1.tournament_id = t.id
          AND tm_r1.round_number = 1 
          AND tm_r1.status = 'completed'
          AND tm_r1.winner_id IS NOT NULL
      )
      AND EXISTS (
        -- Has empty Round 2+ matches that should have players
        SELECT 1 FROM tournament_matches tm_r2 
        WHERE tm_r2.tournament_id = t.id
          AND tm_r2.round_number > 1 
          AND tm_r2.player1_id IS NULL 
          AND tm_r2.player2_id IS NULL
      )
  LOOP
    RAISE NOTICE 'Resetting broken tournament: % (%)', v_tournament.name, v_tournament.id;
    
    -- Reset matches in Round 2+ that don't have players (using correct column names)
    UPDATE tournament_matches 
    SET 
      player1_id = NULL,
      player2_id = NULL,
      status = 'pending',
      score_player1 = NULL,
      score_player2 = NULL,
      winner_id = NULL,
      score_submitted_at = NULL,
      score_input_by = NULL,
      updated_at = NOW()
    WHERE tournament_id = v_tournament.id
      AND round_number > 1 
      AND (player1_id IS NULL OR player2_id IS NULL);
    
    v_reset_count := v_reset_count + 1;
    
    -- Re-trigger advancement using repair function
    BEGIN
      SELECT repair_double_elimination_bracket(v_tournament.id) INTO v_advancement_result;
      v_advancement_count := v_advancement_count + 1;
      RAISE NOTICE 'Re-advanced tournament % with result: %', v_tournament.id, v_advancement_result;
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to advance tournament %: %', v_tournament.id, SQLERRM;
        v_results := v_results || jsonb_build_object(
          'tournament_id', v_tournament.id,
          'error', SQLERRM
        );
    END;
    
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournaments_reset', v_reset_count,
    'tournaments_advanced', v_advancement_count,
    'errors', v_results,
    'message', format('Reset %s tournaments and re-advanced %s tournaments', v_reset_count, v_advancement_count)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournaments_reset', v_reset_count,
      'tournaments_advanced', v_advancement_count
    );
END;
$function$;