-- Create comprehensive double elimination advancement trigger
-- This trigger will automatically advance winners when a match is completed

CREATE OR REPLACE FUNCTION public.trigger_advance_tournament_winner()
RETURNS TRIGGER AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Only trigger on matches that have been completed with a winner
  -- And the winner was just set (changed from NULL or different winner)
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND 
     (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
    
    -- Log the trigger execution
    RAISE NOTICE 'Auto-advancing winner % for match %', NEW.winner_id, NEW.id;
    
    -- Call the comprehensive advancement function
    SELECT public.advance_double_elimination_winner_comprehensive(NEW.id) INTO v_result;
    
    -- Log the result
    IF v_result ? 'success' AND (v_result->>'success')::boolean THEN
      RAISE NOTICE 'Auto-advancement successful for match %', NEW.id;
    ELSE
      RAISE WARNING 'Auto-advancement failed for match %: %', NEW.id, v_result->>'error';
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_advance_tournament_winner ON public.tournament_matches;

-- Create the trigger
CREATE TRIGGER trigger_advance_tournament_winner
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_advance_tournament_winner();

-- Create function to fix all existing tournaments with unadvanced winners
CREATE OR REPLACE FUNCTION public.fix_all_unadvanced_tournaments()
RETURNS JSONB AS $$
DECLARE
  v_tournament RECORD;
  v_fixed_count INTEGER := 0;
  v_total_tournaments INTEGER := 0;
  v_results JSONB[] := '{}';
  v_fix_result JSONB;
BEGIN
  -- Find all tournaments with completed matches that have winners but haven't been advanced
  FOR v_tournament IN
    SELECT DISTINCT tm.tournament_id, t.name as tournament_name
    FROM public.tournament_matches tm
    JOIN public.tournaments t ON tm.tournament_id = t.id
    WHERE tm.status = 'completed' 
      AND tm.winner_id IS NOT NULL
      AND t.tournament_type = 'double_elimination'
      AND EXISTS (
        -- Check if there are next round matches that should have players but don't
        SELECT 1 FROM public.tournament_matches tm2
        WHERE tm2.tournament_id = tm.tournament_id
          AND tm2.round_number > tm.round_number
          AND (tm2.player1_id IS NULL OR tm2.player2_id IS NULL)
      )
    ORDER BY t.created_at DESC
  LOOP
    v_total_tournaments := v_total_tournaments + 1;
    
    -- Fix this tournament using repair function
    SELECT public.repair_double_elimination_bracket(v_tournament.tournament_id) INTO v_fix_result;
    
    IF v_fix_result ? 'success' AND (v_fix_result->>'success')::boolean THEN
      v_fixed_count := v_fixed_count + 1;
      RAISE NOTICE 'Fixed tournament: % (%)', v_tournament.tournament_name, v_tournament.tournament_id;
    ELSE
      RAISE WARNING 'Failed to fix tournament: % - %', v_tournament.tournament_name, v_fix_result->>'error';
    END IF;
    
    v_results := v_results || jsonb_build_object(
      'tournament_id', v_tournament.tournament_id,
      'tournament_name', v_tournament.tournament_name,
      'result', v_fix_result
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_tournaments_checked', v_total_tournaments,
    'tournaments_fixed', v_fixed_count,
    'details', v_results,
    'message', format('Checked %s tournaments, fixed %s', v_total_tournaments, v_fixed_count)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournaments_checked', v_total_tournaments,
      'tournaments_fixed', v_fixed_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create monitoring function to check tournament health
CREATE OR REPLACE FUNCTION public.check_tournament_advancement_health()
RETURNS JSONB AS $$
DECLARE
  v_unhealthy_tournaments JSONB;
  v_stats JSONB;
BEGIN
  -- Get tournaments with advancement issues
  SELECT jsonb_agg(
    jsonb_build_object(
      'tournament_id', tm.tournament_id,
      'tournament_name', t.name,
      'status', t.status,
      'unadvanced_matches', COUNT(*)
    )
  ) INTO v_unhealthy_tournaments
  FROM public.tournament_matches tm
  JOIN public.tournaments t ON tm.tournament_id = t.id
  WHERE tm.status = 'completed' 
    AND tm.winner_id IS NOT NULL
    AND t.tournament_type = 'double_elimination'
    AND EXISTS (
      SELECT 1 FROM public.tournament_matches tm2
      WHERE tm2.tournament_id = tm.tournament_id
        AND tm2.round_number > tm.round_number
        AND (tm2.player1_id IS NULL OR tm2.player2_id IS NULL)
    )
  GROUP BY tm.tournament_id, t.name, t.status;
  
  -- Get overall stats
  SELECT jsonb_build_object(
    'total_double_elimination_tournaments', (
      SELECT COUNT(*) FROM public.tournaments WHERE tournament_type = 'double_elimination'
    ),
    'tournaments_with_issues', (
      SELECT COUNT(DISTINCT tm.tournament_id)
      FROM public.tournament_matches tm
      JOIN public.tournaments t ON tm.tournament_id = t.id
      WHERE tm.status = 'completed' 
        AND tm.winner_id IS NOT NULL
        AND t.tournament_type = 'double_elimination'
        AND EXISTS (
          SELECT 1 FROM public.tournament_matches tm2
          WHERE tm2.tournament_id = tm.tournament_id
            AND tm2.round_number > tm.round_number
            AND (tm2.player1_id IS NULL OR tm2.player2_id IS NULL)
        )
    ),
    'healthy_tournaments', (
      SELECT COUNT(*) FROM public.tournaments t
      WHERE t.tournament_type = 'double_elimination'
        AND NOT EXISTS (
          SELECT 1 FROM public.tournament_matches tm
          WHERE tm.tournament_id = t.id
            AND tm.status = 'completed' 
            AND tm.winner_id IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM public.tournament_matches tm2
              WHERE tm2.tournament_id = tm.tournament_id
                AND tm2.round_number > tm.round_number
                AND (tm2.player1_id IS NULL OR tm2.player2_id IS NULL)
            )
        )
    )
  ) INTO v_stats;
  
  RETURN jsonb_build_object(
    'health_check_time', NOW(),
    'statistics', v_stats,
    'unhealthy_tournaments', COALESCE(v_unhealthy_tournaments, '[]'::jsonb),
    'recommendations', CASE 
      WHEN (v_stats->>'tournaments_with_issues')::integer > 0 THEN 
        'Run fix_all_unadvanced_tournaments() to repair existing issues'
      ELSE 
        'All tournaments are healthy'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;