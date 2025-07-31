-- TASK 8: FILE CLEANUP SYSTEM - DATABASE TABLES

-- Table to log file cleanup activities
CREATE TABLE IF NOT EXISTS public.file_cleanup_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_name TEXT NOT NULL,
  files_found INTEGER NOT NULL DEFAULT 0,
  files_deleted INTEGER NOT NULL DEFAULT 0,
  total_size BIGINT NOT NULL DEFAULT 0,
  action_type TEXT NOT NULL CHECK (action_type IN ('scan', 'cleanup')),
  orphaned_files JSONB DEFAULT '[]'::jsonb,
  execution_time_ms INTEGER,
  errors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Table for file cleanup configuration
CREATE TABLE IF NOT EXISTS public.file_cleanup_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  retention_days INTEGER DEFAULT 30,
  max_file_age_days INTEGER DEFAULT 90,
  auto_cleanup_enabled BOOLEAN DEFAULT false,
  cleanup_schedule TEXT DEFAULT '0 2 * * 0', -- Weekly at 2 AM on Sunday
  last_cleanup_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for system logs (if not exists)
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  log_type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_cleanup_logs_bucket_date 
ON public.file_cleanup_logs (bucket_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_file_cleanup_logs_action_type 
ON public.file_cleanup_logs (action_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_logs_type_date 
ON public.system_logs (log_type, created_at DESC);

-- Insert default configuration for storage buckets
INSERT INTO public.file_cleanup_config (bucket_name, retention_days, max_file_age_days, auto_cleanup_enabled) VALUES
  ('avatars', 30, 180, false),
  ('tournament-banners', 60, 365, false),
  ('club-photos', 90, 730, false),
  ('match-evidence', 180, 1095, false)
ON CONFLICT (bucket_name) DO NOTHING;

-- RLS Policies
ALTER TABLE public.file_cleanup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_cleanup_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Admin can view all cleanup logs
CREATE POLICY "Admins can view all file cleanup logs"
ON public.file_cleanup_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Admin can manage cleanup config
CREATE POLICY "Admins can manage file cleanup config"
ON public.file_cleanup_config FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Admin can view system logs
CREATE POLICY "Admins can view system logs"
ON public.system_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- System can insert logs
CREATE POLICY "System can insert file cleanup logs"
ON public.file_cleanup_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can insert system logs"
ON public.system_logs FOR INSERT
WITH CHECK (true);