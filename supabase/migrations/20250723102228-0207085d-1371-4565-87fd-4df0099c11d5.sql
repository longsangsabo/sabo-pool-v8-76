-- Tạo hoặc cập nhật table tournament_registrations với đầy đủ columns cần thiết
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL,
  user_id UUID NOT NULL,
  registration_status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  entry_fee NUMERIC DEFAULT 0,
  registration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(tournament_id, user_id)
);

-- Thêm các columns thiếu nếu table đã tồn tại
DO $$ 
BEGIN
  -- Thêm entry_fee column nếu chưa có
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tournament_registrations' 
    AND column_name = 'entry_fee'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.tournament_registrations 
    ADD COLUMN entry_fee NUMERIC DEFAULT 0;
  END IF;
  
  -- Thêm payment_method column nếu chưa có
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tournament_registrations' 
    AND column_name = 'payment_method'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.tournament_registrations 
    ADD COLUMN payment_method TEXT;
  END IF;
  
  -- Thêm notes column nếu chưa có
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tournament_registrations' 
    AND column_name = 'notes'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.tournament_registrations 
    ADD COLUMN notes TEXT;
  END IF;
  
  -- Thêm registration_date column nếu chưa có
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tournament_registrations' 
    AND column_name = 'registration_date'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.tournament_registrations 
    ADD COLUMN registration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Tạo policies cho RLS
DROP POLICY IF EXISTS "Users can register for tournaments" ON public.tournament_registrations;
CREATE POLICY "Users can register for tournaments" 
ON public.tournament_registrations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own registrations" ON public.tournament_registrations;
CREATE POLICY "Users can view their own registrations" 
ON public.tournament_registrations 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own registrations" ON public.tournament_registrations;
CREATE POLICY "Users can update their own registrations" 
ON public.tournament_registrations 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Tournament organizers can view registrations" ON public.tournament_registrations;
CREATE POLICY "Tournament organizers can view registrations" 
ON public.tournament_registrations 
FOR SELECT 
USING (
  tournament_id IN (
    SELECT id FROM public.tournaments 
    WHERE created_by = auth.uid() 
    OR club_id IN (
      SELECT id FROM public.club_profiles 
      WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Tournament organizers can update registrations" ON public.tournament_registrations;
CREATE POLICY "Tournament organizers can update registrations" 
ON public.tournament_registrations 
FOR UPDATE 
USING (
  tournament_id IN (
    SELECT id FROM public.tournaments 
    WHERE created_by = auth.uid() 
    OR club_id IN (
      SELECT id FROM public.club_profiles 
      WHERE user_id = auth.uid()
    )
  )
);

-- Tạo indexes để tối ưu performance
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament_id 
ON public.tournament_registrations(tournament_id);

CREATE INDEX IF NOT EXISTS idx_tournament_registrations_user_id 
ON public.tournament_registrations(user_id);

CREATE INDEX IF NOT EXISTS idx_tournament_registrations_status 
ON public.tournament_registrations(registration_status);

-- Tạo trigger để auto update updated_at
CREATE OR REPLACE FUNCTION update_tournament_registrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tournament_registrations_updated_at_trigger ON public.tournament_registrations;
CREATE TRIGGER update_tournament_registrations_updated_at_trigger
  BEFORE UPDATE ON public.tournament_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_tournament_registrations_updated_at();