-- Add user roles to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('player', 'club_owner', 'both')) DEFAULT 'player',
ADD COLUMN IF NOT EXISTS active_role TEXT CHECK (active_role IN ('player', 'club_owner')) DEFAULT 'player';

-- Create club_profiles table
CREATE TABLE public.club_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  operating_hours JSONB, -- {"open": "08:00", "close": "23:00", "days": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]}
  number_of_tables INTEGER DEFAULT 1,
  verification_status TEXT CHECK (verification_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  verification_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create rank_verifications table
CREATE TABLE public.rank_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.club_profiles(id) ON DELETE CASCADE,
  requested_rank TEXT CHECK (requested_rank IN ('A', 'B', 'C', 'D')) NOT NULL,
  current_rank TEXT CHECK (current_rank IN ('A', 'B', 'C', 'D')),
  status TEXT CHECK (status IN ('pending', 'testing', 'approved', 'rejected')) DEFAULT 'pending',
  proof_photos TEXT[], -- URLs to uploaded photos
  test_result TEXT,
  club_notes TEXT,
  rejection_reason TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rank_adjustments table
CREATE TABLE public.rank_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.club_profiles(id) ON DELETE CASCADE,
  current_rank TEXT CHECK (current_rank IN ('A', 'B', 'C', 'D')) NOT NULL,
  requested_rank TEXT CHECK (requested_rank IN ('A', 'B', 'C', 'D')) NOT NULL,
  reason TEXT NOT NULL,
  match_history TEXT, -- Player's explanation of match results
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  club_notes TEXT,
  rejection_reason TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rank_reports table
CREATE TABLE public.rank_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  report_type TEXT CHECK (report_type IN ('false_rank', 'unsportsmanlike', 'other')) DEFAULT 'false_rank',
  reported_rank TEXT CHECK (reported_rank IN ('A', 'B', 'C', 'D')),
  actual_skill_assessment TEXT CHECK (actual_skill_assessment IN ('much_lower', 'lower', 'accurate', 'higher', 'much_higher')),
  description TEXT,
  evidence_photos TEXT[], -- URLs to uploaded evidence
  status TEXT CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')) DEFAULT 'pending',
  admin_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add verified_rank to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verified_rank TEXT CHECK (verified_rank IN ('A', 'B', 'C', 'D')),
ADD COLUMN IF NOT EXISTS rank_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rank_verified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS ban_status TEXT CHECK (ban_status IN ('active', 'banned_7d', 'banned_30d', 'banned_permanent')) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS ban_expires_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on all new tables
ALTER TABLE public.club_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for club_profiles
CREATE POLICY "Users can view all club profiles" 
ON public.club_profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own club profile" 
ON public.club_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own club profile" 
ON public.club_profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for rank_verifications
CREATE POLICY "Users can view rank verifications they're involved in" 
ON public.rank_verifications FOR SELECT 
USING (
  auth.uid() = player_id 
  OR auth.uid() IN (
    SELECT user_id FROM public.club_profiles WHERE id = club_id
  )
);

CREATE POLICY "Players can insert their own rank verification requests" 
ON public.rank_verifications FOR INSERT 
WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Club owners can update verifications for their club" 
ON public.rank_verifications FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.club_profiles WHERE id = club_id
  )
);

-- RLS Policies for rank_adjustments
CREATE POLICY "Users can view rank adjustments they're involved in" 
ON public.rank_adjustments FOR SELECT 
USING (
  auth.uid() = player_id 
  OR auth.uid() IN (
    SELECT user_id FROM public.club_profiles WHERE id = club_id
  )
);

CREATE POLICY "Players can insert their own rank adjustment requests" 
ON public.rank_adjustments FOR INSERT 
WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Club owners can update adjustments for their club" 
ON public.rank_adjustments FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.club_profiles WHERE id = club_id
  )
);

-- RLS Policies for rank_reports
CREATE POLICY "Users can view reports they created or are reported in" 
ON public.rank_reports FOR SELECT 
USING (auth.uid() = reporter_id OR auth.uid() = reported_player_id);

CREATE POLICY "Users can create reports" 
ON public.rank_reports FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

-- Create indexes for better performance
CREATE INDEX idx_club_profiles_user_id ON public.club_profiles(user_id);
CREATE INDEX idx_club_profiles_verification_status ON public.club_profiles(verification_status);
CREATE INDEX idx_rank_verifications_player_id ON public.rank_verifications(player_id);
CREATE INDEX idx_rank_verifications_club_id ON public.rank_verifications(club_id);
CREATE INDEX idx_rank_verifications_status ON public.rank_verifications(status);
CREATE INDEX idx_rank_adjustments_player_id ON public.rank_adjustments(player_id);
CREATE INDEX idx_rank_adjustments_club_id ON public.rank_adjustments(club_id);
CREATE INDEX idx_rank_reports_reported_player_id ON public.rank_reports(reported_player_id);
CREATE INDEX idx_rank_reports_status ON public.rank_reports(status);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_verified_rank ON public.profiles(verified_rank);
CREATE INDEX idx_profiles_ban_status ON public.profiles(ban_status);

-- Create storage bucket for verification photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('verifications', 'verifications', false, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for verification photos
CREATE POLICY "Users can view verification photos they're involved in" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'verifications' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR auth.uid()::text = (storage.foldername(name))[2]
  )
);

CREATE POLICY "Users can upload verification photos" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'verifications' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update profiles updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_club_profiles_updated_at
  BEFORE UPDATE ON public.club_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rank_verifications_updated_at
  BEFORE UPDATE ON public.rank_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rank_adjustments_updated_at
  BEFORE UPDATE ON public.rank_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rank_reports_updated_at
  BEFORE UPDATE ON public.rank_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();