-- Add test scheduling functionality to rank requests
ALTER TABLE public.rank_requests ADD COLUMN IF NOT EXISTS test_scheduled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.rank_requests ADD COLUMN IF NOT EXISTS test_location TEXT;
ALTER TABLE public.rank_requests ADD COLUMN IF NOT EXISTS test_notes TEXT;
ALTER TABLE public.rank_requests ADD COLUMN IF NOT EXISTS test_result_score INTEGER;
ALTER TABLE public.rank_requests ADD COLUMN IF NOT EXISTS test_result_notes TEXT;
ALTER TABLE public.rank_requests ADD COLUMN IF NOT EXISTS club_notes TEXT;

-- Create rank test schedules table
CREATE TABLE IF NOT EXISTS public.rank_test_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_request_id UUID NOT NULL REFERENCES public.rank_requests(id) ON DELETE CASCADE,
  club_id UUID NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  test_type TEXT DEFAULT 'practical' CHECK (test_type IN ('practical', 'written', 'both')),
  duration_minutes INTEGER DEFAULT 60,
  max_participants INTEGER DEFAULT 1,
  current_participants INTEGER DEFAULT 0,
  instructor_notes TEXT,
  equipment_needed TEXT[],
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(user_id)
);

-- Enable RLS on rank_test_schedules
ALTER TABLE public.rank_test_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for rank_test_schedules
CREATE POLICY "Club owners can manage their test schedules"
ON public.rank_test_schedules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.club_profiles cp
    WHERE cp.id = rank_test_schedules.club_id 
    AND cp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.club_profiles cp
    WHERE cp.id = rank_test_schedules.club_id 
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Players can view their test schedules"
ON public.rank_test_schedules
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.rank_requests rr
    WHERE rr.id = rank_test_schedules.rank_request_id
    AND rr.user_id = auth.uid()
  )
);

-- Create notification templates for test scheduling
INSERT INTO public.notification_templates (
  template_key, category, title_template, message_template, default_priority
) VALUES 
(
  'test_scheduled',
  'ranking',
  'Lịch test hạng đã được xắp xếp',
  'CLB {{club_name}} đã xắp xếp lịch test hạng {{rank}} vào {{test_time}} tại {{location}}',
  'high'
),
(
  'test_completed',
  'ranking', 
  'Kết quả test hạng',
  'Bạn đã {{result}} bài test hạng {{rank}} tại CLB {{club_name}}. {{notes}}',
  'high'
),
(
  'test_rescheduled',
  'ranking',
  'Lịch test hạng đã thay đổi',
  'CLB {{club_name}} đã thay đổi lịch test hạng của bạn thành {{new_time}} tại {{location}}',
  'normal'
) ON CONFLICT (template_key) DO NOTHING;

-- Create function to auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_rank_test_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating timestamps
CREATE TRIGGER update_rank_test_schedules_updated_at
  BEFORE UPDATE ON public.rank_test_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rank_test_schedules_updated_at();