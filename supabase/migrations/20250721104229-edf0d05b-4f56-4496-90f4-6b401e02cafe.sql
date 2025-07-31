
-- Phase 1: Create comprehensive database schema for club management system

-- 1. Create comprehensive club_registrations table (replacing existing simple one)
CREATE TABLE IF NOT EXISTS public.club_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Basic Information
  club_name TEXT NOT NULL,
  club_code TEXT UNIQUE,
  description TEXT,
  
  -- Location Information
  address TEXT NOT NULL,
  district TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT DEFAULT 'Ho Chi Minh City',
  postal_code TEXT,
  coordinates JSONB, -- {lat, lng}
  
  -- Contact Information
  phone TEXT NOT NULL,
  email TEXT,
  website TEXT,
  facebook_url TEXT,
  
  -- Operating Information
  opening_hours JSONB NOT NULL, -- {monday: {open: "08:00", close: "22:00"}, ...}
  table_count INTEGER NOT NULL CHECK (table_count > 0),
  table_types TEXT[] NOT NULL,
  
  -- Pricing Information
  basic_hourly_rate DECIMAL(10,2) NOT NULL,
  peak_hour_rate DECIMAL(10,2),
  weekend_rate DECIMAL(10,2),
  member_discount_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Facilities & Services
  facilities TEXT[], -- pool tables, cue rental, food service, etc.
  services TEXT[], -- lessons, tournaments, maintenance, etc.
  amenities JSONB DEFAULT '{}', -- parking, wifi, AC, etc.
  
  -- Media & Documentation
  logo_url TEXT,
  photos TEXT[] DEFAULT '{}',
  business_license_url TEXT,
  tax_registration_url TEXT,
  
  -- Registration Status
  status TEXT CHECK (status IN ('draft', 'pending', 'under_review', 'approved', 'rejected', 'suspended')) DEFAULT 'draft',
  submission_date TIMESTAMP WITH TIME ZONE,
  review_date TIMESTAMP WITH TIME ZONE,
  approval_date TIMESTAMP WITH TIME ZONE,
  
  -- Review Information
  reviewed_by UUID,
  reviewer_notes TEXT,
  rejection_reason TEXT,
  
  -- Financial Information
  monthly_fee DECIMAL(10,2) DEFAULT 0,
  setup_fee DECIMAL(10,2) DEFAULT 0,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled')) DEFAULT 'pending',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create club_instructors table
CREATE TABLE IF NOT EXISTS public.club_instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL,
  user_id UUID,
  
  -- Personal Information
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  
  -- Professional Information
  experience_years INTEGER DEFAULT 0,
  specializations TEXT[], -- 8-ball, 9-ball, snooker, etc.
  bio TEXT,
  
  -- Certification Information
  certifications JSONB DEFAULT '[]', -- array of certification objects
  verified_ranks TEXT[], -- ranks they can verify
  
  -- Availability
  availability_schedule JSONB DEFAULT '{}', -- weekly schedule
  is_active BOOLEAN DEFAULT true,
  
  -- Performance Metrics
  total_students INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  
  -- Metadata
  hired_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create comprehensive rank_verifications table
CREATE TABLE IF NOT EXISTS public.rank_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  club_id UUID NOT NULL,
  instructor_id UUID,
  
  -- Rank Information
  current_rank TEXT,
  requested_rank TEXT NOT NULL,
  rank_category TEXT DEFAULT 'pool', -- pool, snooker, carom
  
  -- Application Information
  application_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  application_notes TEXT,
  evidence_photos TEXT[] DEFAULT '{}',
  video_evidence_url TEXT,
  
  -- Test Information
  test_scheduled_date TIMESTAMP WITH TIME ZONE,
  test_actual_date TIMESTAMP WITH TIME ZONE,
  test_location TEXT,
  test_duration_minutes INTEGER,
  
  -- Test Results
  test_score DECIMAL(5,2),
  max_score DECIMAL(5,2) DEFAULT 100,
  practical_score DECIMAL(5,2),
  theory_score DECIMAL(5,2),
  
  -- Detailed Assessment
  skills_assessment JSONB DEFAULT '{}', -- detailed skill breakdown
  strengths TEXT[],
  areas_for_improvement TEXT[],
  
  -- Status Management
  status TEXT CHECK (status IN ('pending', 'scheduled', 'testing', 'completed', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending',
  
  -- Approval Information
  verified_by UUID,
  verification_date TIMESTAMP WITH TIME ZONE,
  certificate_url TEXT,
  certificate_number TEXT,
  
  -- Feedback
  instructor_feedback TEXT,
  student_feedback TEXT,
  club_notes TEXT,
  
  -- Financial
  test_fee DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Create test_schedules table
CREATE TABLE IF NOT EXISTS public.test_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL,
  instructor_id UUID,
  
  -- Schedule Information
  test_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  
  -- Test Details
  test_type TEXT NOT NULL, -- rank_verification, skill_assessment, etc.
  max_participants INTEGER DEFAULT 1,
  current_participants INTEGER DEFAULT 0,
  
  -- Requirements
  rank_requirements TEXT[],
  skill_requirements TEXT[],
  equipment_needed TEXT[],
  
  -- Booking Information
  booking_deadline TIMESTAMP WITH TIME ZONE,
  cancellation_policy TEXT,
  
  -- Status
  status TEXT CHECK (status IN ('available', 'booked', 'in_progress', 'completed', 'cancelled')) DEFAULT 'available',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Create club_members table
CREATE TABLE IF NOT EXISTS public.club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- Membership Information
  membership_type TEXT DEFAULT 'regular', -- regular, vip, premium
  membership_number TEXT UNIQUE,
  join_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Status
  status TEXT CHECK (status IN ('active', 'inactive', 'suspended', 'expired')) DEFAULT 'active',
  expiry_date TIMESTAMP WITH TIME ZONE,
  
  -- Activity Tracking
  total_visits INTEGER DEFAULT 0,
  last_visit TIMESTAMP WITH TIME ZONE,
  total_hours_played INTEGER DEFAULT 0,
  
  -- Preferences
  preferred_table_types TEXT[],
  preferred_time_slots TEXT[],
  notification_preferences JSONB DEFAULT '{}',
  
  -- Financial
  membership_fee DECIMAL(10,2) DEFAULT 0,
  outstanding_balance DECIMAL(10,2) DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Create club_facilities table
CREATE TABLE IF NOT EXISTS public.club_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL,
  
  -- Facility Information
  facility_name TEXT NOT NULL,
  facility_type TEXT NOT NULL, -- pool_table, snooker_table, seating_area, etc.
  facility_code TEXT,
  
  -- Specifications
  specifications JSONB DEFAULT '{}', -- size, brand, model, etc.
  capacity INTEGER,
  
  -- Status
  status TEXT CHECK (status IN ('active', 'maintenance', 'out_of_order', 'retired')) DEFAULT 'active',
  condition_rating INTEGER CHECK (condition_rating >= 1 AND condition_rating <= 5),
  
  -- Maintenance
  last_maintenance_date TIMESTAMP WITH TIME ZONE,
  next_maintenance_date TIMESTAMP WITH TIME ZONE,
  maintenance_notes TEXT,
  
  -- Usage Tracking
  total_usage_hours INTEGER DEFAULT 0,
  usage_this_month INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Create rank_test_results table
CREATE TABLE IF NOT EXISTS public.rank_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_verification_id UUID NOT NULL,
  test_schedule_id UUID,
  
  -- Test Session Information
  test_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  
  -- Scores
  overall_score DECIMAL(5,2) NOT NULL,
  practical_score DECIMAL(5,2),
  theory_score DECIMAL(5,2),
  
  -- Detailed Results
  skill_scores JSONB DEFAULT '{}', -- detailed breakdown by skill
  test_data JSONB DEFAULT '{}', -- raw test data
  
  -- Assessment
  pass_status BOOLEAN,
  grade TEXT, -- A, B, C, D, F
  percentile DECIMAL(5,2),
  
  -- Feedback
  detailed_feedback TEXT,
  recommendations TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Create instructor_certifications table
CREATE TABLE IF NOT EXISTS public.instructor_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL,
  
  -- Certification Information
  certification_name TEXT NOT NULL,
  certification_type TEXT NOT NULL, -- rank_verification, teaching, judging
  issuing_organization TEXT NOT NULL,
  
  -- Certificate Details
  certificate_number TEXT UNIQUE,
  certificate_url TEXT,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  
  -- Scope
  valid_for_ranks TEXT[],
  valid_for_games TEXT[], -- 8-ball, 9-ball, snooker, etc.
  
  -- Status
  status TEXT CHECK (status IN ('active', 'expired', 'suspended', 'revoked')) DEFAULT 'active',
  
  -- Verification
  verified_by UUID,
  verification_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_club_registrations_user_id ON public.club_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_club_registrations_status ON public.club_registrations(status);
CREATE INDEX IF NOT EXISTS idx_club_instructors_club_id ON public.club_instructors(club_id);
CREATE INDEX IF NOT EXISTS idx_club_instructors_user_id ON public.club_instructors(user_id);
CREATE INDEX IF NOT EXISTS idx_rank_verifications_user_id ON public.rank_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_rank_verifications_club_id ON public.rank_verifications(club_id);
CREATE INDEX IF NOT EXISTS idx_rank_verifications_status ON public.rank_verifications(status);
CREATE INDEX IF NOT EXISTS idx_test_schedules_club_id ON public.test_schedules(club_id);
CREATE INDEX IF NOT EXISTS idx_test_schedules_date ON public.test_schedules(test_date);
CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON public.club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user_id ON public.club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_club_facilities_club_id ON public.club_facilities(club_id);

-- Enable RLS on all tables
ALTER TABLE public.club_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_certifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for club_registrations
CREATE POLICY "Users can view their own registrations" ON public.club_registrations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own registrations" ON public.club_registrations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own draft registrations" ON public.club_registrations
  FOR UPDATE USING (user_id = auth.uid() AND status = 'draft');

CREATE POLICY "Admins can view all registrations" ON public.club_registrations
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can update registrations" ON public.club_registrations
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true));

-- Create RLS policies for club_instructors
CREATE POLICY "Club owners can manage their instructors" ON public.club_instructors
  FOR ALL USING (club_id IN (SELECT id FROM public.club_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view instructors" ON public.club_instructors
  FOR SELECT USING (is_active = true);

-- Create RLS policies for rank_verifications
CREATE POLICY "Users can view their own rank verifications" ON public.rank_verifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own rank verifications" ON public.rank_verifications
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Club owners can view verifications for their club" ON public.rank_verifications
  FOR SELECT USING (club_id IN (SELECT id FROM public.club_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Club owners can update verifications for their club" ON public.rank_verifications
  FOR UPDATE USING (club_id IN (SELECT id FROM public.club_profiles WHERE user_id = auth.uid()));

-- Create RLS policies for test_schedules
CREATE POLICY "Anyone can view available test schedules" ON public.test_schedules
  FOR SELECT USING (status = 'available');

CREATE POLICY "Club owners can manage their test schedules" ON public.test_schedules
  FOR ALL USING (club_id IN (SELECT id FROM public.club_profiles WHERE user_id = auth.uid()));

-- Create RLS policies for club_members
CREATE POLICY "Users can view their own membership" ON public.club_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Club owners can view their club members" ON public.club_members
  FOR SELECT USING (club_id IN (SELECT id FROM public.club_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Club owners can manage their club members" ON public.club_members
  FOR ALL USING (club_id IN (SELECT id FROM public.club_profiles WHERE user_id = auth.uid()));

-- Create RLS policies for club_facilities
CREATE POLICY "Users can view club facilities" ON public.club_facilities
  FOR SELECT USING (true);

CREATE POLICY "Club owners can manage their facilities" ON public.club_facilities
  FOR ALL USING (club_id IN (SELECT id FROM public.club_profiles WHERE user_id = auth.uid()));

-- Create RLS policies for rank_test_results
CREATE POLICY "Users can view their own test results" ON public.rank_test_results
  FOR SELECT USING (
    rank_verification_id IN (SELECT id FROM public.rank_verifications WHERE user_id = auth.uid())
  );

CREATE POLICY "Club owners can view test results for their club" ON public.rank_test_results
  FOR SELECT USING (
    rank_verification_id IN (
      SELECT id FROM public.rank_verifications 
      WHERE club_id IN (SELECT id FROM public.club_profiles WHERE user_id = auth.uid())
    )
  );

-- Create RLS policies for instructor_certifications
CREATE POLICY "Users can view instructor certifications" ON public.instructor_certifications
  FOR SELECT USING (
    instructor_id IN (SELECT id FROM public.club_instructors WHERE is_active = true)
  );

CREATE POLICY "Club owners can manage their instructor certifications" ON public.instructor_certifications
  FOR ALL USING (
    instructor_id IN (
      SELECT id FROM public.club_instructors 
      WHERE club_id IN (SELECT id FROM public.club_profiles WHERE user_id = auth.uid())
    )
  );

-- Create foreign key constraints
ALTER TABLE public.club_instructors ADD CONSTRAINT fk_club_instructors_club_id 
  FOREIGN KEY (club_id) REFERENCES public.club_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.rank_verifications ADD CONSTRAINT fk_rank_verifications_club_id 
  FOREIGN KEY (club_id) REFERENCES public.club_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.rank_verifications ADD CONSTRAINT fk_rank_verifications_instructor_id 
  FOREIGN KEY (instructor_id) REFERENCES public.club_instructors(id) ON DELETE SET NULL;

ALTER TABLE public.test_schedules ADD CONSTRAINT fk_test_schedules_club_id 
  FOREIGN KEY (club_id) REFERENCES public.club_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.test_schedules ADD CONSTRAINT fk_test_schedules_instructor_id 
  FOREIGN KEY (instructor_id) REFERENCES public.club_instructors(id) ON DELETE SET NULL;

ALTER TABLE public.club_members ADD CONSTRAINT fk_club_members_club_id 
  FOREIGN KEY (club_id) REFERENCES public.club_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.club_facilities ADD CONSTRAINT fk_club_facilities_club_id 
  FOREIGN KEY (club_id) REFERENCES public.club_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.rank_test_results ADD CONSTRAINT fk_rank_test_results_verification_id 
  FOREIGN KEY (rank_verification_id) REFERENCES public.rank_verifications(id) ON DELETE CASCADE;

ALTER TABLE public.rank_test_results ADD CONSTRAINT fk_rank_test_results_schedule_id 
  FOREIGN KEY (test_schedule_id) REFERENCES public.test_schedules(id) ON DELETE SET NULL;

ALTER TABLE public.instructor_certifications ADD CONSTRAINT fk_instructor_certifications_instructor_id 
  FOREIGN KEY (instructor_id) REFERENCES public.club_instructors(id) ON DELETE CASCADE;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_club_registrations_updated_at BEFORE UPDATE ON public.club_registrations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_club_instructors_updated_at BEFORE UPDATE ON public.club_instructors
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rank_verifications_updated_at BEFORE UPDATE ON public.rank_verifications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_test_schedules_updated_at BEFORE UPDATE ON public.test_schedules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_club_members_updated_at BEFORE UPDATE ON public.club_members
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_club_facilities_updated_at BEFORE UPDATE ON public.club_facilities
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rank_test_results_updated_at BEFORE UPDATE ON public.rank_test_results
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_instructor_certifications_updated_at BEFORE UPDATE ON public.instructor_certifications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
