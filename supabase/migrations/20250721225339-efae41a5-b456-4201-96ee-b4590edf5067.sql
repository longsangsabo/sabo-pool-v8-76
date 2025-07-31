-- Add missing columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_demo_user BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ban_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add missing columns to tournaments table
ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add missing columns to tournament_results table
ALTER TABLE public.tournament_results
ADD COLUMN IF NOT EXISTS prize_money NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS elo_points_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS matches_played INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS matches_won INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS matches_lost INTEGER DEFAULT 0;