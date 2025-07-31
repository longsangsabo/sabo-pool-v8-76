-- Tạo table spa_points_log để log các giao dịch điểm SPA
CREATE TABLE IF NOT EXISTS public.spa_points_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points_earned INTEGER NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  tournament_id UUID,
  match_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spa_points_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own SPA points log" ON public.spa_points_log;
CREATE POLICY "Users can view their own SPA points log" 
ON public.spa_points_log 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert SPA points log" ON public.spa_points_log;
CREATE POLICY "System can insert SPA points log" 
ON public.spa_points_log 
FOR INSERT 
WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_spa_points_log_user_id 
ON public.spa_points_log(user_id);

CREATE INDEX IF NOT EXISTS idx_spa_points_log_category 
ON public.spa_points_log(category);

CREATE INDEX IF NOT EXISTS idx_spa_points_log_created_at 
ON public.spa_points_log(created_at);