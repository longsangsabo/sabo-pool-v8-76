-- Tournament Bracket Management System

-- Create tournament_brackets table
CREATE TABLE IF NOT EXISTS public.tournament_brackets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    bracket_type TEXT NOT NULL DEFAULT 'single_elimination', -- single_elimination, double_elimination, group_stage
    total_players INTEGER NOT NULL,
    total_rounds INTEGER NOT NULL,
    current_round INTEGER DEFAULT 1,
    bracket_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournament_matches table (enhanced)
CREATE TABLE IF NOT EXISTS public.tournament_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    bracket_id UUID REFERENCES public.tournament_brackets(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    player1_id UUID REFERENCES auth.users(id),
    player2_id UUID REFERENCES auth.users(id),
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    winner_id UUID REFERENCES auth.users(id),
    loser_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending', -- pending, ongoing, completed, cancelled
    scheduled_time TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    location TEXT,
    referee_id UUID REFERENCES auth.users(id),
    match_notes TEXT,
    live_stream_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournament_participants table
CREATE TABLE IF NOT EXISTS public.tournament_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    seed_number INTEGER,
    registration_status TEXT DEFAULT 'registered', -- registered, checked_in, disqualified, withdrawn
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
    event_type TEXT NOT NULL, -- score_update, timeout, foul, substitution, note
    event_data JSONB DEFAULT '{}',
    event_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reported_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tournament_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tournament_brackets
CREATE POLICY "Everyone can view tournament brackets" 
    ON public.tournament_brackets 
    FOR SELECT 
    USING (true);

CREATE POLICY "Admins can manage tournament brackets" 
    ON public.tournament_brackets 
    FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND is_admin = true
    ));

-- RLS Policies for tournament_matches
CREATE POLICY "Everyone can view tournament matches" 
    ON public.tournament_matches 
    FOR SELECT 
    USING (true);

CREATE POLICY "Participants can update their match results" 
    ON public.tournament_matches 
    FOR UPDATE 
    USING (
        auth.uid() = player1_id OR 
        auth.uid() = player2_id OR 
        auth.uid() = referee_id OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "System can create tournament matches" 
    ON public.tournament_matches 
    FOR INSERT 
    WITH CHECK (true);

-- RLS Policies for tournament_participants
CREATE POLICY "Everyone can view tournament participants" 
    ON public.tournament_participants 
    FOR SELECT 
    USING (true);

CREATE POLICY "Users can manage their participation" 
    ON public.tournament_participants 
    FOR ALL 
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all participants" 
    ON public.tournament_participants 
    FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND is_admin = true
    ));

-- RLS Policies for match_events
CREATE POLICY "Everyone can view match events" 
    ON public.match_events 
    FOR SELECT 
    USING (true);

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

-- Create indexes for performance
CREATE INDEX idx_tournament_brackets_tournament_id ON public.tournament_brackets(tournament_id);
CREATE INDEX idx_tournament_matches_tournament_id ON public.tournament_matches(tournament_id);
CREATE INDEX idx_tournament_matches_bracket_id ON public.tournament_matches(bracket_id);
CREATE INDEX idx_tournament_matches_round ON public.tournament_matches(round_number);
CREATE INDEX idx_tournament_matches_status ON public.tournament_matches(status);
CREATE INDEX idx_tournament_participants_tournament_id ON public.tournament_participants(tournament_id);
CREATE INDEX idx_tournament_participants_user_id ON public.tournament_participants(user_id);
CREATE INDEX idx_match_events_match_id ON public.match_events(match_id);

-- Create function to generate single elimination bracket
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
    
    -- Create bracket
    INSERT INTO public.tournament_brackets (
        tournament_id, bracket_type, total_players, total_rounds
    ) VALUES (
        p_tournament_id, 'single_elimination', v_total_players, v_total_rounds
    ) RETURNING id INTO v_bracket_id;
    
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
    
    -- Generate subsequent rounds (empty matches to be filled as tournament progresses)
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

-- Create function to advance winner to next round
CREATE OR REPLACE FUNCTION public.advance_tournament_winner(
    p_match_id UUID,
    p_winner_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_match RECORD;
    v_next_match_id UUID;
    v_next_round INTEGER;
    v_next_match_number INTEGER;
BEGIN
    -- Get current match details
    SELECT * INTO v_match
    FROM public.tournament_matches
    WHERE id = p_match_id;
    
    -- Calculate next round match
    v_next_round := v_match.round_number + 1;
    v_next_match_number := CEIL(v_match.match_number::DECIMAL / 2);
    
    -- Find next round match
    SELECT id INTO v_next_match_id
    FROM public.tournament_matches
    WHERE tournament_id = v_match.tournament_id
    AND bracket_id = v_match.bracket_id
    AND round_number = v_next_round
    AND match_number = v_next_match_number;
    
    -- Advance winner to next match
    IF v_next_match_id IS NOT NULL THEN
        IF v_match.match_number % 2 = 1 THEN
            -- Odd match number goes to player1 slot
            UPDATE public.tournament_matches
            SET player1_id = p_winner_id, updated_at = NOW()
            WHERE id = v_next_match_id;
        ELSE
            -- Even match number goes to player2 slot
            UPDATE public.tournament_matches
            SET player2_id = p_winner_id, updated_at = NOW()
            WHERE id = v_next_match_id;
        END IF;
    END IF;
END;
$$;

-- Create trigger to auto-advance winners
CREATE OR REPLACE FUNCTION public.tournament_match_winner_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- If match is completed and has a winner, advance to next round
    IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND 
       (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
        PERFORM public.advance_tournament_winner(NEW.id, NEW.winner_id);
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER tournament_match_winner_advance
    AFTER UPDATE ON public.tournament_matches
    FOR EACH ROW
    EXECUTE FUNCTION public.tournament_match_winner_trigger();

-- Enable realtime for live updates
ALTER TABLE public.tournament_matches REPLICA IDENTITY FULL;
ALTER TABLE public.match_events REPLICA IDENTITY FULL;

-- Add tables to realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'tournament_matches'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_matches;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'match_events'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.match_events;
    END IF;
END $$;