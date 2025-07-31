-- Create tournament_results table for final standings
CREATE TABLE IF NOT EXISTS public.tournament_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  prize_amount NUMERIC DEFAULT 0,
  spa_awarded INTEGER DEFAULT 0,
  elo_change INTEGER DEFAULT 0,
  elo_before INTEGER DEFAULT 1000,
  elo_after INTEGER DEFAULT 1000,
  matches_played INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  matches_lost INTEGER DEFAULT 0,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tournament_id, user_id),
  UNIQUE(tournament_id, position)
);

-- Enable RLS on tournament_results
ALTER TABLE public.tournament_results ENABLE ROW LEVEL SECURITY;

-- Create policies for tournament_results
CREATE POLICY "Anyone can view tournament results" 
ON public.tournament_results 
FOR SELECT 
USING (true);

CREATE POLICY "System can insert tournament results" 
ON public.tournament_results 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Club owners can update their tournament results" 
ON public.tournament_results 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    JOIN public.club_profiles cp ON t.club_id = cp.id
    WHERE t.id = tournament_results.tournament_id 
    AND cp.user_id = auth.uid()
  )
);

-- Add completed_at field to tournaments if not exists
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS final_results JSONB;

-- Create notifications table if not exists (for completion notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'normal',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on notifications if not already enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications if not exist
DO $$ 
BEGIN
  -- Check if policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Users can view their own notifications'
  ) THEN
    CREATE POLICY "Users can view their own notifications" 
    ON public.notifications 
    FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'System can insert notifications'
  ) THEN
    CREATE POLICY "System can insert notifications" 
    ON public.notifications 
    FOR INSERT 
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Users can update their own notifications'
  ) THEN
    CREATE POLICY "Users can update their own notifications" 
    ON public.notifications 
    FOR UPDATE 
    USING (auth.uid() = user_id);
  END IF;
END $$;