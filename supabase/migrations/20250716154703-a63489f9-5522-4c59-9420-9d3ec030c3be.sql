-- Create rank_test_schedules table for rank verification requests
CREATE TABLE public.rank_test_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  club_id UUID NOT NULL,
  requested_rank TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'scheduled')),
  scheduled_time TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Create indexes for performance
CREATE INDEX idx_rank_test_schedules_user_id ON public.rank_test_schedules(user_id);
CREATE INDEX idx_rank_test_schedules_club_id ON public.rank_test_schedules(club_id);
CREATE INDEX idx_rank_test_schedules_status ON public.rank_test_schedules(status);

-- Enable RLS
ALTER TABLE public.rank_test_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own rank requests" 
ON public.rank_test_schedules FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own rank requests" 
ON public.rank_test_schedules FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Club owners can view requests for their clubs" 
ON public.rank_test_schedules FOR SELECT 
USING (auth.uid() IN (
  SELECT cp.user_id FROM public.club_profiles cp WHERE cp.id = club_id
));

CREATE POLICY "Club owners can update requests for their clubs" 
ON public.rank_test_schedules FOR UPDATE 
USING (auth.uid() IN (
  SELECT cp.user_id FROM public.club_profiles cp WHERE cp.id = club_id
));

-- Create updated_at trigger
CREATE TRIGGER update_rank_test_schedules_updated_at
  BEFORE UPDATE ON public.rank_test_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create notifications table if not exists
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications if not already enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (true);