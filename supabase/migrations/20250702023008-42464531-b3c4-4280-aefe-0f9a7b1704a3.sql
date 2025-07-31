-- Add missing fields to challenges table
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS stake_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS stake_type TEXT CHECK (stake_type IN ('friendly', 'money', 'drinks')) DEFAULT 'friendly';
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '48 hours');
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS response_message TEXT;

-- Update status check constraint
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_status_check;
ALTER TABLE public.challenges ADD CONSTRAINT challenges_status_check 
  CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled', 'completed'));

-- Add RLS policies for challenges
CREATE POLICY "Users can create challenges" ON public.challenges
  FOR INSERT WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Users can update challenges they're involved in" ON public.challenges
  FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- Add RLS policies for matches
CREATE POLICY "Users can create matches for accepted challenges" ON public.matches
  FOR INSERT WITH CHECK (
    auth.uid() = player1_id OR auth.uid() = player2_id
  );

CREATE POLICY "Users can update match results they participated in" ON public.matches
  FOR UPDATE USING (
    auth.uid() = player1_id OR auth.uid() = player2_id
  );

-- Auto-expire challenges trigger
CREATE OR REPLACE FUNCTION expire_old_challenges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.challenges 
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < now();
END;
$$;

-- Create notification function for challenges
CREATE OR REPLACE FUNCTION notify_challenge_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This would integrate with notification system
  -- For now, just log the change
  RAISE NOTICE 'Challenge % status changed to %', NEW.id, NEW.status;
  RETURN NEW;
END;
$$;

-- Create trigger for challenge responses
CREATE OR REPLACE TRIGGER challenge_response_trigger
  AFTER UPDATE ON public.challenges
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status IN ('accepted', 'declined'))
  EXECUTE FUNCTION notify_challenge_response();