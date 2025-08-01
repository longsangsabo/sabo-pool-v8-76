-- Fix race condition for open challenges and add auto-transitions
-- 1. Add unique constraint to prevent race conditions on open challenges
ALTER TABLE public.challenges 
ADD CONSTRAINT unique_accepted_open_challenge 
EXCLUDE (challenger_id WITH =) 
WHERE (opponent_id IS NULL AND status = 'accepted');

-- 2. Add trigger for auto-transition from accepted to ongoing
CREATE OR REPLACE FUNCTION public.auto_transition_challenge_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto transition from accepted to ongoing after 10 minutes
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Schedule transition to ongoing in 10 minutes
    PERFORM pg_notify('challenge_status_transition', 
      json_build_object(
        'challenge_id', NEW.id,
        'from_status', 'accepted',
        'to_status', 'ongoing',
        'scheduled_for', NOW() + INTERVAL '10 minutes'
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER challenge_status_transition_trigger
  AFTER UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_transition_challenge_status();

-- 3. Add function for cleanup expired challenges
CREATE OR REPLACE FUNCTION public.cleanup_expired_challenges()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Cancel challenges that have expired
  UPDATE public.challenges 
  SET status = 'expired', 
      updated_at = NOW()
  WHERE status = 'pending' 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Log cleanup
  INSERT INTO public.notifications (user_id, title, message, type, metadata)
  SELECT 
    challenger_id,
    'Thách đấu đã hết hạn',
    'Thách đấu của bạn đã hết hạn và được tự động hủy',
    'info',
    jsonb_build_object('challenge_id', id, 'cleanup_type', 'expired')
  FROM public.challenges 
  WHERE status = 'expired' 
    AND updated_at > NOW() - INTERVAL '1 minute';
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Add RLS policies for open challenges
DROP POLICY IF EXISTS "Users can view challenges they're involved in or open challenge" ON public.challenges;

CREATE POLICY "Users can view challenges they're involved in or open challenges" 
ON public.challenges 
FOR SELECT 
USING (
  auth.uid() = challenger_id 
  OR auth.uid() = opponent_id 
  OR (opponent_id IS NULL AND status = 'pending')
);

-- 5. Add policy for accepting open challenges
CREATE POLICY "Users can accept open challenges" 
ON public.challenges 
FOR UPDATE 
USING (
  opponent_id IS NULL 
  AND status = 'pending' 
  AND challenger_id != auth.uid()
  AND expires_at > NOW()
);

-- 6. Add function to safely accept open challenges (prevents race conditions)
CREATE OR REPLACE FUNCTION public.accept_open_challenge(
  p_challenge_id UUID,
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_challenge RECORD;
BEGIN
  -- Lock the challenge row to prevent race conditions
  SELECT * INTO v_challenge
  FROM public.challenges 
  WHERE id = p_challenge_id 
    AND status = 'pending'
    AND opponent_id IS NULL
    AND challenger_id != p_user_id
    AND expires_at > NOW()
  FOR UPDATE NOWAIT;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Challenge not available or already taken'
    );
  END IF;
  
  -- Update challenge
  UPDATE public.challenges 
  SET opponent_id = p_user_id,
      status = 'accepted',
      responded_at = NOW(),
      updated_at = NOW()
  WHERE id = p_challenge_id;
  
  -- Create match record
  INSERT INTO public.matches (
    player1_id, player2_id, challenge_id, 
    status, match_type, scheduled_time
  ) VALUES (
    v_challenge.challenger_id, p_user_id, p_challenge_id,
    'scheduled', 'challenge', 
    COALESCE(v_challenge.scheduled_time, NOW())
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'challenge_id', p_challenge_id,
    'message', 'Challenge accepted successfully'
  );
  
EXCEPTION
  WHEN lock_not_available THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Challenge is being processed by another user'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;