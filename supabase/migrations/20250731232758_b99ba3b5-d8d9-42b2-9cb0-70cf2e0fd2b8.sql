-- Fix RLS policy for challenges table to allow viewing open challenges
-- This is critical for the open challenge feature to work

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their challenges" ON public.challenges;

-- Create a new policy that allows users to:
-- 1. View challenges they are involved in (challenger or opponent)
-- 2. View open challenges (no opponent_id) that they can join
CREATE POLICY "Users can view challenges they're involved in or open challenges" 
ON public.challenges 
FOR SELECT 
USING (
  -- Can view challenges where they are challenger or opponent
  (auth.uid() = challenger_id) OR 
  (auth.uid() = opponent_id) OR 
  -- Can view open challenges (no opponent assigned yet) that they can potentially join
  (opponent_id IS NULL AND status = 'pending')
);