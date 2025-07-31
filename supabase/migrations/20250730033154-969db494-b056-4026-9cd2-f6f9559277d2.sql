-- Update the repair functions to use proper SABO advancement
CREATE OR REPLACE FUNCTION public.repair_double_elimination_bracket(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Use the SABO tournament progression fix function
  RETURN public.fix_all_tournament_progression(p_tournament_id);
END;
$$;

-- Update the v9 repair function to use proper SABO advancement
CREATE OR REPLACE FUNCTION public.repair_double_elimination_v9(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Use the SABO tournament progression fix function
  RETURN public.fix_all_tournament_progression(p_tournament_id);
END;
$$;

-- Update the trigger to use the correct SABO function
CREATE OR REPLACE FUNCTION public.trigger_auto_advance_double_elimination_fixed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
BEGIN
  -- Only trigger if match was just completed and has a winner
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND 
     (OLD.status != 'completed' OR OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
    
    -- Execute SABO advancement function with correct parameters
    PERFORM advance_sabo_tournament_fixed(NEW.tournament_id, NEW.id, NEW.winner_id);
    
    RAISE NOTICE '🎯 Auto-advancement completed for tournament: %', NEW.tournament_id;
  END IF;
  
  RETURN NEW;
END;
$$;