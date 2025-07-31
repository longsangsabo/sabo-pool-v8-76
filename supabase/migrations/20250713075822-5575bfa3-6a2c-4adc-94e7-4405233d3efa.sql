-- Fix RLS policy to allow joining open challenges
DROP POLICY IF EXISTS "Users can update challenges they're involved in" ON public.challenges;

-- New policy that allows:
-- 1. Users involved in challenge to update it (existing functionality)
-- 2. Users to join open challenges (new functionality)
CREATE POLICY "Users can update challenges they're involved in or join open challenges" 
ON public.challenges 
FOR UPDATE 
USING (
  -- Existing: Users can update challenges they're involved in
  (auth.uid() = challenger_id OR auth.uid() = opponent_id)
  OR 
  -- New: Users can join open challenges where they're not the challenger
  (challenge_type = 'open' AND status = 'pending' AND opponent_id IS NULL AND auth.uid() != challenger_id)
);