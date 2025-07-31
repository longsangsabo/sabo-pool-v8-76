-- Create missing tables and functions for tournament completion

-- First, let's ensure tournament_results table exists with proper structure
CREATE TABLE IF NOT EXISTS public.tournament_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  final_position integer NOT NULL,
  prize_money numeric DEFAULT 0,
  elo_points_earned integer DEFAULT 0,
  spa_points_earned integer DEFAULT 0,
  matches_played integer DEFAULT 0,
  matches_won integer DEFAULT 0,
  matches_lost integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

-- Enable RLS on tournament_results
ALTER TABLE public.tournament_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tournament_results
CREATE POLICY "Users can view all tournament results" 
ON public.tournament_results FOR SELECT 
USING (true);

CREATE POLICY "System can insert tournament results" 
ON public.tournament_results FOR INSERT 
WITH CHECK (true);

-- Create simple notification function (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_priority text DEFAULT 'normal',
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert into notifications table if it exists
  INSERT INTO public.notifications (
    user_id, type, title, message, priority, metadata, created_at
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_priority, p_metadata, now()
  );
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- If notifications table doesn't exist or other error, just return true to not break the flow
    RAISE NOTICE 'Notification creation failed: %', SQLERRM;
    RETURN false;
END;
$$;

-- Ensure notifications table exists with basic structure
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  priority text DEFAULT 'normal',
  metadata jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- Create simple award function if it doesn't exist
CREATE OR REPLACE FUNCTION public.award_tournament_rewards(
  p_user_id uuid,
  p_spa_points integer,
  p_elo_change integer,
  p_prize_amount numeric,
  p_tournament_id uuid,
  p_position integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update player_rankings if it exists
  UPDATE public.player_rankings 
  SET 
    spa_points = COALESCE(spa_points, 0) + p_spa_points,
    elo_points = COALESCE(elo_points, 1000) + p_elo_change,
    tournament_wins = CASE WHEN p_position = 1 THEN COALESCE(tournament_wins, 0) + 1 ELSE COALESCE(tournament_wins, 0) END,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- If no rows updated, insert new record
  IF NOT FOUND THEN
    INSERT INTO public.player_rankings (
      user_id, spa_points, elo_points, tournament_wins, updated_at
    ) VALUES (
      p_user_id, p_spa_points, 1000 + p_elo_change, 
      CASE WHEN p_position = 1 THEN 1 ELSE 0 END, NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
      spa_points = EXCLUDED.spa_points,
      elo_points = EXCLUDED.elo_points,
      tournament_wins = EXCLUDED.tournament_wins,
      updated_at = EXCLUDED.updated_at;
  END IF;
  
  -- Update wallet if prize > 0 and wallets table exists
  IF p_prize_amount > 0 THEN
    UPDATE public.wallets 
    SET 
      balance = COALESCE(balance, 0) + p_prize_amount,
      updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- If no wallet exists, create one
    IF NOT FOUND THEN
      INSERT INTO public.wallets (user_id, balance, updated_at)
      VALUES (p_user_id, p_prize_amount, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        balance = EXCLUDED.balance,
        updated_at = EXCLUDED.updated_at;
    END IF;
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Award rewards failed: %', SQLERRM;
END;
$$;