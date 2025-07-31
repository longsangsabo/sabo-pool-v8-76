-- Fix RLS policy for reward_redemptions (was incorrectly referencing player_availability)
DROP POLICY IF EXISTS "Users can view their own redemptions" ON public.player_availability;

CREATE POLICY "Users can view their own redemptions"
ON public.reward_redemptions FOR SELECT
USING (auth.uid() = user_id);