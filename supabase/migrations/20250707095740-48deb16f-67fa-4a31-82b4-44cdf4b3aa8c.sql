-- Create tournament status automation function
CREATE OR REPLACE FUNCTION public.auto_update_tournament_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update tournament statuses based on current time
  UPDATE public.tournaments 
  SET status = CASE
    WHEN now() < registration_start THEN 'upcoming'
    WHEN now() >= registration_start AND now() <= registration_end THEN 'registration_open'
    WHEN now() > registration_end AND now() < tournament_start THEN 'registration_closed'
    WHEN now() >= tournament_start AND now() <= tournament_end THEN 'ongoing'
    WHEN now() > tournament_end THEN 'completed'
    ELSE status
  END,
  updated_at = now()
  WHERE status NOT IN ('cancelled', 'completed');

  -- Create notifications for status changes
  INSERT INTO public.notifications (user_id, type, title, message, priority)
  SELECT 
    tr.user_id,
    'tournament_status',
    'Cập nhật giải đấu',
    CASE t.status
      WHEN 'registration_open' THEN 'Giải đấu "' || t.name || '" đã mở đăng ký!'
      WHEN 'registration_closed' THEN 'Giải đấu "' || t.name || '" đã đóng đăng ký'
      WHEN 'ongoing' THEN 'Giải đấu "' || t.name || '" đã bắt đầu!'
      WHEN 'completed' THEN 'Giải đấu "' || t.name || '" đã kết thúc'
      ELSE 'Giải đấu "' || t.name || '" có thay đổi trạng thái'
    END,
    'normal'
  FROM public.tournaments t
  JOIN public.tournament_registrations tr ON t.id = tr.tournament_id
  WHERE t.updated_at >= now() - INTERVAL '1 minute';
END;
$$;

-- Create tournament registration management functions
CREATE OR REPLACE FUNCTION public.get_tournament_registrations(tournament_uuid uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  registration_date timestamp with time zone,
  status text,
  payment_status text,
  notes text,
  user_profile jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tr.id,
    tr.user_id,
    tr.registration_date,
    tr.status,
    tr.payment_status,
    tr.notes,
    jsonb_build_object(
      'user_id', p.user_id,
      'full_name', p.full_name,
      'display_name', p.display_name,
      'avatar_url', p.avatar_url,
      'verified_rank', p.verified_rank,
      'current_rank', pr.current_rank_id
    ) as user_profile
  FROM public.tournament_registrations tr
  LEFT JOIN public.profiles p ON tr.user_id = p.user_id
  LEFT JOIN public.player_rankings pr ON tr.user_id = pr.player_id
  WHERE tr.tournament_id = tournament_uuid
  ORDER BY tr.registration_date ASC;
END;
$$;

-- Create tournament bracket generation function
CREATE OR REPLACE FUNCTION public.generate_tournament_bracket(tournament_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  tournament_rec RECORD;
  participants_count INTEGER;
  bracket_data jsonb;
BEGIN
  -- Get tournament info
  SELECT * INTO tournament_rec 
  FROM public.tournaments 
  WHERE id = tournament_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Count confirmed participants
  SELECT COUNT(*) INTO participants_count
  FROM public.tournament_registrations
  WHERE tournament_id = tournament_uuid 
  AND status = 'confirmed';
  
  -- Generate bracket based on tournament type
  bracket_data := jsonb_build_object(
    'tournament_id', tournament_uuid,
    'tournament_type', tournament_rec.tournament_type,
    'participants_count', participants_count,
    'rounds', CASE tournament_rec.tournament_type
      WHEN 'single_elimination' THEN CEIL(LOG(2, participants_count))
      WHEN 'double_elimination' THEN CEIL(LOG(2, participants_count)) + 1
      ELSE 1
    END,
    'matches', '[]'::jsonb,
    'generated_at', to_jsonb(now())
  );
  
  -- Insert bracket data
  INSERT INTO public.tournament_brackets (tournament_id, bracket_data, created_at)
  VALUES (tournament_uuid, bracket_data, now())
  ON CONFLICT (tournament_id) 
  DO UPDATE SET bracket_data = EXCLUDED.bracket_data, updated_at = now();
  
  RETURN bracket_data;
END;
$$;

-- Create tournament brackets table
CREATE TABLE IF NOT EXISTS public.tournament_brackets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  bracket_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_round integer DEFAULT 1,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(tournament_id)
);

-- Enable RLS for tournament brackets
ALTER TABLE public.tournament_brackets ENABLE ROW LEVEL SECURITY;

-- RLS policies for brackets
CREATE POLICY "Anyone can view tournament brackets"
ON public.tournament_brackets
FOR SELECT
USING (true);

CREATE POLICY "Tournament creators can manage brackets"
ON public.tournament_brackets
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t 
    WHERE t.id = tournament_brackets.tournament_id 
    AND t.created_by = auth.uid()
  )
);

-- Create tournament matches table for detailed match tracking
CREATE TABLE IF NOT EXISTS public.tournament_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  bracket_id uuid REFERENCES public.tournament_brackets(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  match_number integer NOT NULL,
  player1_id uuid REFERENCES auth.users(id),
  player2_id uuid REFERENCES auth.users(id),
  winner_id uuid REFERENCES auth.users(id),
  player1_score integer DEFAULT 0,
  player2_score integer DEFAULT 0,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
  scheduled_time timestamp with time zone,
  completed_time timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for tournament matches
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

-- RLS policies for matches
CREATE POLICY "Anyone can view tournament matches"
ON public.tournament_matches
FOR SELECT
USING (true);

CREATE POLICY "Match participants can update their matches"
ON public.tournament_matches
FOR UPDATE
USING (auth.uid() = player1_id OR auth.uid() = player2_id OR 
       EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_matches.tournament_id AND t.created_by = auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournament_brackets_tournament_id ON public.tournament_brackets(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament_id ON public.tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_players ON public.tournament_matches(player1_id, player2_id);