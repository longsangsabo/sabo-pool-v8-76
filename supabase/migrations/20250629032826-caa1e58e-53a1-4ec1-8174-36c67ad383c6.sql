
-- Fix infinite recursion in admin_users policy
DROP POLICY IF EXISTS "Only admins can access admin data" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can access admin data" ON public.admin_users;

-- Create a security definer function to check admin status safely
CREATE OR REPLACE FUNCTION public.is_user_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = user_uuid AND role IN ('system_admin', 'club_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new safe policy for admin_users
CREATE POLICY "Admins can access admin data" ON public.admin_users
FOR ALL USING (public.is_user_admin());

-- Fix user_locations table constraint issue
DROP TABLE IF EXISTS public.user_locations CASCADE;
CREATE TABLE public.user_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS for user_locations
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for user_locations
CREATE POLICY "Users can view their own location" ON public.user_locations
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own location" ON public.user_locations
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own location" ON public.user_locations
FOR UPDATE USING (auth.uid() = user_id);

-- Fix foreign key constraints to reference profiles.user_id instead of auth.users
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_challenger_id_fkey;
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_challenged_id_fkey;
ALTER TABLE public.challenges ADD CONSTRAINT challenges_challenger_id_fkey 
    FOREIGN KEY (challenger_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
ALTER TABLE public.challenges ADD CONSTRAINT challenges_challenged_id_fkey 
    FOREIGN KEY (challenged_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Fix matches foreign keys
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_player1_id_fkey;
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_player2_id_fkey;
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_winner_id_fkey;
ALTER TABLE public.matches ADD CONSTRAINT matches_player1_id_fkey 
    FOREIGN KEY (player1_id) REFERENCES public.profiles(user_id);
ALTER TABLE public.matches ADD CONSTRAINT matches_player2_id_fkey 
    FOREIGN KEY (player2_id) REFERENCES public.profiles(user_id);
ALTER TABLE public.matches ADD CONSTRAINT matches_winner_id_fkey 
    FOREIGN KEY (winner_id) REFERENCES public.profiles(user_id);

-- Fix tournament_registrations foreign keys
ALTER TABLE public.tournament_registrations DROP CONSTRAINT IF EXISTS tournament_registrations_user_id_fkey;
ALTER TABLE public.tournament_registrations ADD CONSTRAINT tournament_registrations_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Drop existing policies before recreating them
DROP POLICY IF EXISTS "Users can view challenges they're involved in" ON public.challenges;
DROP POLICY IF EXISTS "Users can create challenges" ON public.challenges;
DROP POLICY IF EXISTS "Users can update their challenges" ON public.challenges;

-- Add proper RLS policies for challenges
CREATE POLICY "Users can view challenges they're involved in" ON public.challenges
FOR SELECT USING (
    auth.uid() = challenger_id OR 
    auth.uid() = challenged_id OR
    status = 'pending'
);

CREATE POLICY "Users can create challenges" ON public.challenges
FOR INSERT WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Users can update their challenges" ON public.challenges
FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- Drop existing tournament policies
DROP POLICY IF EXISTS "Anyone can view tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Admins can manage tournaments" ON public.tournaments;

-- Add RLS policies for tournaments
CREATE POLICY "Anyone can view tournaments" ON public.tournaments
FOR SELECT USING (true);

CREATE POLICY "Admins can manage tournaments" ON public.tournaments
FOR ALL USING (public.is_user_admin());

-- Drop existing tournament registration policies
DROP POLICY IF EXISTS "Users can view tournament registrations" ON public.tournament_registrations;
DROP POLICY IF EXISTS "Users can create tournament registrations" ON public.tournament_registrations;

-- Add RLS policies for tournament_registrations
CREATE POLICY "Users can view tournament registrations" ON public.tournament_registrations
FOR SELECT USING (
    auth.uid() = user_id OR 
    public.is_user_admin()
);

CREATE POLICY "Users can create tournament registrations" ON public.tournament_registrations
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Drop existing match policies
DROP POLICY IF EXISTS "Anyone can view matches" ON public.matches;
DROP POLICY IF EXISTS "Admins can manage matches" ON public.matches;

-- Add RLS policies for matches
CREATE POLICY "Anyone can view matches" ON public.matches
FOR SELECT USING (true);

CREATE POLICY "Admins can manage matches" ON public.matches
FOR ALL USING (public.is_user_admin());

-- Update the existing is_admin function - use CASCADE to handle dependencies
DROP FUNCTION IF EXISTS public.is_admin(UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.is_user_admin(user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate any policies that were dropped due to CASCADE (without IF NOT EXISTS)
DROP POLICY IF EXISTS "Admins can manage posts" ON public.posts;
CREATE POLICY "Admins can manage posts" ON public.posts
FOR ALL USING (public.is_admin());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON public.user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON public.challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON public.challenges(created_at);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_status ON public.tournament_registrations(status);
