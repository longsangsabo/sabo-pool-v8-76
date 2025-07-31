-- Fix function signatures và cải thiện các function
CREATE OR REPLACE FUNCTION public.credit_spa_points(
  p_user_id UUID,
  p_points INTEGER,
  p_category TEXT,
  p_description TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_points INTEGER;
  v_new_points INTEGER;
BEGIN
  -- Get current SPA points
  SELECT COALESCE(spa_points, 0) INTO v_current_points
  FROM player_rankings
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Create new ranking record if doesn't exist
    INSERT INTO player_rankings (user_id, spa_points, updated_at)
    VALUES (p_user_id, p_points, NOW());
    v_new_points := p_points;
  ELSE
    -- Update existing record
    v_new_points := v_current_points + p_points;
    UPDATE player_rankings 
    SET spa_points = v_new_points,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
  
  -- Log the points transaction
  INSERT INTO spa_points_log (user_id, points_earned, category, description, created_at)
  VALUES (p_user_id, p_points, p_category, p_description, NOW());
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'points_credited', p_points,
    'previous_points', v_current_points,
    'new_total', v_new_points,
    'category', p_category,
    'description', p_description
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'user_id', p_user_id,
      'points_attempted', p_points
    );
END;
$function$;

-- Kiểm tra và tạo bảng spa_points_log nếu chưa có
CREATE TABLE IF NOT EXISTS public.spa_points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  points_earned INTEGER NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS cho spa_points_log
ALTER TABLE public.spa_points_log ENABLE ROW LEVEL SECURITY;

-- Policy cho spa_points_log
CREATE POLICY "Users can view their own SPA logs" 
ON public.spa_points_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert SPA logs" 
ON public.spa_points_log 
FOR INSERT 
WITH CHECK (true);