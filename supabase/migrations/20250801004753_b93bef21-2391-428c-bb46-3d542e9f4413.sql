-- Fix RLS policy for challenges to allow updating open challenges
DROP POLICY "Users can update challenges they're involved in" ON public.challenges;

CREATE POLICY "Users can update challenges they're involved in" 
ON public.challenges 
FOR UPDATE 
USING (
  (auth.uid() = challenger_id) 
  OR (auth.uid() = opponent_id) 
  OR (opponent_id IS NULL AND status = 'pending')  -- Allow accepting open challenges
);