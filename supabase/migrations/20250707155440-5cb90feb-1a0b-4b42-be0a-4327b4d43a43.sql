-- Add management_status field to tournaments table to handle the extended workflow states
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS management_status TEXT CHECK (management_status IN ('draft', 'open', 'locked', 'ongoing', 'completed', 'cancelled')) DEFAULT 'draft';

-- Update existing tournaments to use management_status based on current status
UPDATE public.tournaments 
SET management_status = CASE 
  WHEN status = 'upcoming' THEN 'draft'
  WHEN status = 'registration_open' THEN 'open' 
  WHEN status = 'registration_closed' THEN 'locked'
  WHEN status = 'in_progress' THEN 'ongoing'
  WHEN status = 'completed' THEN 'completed'
  WHEN status = 'cancelled' THEN 'cancelled'
  ELSE 'draft'
END;

-- Add tournament workflow tracking table
CREATE TABLE IF NOT EXISTS public.tournament_workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  step_status TEXT CHECK (step_status IN ('pending', 'in_progress', 'completed', 'skipped')) DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  notes TEXT,
  automation_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add tournament real-time statistics tracking
CREATE TABLE IF NOT EXISTS public.tournament_realtime_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID UNIQUE REFERENCES public.tournaments(id) ON DELETE CASCADE,
  current_participants INTEGER DEFAULT 0,
  checked_in_participants INTEGER DEFAULT 0,
  completed_matches INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  bracket_generated BOOLEAN DEFAULT false,
  prize_distributed BOOLEAN DEFAULT false,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.tournament_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_realtime_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for tournament workflow steps
CREATE POLICY "Everyone can view tournament workflow steps"
ON public.tournament_workflow_steps
FOR SELECT
USING (true);

CREATE POLICY "Tournament organizers can manage workflow steps"
ON public.tournament_workflow_steps
FOR ALL
USING (auth.uid() IN (
  SELECT cp.user_id FROM public.club_profiles cp
  JOIN public.tournaments t ON t.club_id = cp.id
  WHERE t.id = tournament_workflow_steps.tournament_id
));

-- RLS policies for tournament realtime stats
CREATE POLICY "Everyone can view tournament realtime stats"
ON public.tournament_realtime_stats
FOR SELECT
USING (true);

CREATE POLICY "Tournament organizers can manage realtime stats"
ON public.tournament_realtime_stats
FOR ALL
USING (auth.uid() IN (
  SELECT cp.user_id FROM public.club_profiles cp
  JOIN public.tournaments t ON t.club_id = cp.id
  WHERE t.id = tournament_realtime_stats.tournament_id
));

-- Function to update tournament management status and workflow
CREATE OR REPLACE FUNCTION public.update_tournament_management_status(
  p_tournament_id UUID,
  p_new_status TEXT,
  p_completed_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tournament RECORD;
  v_step_number INTEGER;
  v_result JSONB;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament 
  FROM public.tournaments 
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Update tournament management status
  UPDATE public.tournaments 
  SET management_status = p_new_status,
      updated_at = now()
  WHERE id = p_tournament_id;
  
  -- Determine workflow step based on status
  v_step_number := CASE p_new_status
    WHEN 'draft' THEN 1
    WHEN 'open' THEN 2  
    WHEN 'locked' THEN 3
    WHEN 'ongoing' THEN 4
    WHEN 'completed' THEN 6
    ELSE 1
  END;
  
  -- Update workflow steps
  INSERT INTO public.tournament_workflow_steps (
    tournament_id, step_number, step_name, step_status, completed_at, completed_by
  ) VALUES (
    p_tournament_id,
    v_step_number,
    CASE v_step_number
      WHEN 1 THEN 'Tạo giải'
      WHEN 2 THEN 'Mở đăng ký'
      WHEN 3 THEN 'Khóa sổ & Bốc thăm'
      WHEN 4 THEN 'Check-in & Gán bàn'
      WHEN 5 THEN 'Thi đấu & Kết quả'
      WHEN 6 THEN 'Trao giải & SPA'
    END,
    'completed',
    now(),
    p_completed_by
  ) ON CONFLICT (tournament_id, step_number) DO UPDATE SET
    step_status = 'completed',
    completed_at = now(),
    completed_by = EXCLUDED.completed_by;
  
  -- Initialize or update realtime stats
  INSERT INTO public.tournament_realtime_stats (tournament_id, updated_at)
  VALUES (p_tournament_id, now())
  ON CONFLICT (tournament_id) DO UPDATE SET
    updated_at = now();
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'new_status', p_new_status,
    'step_completed', v_step_number
  );
END;
$$;

-- Enable realtime for new tables
ALTER TABLE public.tournament_workflow_steps REPLICA IDENTITY FULL;
ALTER TABLE public.tournament_realtime_stats REPLICA IDENTITY FULL;

ALTER publication supabase_realtime ADD TABLE public.tournament_workflow_steps;
ALTER publication supabase_realtime ADD TABLE public.tournament_realtime_stats;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournament_workflow_steps_tournament_id ON public.tournament_workflow_steps(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_realtime_stats_tournament_id ON public.tournament_realtime_stats(tournament_id);

-- Create triggers for updated_at
CREATE TRIGGER update_tournament_workflow_steps_updated_at
BEFORE UPDATE ON public.tournament_workflow_steps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournament_realtime_stats_updated_at
BEFORE UPDATE ON public.tournament_realtime_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();