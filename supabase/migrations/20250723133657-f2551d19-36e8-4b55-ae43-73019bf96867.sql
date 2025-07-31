-- 🚨 FIX CRITICAL: Thêm missing RLS policies cho club owners

-- Thêm policy để club owners có thể view rank requests của club họ
CREATE POLICY "Club owners can view rank requests for their club"
ON public.rank_requests FOR SELECT
TO authenticated
USING (
  club_id IN (
    SELECT id FROM public.club_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Thêm policy để club owners có thể update rank requests của club họ  
CREATE POLICY "Club owners can update rank requests for their club"
ON public.rank_requests FOR UPDATE
TO authenticated
USING (
  club_id IN (
    SELECT id FROM public.club_profiles 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  club_id IN (
    SELECT id FROM public.club_profiles 
    WHERE user_id = auth.uid()
  )
);