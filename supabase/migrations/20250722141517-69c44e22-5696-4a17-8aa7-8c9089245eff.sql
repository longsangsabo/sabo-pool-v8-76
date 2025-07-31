-- Phase 2: Create automatic winner advancement database triggers

-- First, create an enhanced trigger function for automatic winner advancement
CREATE OR REPLACE FUNCTION public.trigger_auto_advance_winner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Only trigger when a winner is set (new winner_id and status completed)
  IF NEW.status = 'completed' 
     AND NEW.winner_id IS NOT NULL 
     AND (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
    
    -- Log the automatic advancement
    RAISE NOTICE 'Auto-advancing winner % for match % in tournament %', 
      NEW.winner_id, NEW.id, NEW.tournament_id;
    
    -- Call the advancement function asynchronously to avoid blocking
    BEGIN
      SELECT public.advance_winner_to_next_round_enhanced(NEW.id, FALSE) INTO v_result;
      RAISE NOTICE 'Winner advancement result: %', v_result;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to auto-advance winner for match %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS trigger_auto_advance_winner ON public.tournament_matches;
DROP TRIGGER IF EXISTS trigger_auto_advance_on_score_update ON public.tournament_matches;

-- Create the main auto-advancement trigger
CREATE TRIGGER trigger_auto_advance_winner
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_auto_advance_winner();

-- Create additional trigger for score updates to ensure advancement
CREATE TRIGGER trigger_auto_advance_on_completion
  AFTER UPDATE OF winner_id, status ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_auto_advance_winner();

-- Create a function to fix current tournament progression issues
CREATE OR REPLACE FUNCTION public.fix_tournament_test6_progression()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tournament_id UUID;
  v_result JSONB;
BEGIN
  -- Find test6 tournament (or any tournament with progression issues)
  SELECT id INTO v_tournament_id 
  FROM public.tournaments 
  WHERE name ILIKE '%test%6%' 
     OR name ILIKE '%test6%'
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF v_tournament_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Test6 tournament not found');
  END IF;
  
  -- Fix the progression using existing function
  SELECT public.fix_all_tournament_progression(v_tournament_id) INTO v_result;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', v_tournament_id,
    'fix_result', v_result
  );
END;
$$;

-- Create automation logging table for monitoring
CREATE TABLE IF NOT EXISTS public.tournament_automation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL,
  match_id UUID,
  automation_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Enable RLS on automation log
ALTER TABLE public.tournament_automation_log ENABLE ROW LEVEL SECURITY;

-- Create policy for automation log (admins can view all, system can insert)
CREATE POLICY "Admins can view automation logs" ON public.tournament_automation_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "System can insert automation logs" ON public.tournament_automation_log
  FOR INSERT WITH CHECK (true);

-- Create enhanced real-time notification function
CREATE OR REPLACE FUNCTION public.notify_winner_advancement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Send real-time notification for winner advancement
  IF NEW.winner_id IS NOT NULL AND (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
    PERFORM pg_notify(
      'winner_advancement', 
      json_build_object(
        'tournament_id', NEW.tournament_id,
        'match_id', NEW.id,
        'winner_id', NEW.winner_id,
        'round', NEW.round_number,
        'match_number', NEW.match_number,
        'timestamp', NOW()
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for real-time notifications
CREATE TRIGGER trigger_notify_winner_advancement
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_winner_advancement();