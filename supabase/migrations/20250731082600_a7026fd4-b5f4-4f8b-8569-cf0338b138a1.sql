-- Fix challenges table to allow NULL opponent_id for open challenges
ALTER TABLE public.challenges ALTER COLUMN opponent_id DROP NOT NULL;

-- Create missing sabo_challenges table
CREATE TABLE public.sabo_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id UUID NOT NULL,
  opponent_id UUID NOT NULL,
  stake_amount INTEGER NOT NULL DEFAULT 100,
  race_to INTEGER NOT NULL DEFAULT 5,
  handicap_challenger INTEGER NOT NULL DEFAULT 0,
  handicap_opponent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'in_progress', 'completed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + '7 days'::interval),
  accepted_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  score_confirmation_timestamp TIMESTAMP WITH TIME ZONE,
  challenger_final_score INTEGER NOT NULL DEFAULT 0,
  opponent_final_score INTEGER NOT NULL DEFAULT 0,
  winner_id UUID,
  rack_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on sabo_challenges
ALTER TABLE public.sabo_challenges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sabo_challenges
CREATE POLICY "Users can view their sabo challenges" 
ON public.sabo_challenges 
FOR SELECT 
USING ((auth.uid() = challenger_id) OR (auth.uid() = opponent_id));

CREATE POLICY "Users can create sabo challenges" 
ON public.sabo_challenges 
FOR INSERT 
WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Users can update their sabo challenges" 
ON public.sabo_challenges 
FOR UPDATE 
USING ((auth.uid() = challenger_id) OR (auth.uid() = opponent_id));

-- Create simulate_sabo_match_progress function (referenced by edge function)
CREATE OR REPLACE FUNCTION public.simulate_sabo_match_progress(
  p_challenge_id UUID,
  p_challenger_score INTEGER,
  p_opponent_score INTEGER,
  p_add_rack_result BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_challenge RECORD;
  v_rack_entry JSONB;
  v_winner_id UUID;
  v_status TEXT;
BEGIN
  -- Get current challenge
  SELECT * INTO v_challenge 
  FROM sabo_challenges 
  WHERE id = p_challenge_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Challenge not found');
  END IF;
  
  -- Update scores
  UPDATE sabo_challenges 
  SET challenger_final_score = p_challenger_score,
      opponent_final_score = p_opponent_score,
      updated_at = NOW()
  WHERE id = p_challenge_id;
  
  -- Add rack result if requested
  IF p_add_rack_result THEN
    v_rack_entry := jsonb_build_object(
      'rack_number', jsonb_array_length(v_challenge.rack_history) + 1,
      'winner_id', CASE WHEN p_challenger_score > p_opponent_score THEN v_challenge.challenger_id ELSE v_challenge.opponent_id END,
      'challenger_total', p_challenger_score,
      'opponent_total', p_opponent_score,
      'timestamp', NOW()
    );
    
    UPDATE sabo_challenges 
    SET rack_history = rack_history || v_rack_entry
    WHERE id = p_challenge_id;
  END IF;
  
  -- Check if match is completed
  IF p_challenger_score >= v_challenge.race_to OR p_opponent_score >= v_challenge.race_to THEN
    v_winner_id := CASE 
      WHEN p_challenger_score >= v_challenge.race_to THEN v_challenge.challenger_id 
      ELSE v_challenge.opponent_id 
    END;
    v_status := 'completed';
    
    UPDATE sabo_challenges 
    SET status = v_status,
        winner_id = v_winner_id,
        score_confirmation_timestamp = NOW()
    WHERE id = p_challenge_id;
  ELSE
    v_status := 'in_progress';
    
    UPDATE sabo_challenges 
    SET status = v_status
    WHERE id = p_challenge_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'challenge_id', p_challenge_id,
    'status', v_status,
    'winner_id', v_winner_id,
    'challenger_score', p_challenger_score,
    'opponent_score', p_opponent_score
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Create updated_at trigger for sabo_challenges
CREATE TRIGGER update_sabo_challenges_updated_at
  BEFORE UPDATE ON public.sabo_challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();