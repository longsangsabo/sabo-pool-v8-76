-- Add missing columns to tournament_matches
ALTER TABLE public.tournament_matches 
ADD COLUMN IF NOT EXISTS bracket_id UUID REFERENCES public.tournament_brackets(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS loser_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS referee_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS match_notes TEXT,
ADD COLUMN IF NOT EXISTS live_stream_url TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add missing columns to tournament_brackets
ALTER TABLE public.tournament_brackets 
ADD COLUMN IF NOT EXISTS total_players INTEGER,
ADD COLUMN IF NOT EXISTS bracket_config JSONB DEFAULT '{}';

-- Update existing tournament_brackets to have default total_players if null
UPDATE public.tournament_brackets 
SET total_players = 8 
WHERE total_players IS NULL;

-- Now make total_players NOT NULL
ALTER TABLE public.tournament_brackets 
ALTER COLUMN total_players SET NOT NULL;

-- Create tournament_participants table if not exists
CREATE TABLE IF NOT EXISTS public.tournament_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    seed_number INTEGER,
    registration_status TEXT DEFAULT 'registered',
    checked_in_at TIMESTAMP WITH TIME ZONE,
    player_stats JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, user_id)
);

-- Create match_events table for detailed match tracking
CREATE TABLE IF NOT EXISTS public.match_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES public.tournament_matches(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    event_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reported_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tournament_participants (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tournament_participants' 
        AND policyname = 'Everyone can view tournament participants'
    ) THEN
        CREATE POLICY "Everyone can view tournament participants" 
            ON public.tournament_participants 
            FOR SELECT 
            USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tournament_participants' 
        AND policyname = 'Users can manage their participation'
    ) THEN
        CREATE POLICY "Users can manage their participation" 
            ON public.tournament_participants 
            FOR ALL 
            USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tournament_participants' 
        AND policyname = 'Admins can manage all participants'
    ) THEN
        CREATE POLICY "Admins can manage all participants" 
            ON public.tournament_participants 
            FOR ALL 
            USING (EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE user_id = auth.uid() AND is_admin = true
            ));
    END IF;
END $$;

-- Create RLS policies for match_events (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'match_events' 
        AND policyname = 'Everyone can view match events'
    ) THEN
        CREATE POLICY "Everyone can view match events" 
            ON public.match_events 
            FOR SELECT 
            USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'match_events' 
        AND policyname = 'Authorized users can create match events'
    ) THEN
        CREATE POLICY "Authorized users can create match events" 
            ON public.match_events 
            FOR INSERT 
            WITH CHECK (
                auth.uid() = reported_by AND
                (EXISTS (
                    SELECT 1 FROM public.tournament_matches tm
                    WHERE tm.id = match_id AND (
                        tm.player1_id = auth.uid() OR 
                        tm.player2_id = auth.uid() OR 
                        tm.referee_id = auth.uid()
                    )
                ) OR EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE user_id = auth.uid() AND is_admin = true
                ))
            );
    END IF;
END $$;

-- Create indexes for performance (only if not exists)
CREATE INDEX IF NOT EXISTS idx_tournament_matches_bracket_id ON public.tournament_matches(bracket_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament_id ON public.tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user_id ON public.tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON public.match_events(match_id);

-- Create bracket generation function
CREATE OR REPLACE FUNCTION public.generate_single_elimination_bracket(
    p_tournament_id UUID,
    p_participants UUID[]
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_bracket_id UUID;
    v_total_players INTEGER;
    v_total_rounds INTEGER;
    v_round INTEGER;
    v_match_number INTEGER;
    v_players_in_round INTEGER;
    v_i INTEGER;
BEGIN
    v_total_players := array_length(p_participants, 1);
    v_total_rounds := CEIL(LOG(2, v_total_players));
    
    -- Update bracket info
    UPDATE public.tournament_brackets 
    SET total_players = v_total_players,
        total_rounds = v_total_rounds,
        bracket_type = 'single_elimination'
    WHERE tournament_id = p_tournament_id
    RETURNING id INTO v_bracket_id;
    
    -- If no bracket exists, create one
    IF v_bracket_id IS NULL THEN
        INSERT INTO public.tournament_brackets (
            tournament_id, bracket_type, total_players, total_rounds
        ) VALUES (
            p_tournament_id, 'single_elimination', v_total_players, v_total_rounds
        ) RETURNING id INTO v_bracket_id;
    END IF;
    
    -- Clear existing matches
    DELETE FROM public.tournament_matches WHERE bracket_id = v_bracket_id;
    
    -- Generate first round matches
    v_match_number := 1;
    FOR v_i IN 1..v_total_players BY 2 LOOP
        IF v_i + 1 <= v_total_players THEN
            INSERT INTO public.tournament_matches (
                tournament_id, bracket_id, round_number, match_number,
                player1_id, player2_id, status
            ) VALUES (
                p_tournament_id, v_bracket_id, 1, v_match_number,
                p_participants[v_i], p_participants[v_i + 1], 'pending'
            );
        ELSE
            -- Bye match (single player advances)
            INSERT INTO public.tournament_matches (
                tournament_id, bracket_id, round_number, match_number,
                player1_id, winner_id, status
            ) VALUES (
                p_tournament_id, v_bracket_id, 1, v_match_number,
                p_participants[v_i], p_participants[v_i], 'completed'
            );
        END IF;
        v_match_number := v_match_number + 1;
    END LOOP;
    
    -- Generate subsequent rounds (empty matches)
    FOR v_round IN 2..v_total_rounds LOOP
        v_players_in_round := POWER(2, v_total_rounds - v_round + 1);
        v_match_number := 1;
        FOR v_i IN 1..(v_players_in_round / 2) LOOP
            INSERT INTO public.tournament_matches (
                tournament_id, bracket_id, round_number, match_number, status
            ) VALUES (
                p_tournament_id, v_bracket_id, v_round, v_match_number, 'pending'
            );
            v_match_number := v_match_number + 1;
        END LOOP;
    END LOOP;
    
    RETURN v_bracket_id;
END;
$$;

-- Enable realtime for live updates
ALTER TABLE public.tournament_matches REPLICA IDENTITY FULL;
ALTER TABLE public.match_events REPLICA IDENTITY FULL;