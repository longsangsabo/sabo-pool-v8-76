-- Create basic schema for the application

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  display_name text,
  avatar_url text,
  bio text,
  verified_rank text,
  elo integer DEFAULT 1000,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create challenges table
CREATE TABLE public.challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  challenge_message text,
  response_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone,
  completed_at timestamp with time zone
);

-- Create rank_requests table
CREATE TABLE public.rank_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_rank text NOT NULL,
  current_rank text,
  evidence_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create player_availability table
CREATE TABLE public.player_availability (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  available_until timestamp with time zone,
  location text,
  max_distance_km integer DEFAULT 10,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_availability ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for challenges
CREATE POLICY "Users can view their challenges" 
ON public.challenges FOR SELECT 
TO authenticated
USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

CREATE POLICY "Users can create challenges" 
ON public.challenges FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Users can update challenges they're involved in" 
ON public.challenges FOR UPDATE 
TO authenticated
USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- Create RLS policies for rank_requests
CREATE POLICY "Users can view their own rank requests" 
ON public.rank_requests FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own rank requests" 
ON public.rank_requests FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for player_availability
CREATE POLICY "Users can view all availability" 
ON public.player_availability FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can manage their own availability" 
ON public.player_availability FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rank_requests_updated_at
  BEFORE UPDATE ON public.rank_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_player_availability_updated_at
  BEFORE UPDATE ON public.player_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function for expiring old challenges
CREATE OR REPLACE FUNCTION public.expire_old_challenges()
RETURNS void AS $$
BEGIN
  UPDATE public.challenges 
  SET status = 'expired' 
  WHERE status = 'pending' 
  AND created_at < now() - interval '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;