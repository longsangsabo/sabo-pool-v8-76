-- Create club_registrations table for multi-step club registration
CREATE TABLE public.club_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Step 1: Basic Info
  club_name TEXT NOT NULL,
  address TEXT NOT NULL,
  district TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  opening_time TIME NOT NULL,
  closing_time TIME NOT NULL,
  table_count INTEGER NOT NULL,
  table_types TEXT[] NOT NULL,
  basic_price DECIMAL(10,2) NOT NULL,
  
  -- Step 2: Detailed pricing
  normal_hour_price DECIMAL(10,2),
  peak_hour_price DECIMAL(10,2),
  weekend_price DECIMAL(10,2),
  vip_table_price DECIMAL(10,2),
  
  -- Step 2: Amenities
  amenities JSONB DEFAULT '{}',
  
  -- Step 2: Photos
  photos TEXT[] DEFAULT '{}',
  
  -- Step 3: Verification info
  facebook_url TEXT,
  google_maps_url TEXT,
  business_license_url TEXT,
  manager_name TEXT,
  manager_phone TEXT,
  email TEXT,
  
  -- Status management
  status TEXT CHECK (status IN ('draft', 'pending', 'approved', 'rejected')) DEFAULT 'draft',
  rejection_reason TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.club_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own club registrations"
  ON public.club_registrations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own club registrations"
  ON public.club_registrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own draft registrations"
  ON public.club_registrations
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'draft');

-- Admin can view all registrations
CREATE POLICY "Admins can view all club registrations"
  ON public.club_registrations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Admin can update any registration
CREATE POLICY "Admins can update club registrations"
  ON public.club_registrations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_club_registrations_updated_at
  BEFORE UPDATE ON public.club_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_club_registrations_user_id ON public.club_registrations(user_id);
CREATE INDEX idx_club_registrations_status ON public.club_registrations(status);