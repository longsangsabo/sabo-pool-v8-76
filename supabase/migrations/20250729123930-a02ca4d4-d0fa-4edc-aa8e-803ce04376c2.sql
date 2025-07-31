-- STEP 1: Drop all existing conflicting triggers on tournament_matches
DROP TRIGGER IF EXISTS trigger_advance_double_elimination_v9 ON tournament_matches;
DROP TRIGGER IF EXISTS trigger_advance_double_elimination ON tournament_matches;
DROP TRIGGER IF EXISTS update_tournament_matches_updated_at ON tournament_matches;
DROP TRIGGER IF EXISTS notify_winner_advancement_trigger ON tournament_matches;
DROP TRIGGER IF EXISTS trigger_auto_advance_double_elimination ON tournament_matches;
DROP TRIGGER IF EXISTS trigger_update_tournament_matches_updated_at ON tournament_matches;
DROP TRIGGER IF EXISTS auto_advance_double_elimination_trigger ON tournament_matches;
DROP TRIGGER IF EXISTS tournament_match_winner_trigger ON tournament_matches;
DROP TRIGGER IF EXISTS advance_winner_trigger ON tournament_matches;

-- STEP 2: Create the corrected auto advancement trigger function
CREATE OR REPLACE FUNCTION public.trigger_auto_advance_double_elimination_fixed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament_type TEXT;
  v_advancement_result JSONB;
BEGIN
  -- Only process if winner was just set (not updated)
  IF NEW.winner_id IS NOT NULL AND (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
    
    -- Check if this is a double elimination tournament
    SELECT tournament_type INTO v_tournament_type
    FROM tournaments 
    WHERE id = NEW.tournament_id;
    
    IF v_tournament_type = 'double_elimination' THEN
      RAISE NOTICE '🎯 Auto-advancing winners for tournament: %, match: %', NEW.tournament_id, NEW.id;
      
      -- Use the CORRECTED advance function with tournament_id (not match_id)
      SELECT public.advance_double_elimination_v9_fixed(NEW.tournament_id) INTO v_advancement_result;
      
      -- Log the automation attempt
      INSERT INTO tournament_automation_log (
        tournament_id,
        automation_type,
        status,
        details,
        error_message,
        completed_at
      ) VALUES (
        NEW.tournament_id,
        'auto_double_elimination_advancement',
        CASE WHEN (v_advancement_result->>'success')::boolean THEN 'completed' ELSE 'failed' END,
        jsonb_build_object(
          'triggered_by_match', NEW.id,
          'winner_id', NEW.winner_id,
          'round_number', NEW.round_number,
          'match_number', NEW.match_number,
          'advancement_result', v_advancement_result
        ),
        CASE WHEN NOT (v_advancement_result->>'success')::boolean THEN v_advancement_result->>'error' ELSE NULL END,
        CASE WHEN (v_advancement_result->>'success')::boolean THEN NOW() ELSE NULL END
      );
      
      RAISE NOTICE '✅ Auto-advancement completed for tournament %: %', NEW.tournament_id, v_advancement_result;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the original update
    INSERT INTO tournament_automation_log (
      tournament_id,
      automation_type,
      status,
      details,
      error_message
    ) VALUES (
      NEW.tournament_id,
      'auto_double_elimination_advancement',
      'failed',
      jsonb_build_object(
        'triggered_by_match', NEW.id,
        'winner_id', NEW.winner_id,
        'error_code', SQLSTATE,
        'error_context', 'trigger_exception'
      ),
      SQLERRM
    );
    
    RAISE WARNING '❌ Auto-advancement failed for tournament %: %', NEW.tournament_id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- STEP 3: Create the single corrected trigger
CREATE TRIGGER trigger_auto_advance_double_elimination_fixed
  AFTER UPDATE OF winner_id ON tournament_matches
  FOR EACH ROW
  WHEN (NEW.winner_id IS NOT NULL AND (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id))
  EXECUTE FUNCTION trigger_auto_advance_double_elimination_fixed();

-- STEP 4: Create updated_at trigger (standard pattern)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER update_tournament_matches_updated_at
  BEFORE UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- STEP 5: Create notification trigger for real-time updates
CREATE TRIGGER notify_winner_advancement_trigger
  AFTER UPDATE OF winner_id ON tournament_matches
  FOR EACH ROW
  WHEN (NEW.winner_id IS NOT NULL AND (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id))
  EXECUTE FUNCTION notify_winner_advancement();

-- STEP 6: Ensure automation log table exists
CREATE TABLE IF NOT EXISTS tournament_automation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL,
  automation_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  details JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on automation log
ALTER TABLE tournament_automation_log ENABLE ROW LEVEL SECURITY;

-- Create policy for automation log (admins and system can access)
DROP POLICY IF EXISTS "Admins can view automation logs" ON tournament_automation_log;
CREATE POLICY "Admins can view automation logs" ON tournament_automation_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "System can insert automation logs" ON tournament_automation_log;
CREATE POLICY "System can insert automation logs" ON tournament_automation_log
  FOR INSERT WITH CHECK (true);

-- STEP 7: Update the repair function to use the correct logic
CREATE OR REPLACE FUNCTION public.repair_double_elimination_v9(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Use the corrected v9_fixed function
  RETURN public.advance_double_elimination_v9_fixed(p_tournament_id);
END;
$function$;