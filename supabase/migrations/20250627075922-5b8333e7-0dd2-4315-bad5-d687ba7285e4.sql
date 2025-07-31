
-- Add role column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'member';

-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- system_admin, club_admin
    permissions JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Only admins can access admin data" ON public.admin_users
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = auth.uid() AND role IN ('system_admin', 'club_admin')
    )
);

-- Update tournaments table structure
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS entry_fee INTEGER DEFAULT 0;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS eligible_ranks TEXT[];
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS bracket_type VARCHAR(20) DEFAULT 'single_elimination';
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Create tournament_registrations table
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'registered',
    payment_status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, user_id)
);

-- Enable RLS for tournament_registrations
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies for tournament_registrations
CREATE POLICY "Users can view own registrations" ON public.tournament_registrations
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own registrations" ON public.tournament_registrations
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all registrations" ON public.tournament_registrations
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = auth.uid() AND role IN ('system_admin', 'club_admin')
    )
);

-- Update matches table structure
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS round_number INTEGER;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS match_number INTEGER;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament_id ON public.tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_user_id ON public.tournament_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_round ON public.matches(tournament_id, round_number);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = user_uuid AND role IN ('system_admin', 'club_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create tournament bracket
CREATE OR REPLACE FUNCTION public.generate_tournament_bracket(tournament_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    participant_count INTEGER;
    rounds INTEGER;
    current_round INTEGER;
    match_counter INTEGER;
    participants RECORD;
BEGIN
    -- Check if user is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can generate brackets';
    END IF;
    
    -- Get participant count
    SELECT COUNT(*) INTO participant_count
    FROM public.tournament_registrations
    WHERE tournament_id = tournament_uuid AND status = 'confirmed';
    
    IF participant_count < 2 THEN
        RAISE EXCEPTION 'Not enough participants to generate bracket';
    END IF;
    
    -- Calculate number of rounds
    rounds := CEIL(LOG(2, participant_count));
    
    -- Clear existing matches
    DELETE FROM public.matches WHERE tournament_id = tournament_uuid;
    
    -- Generate first round matches
    match_counter := 1;
    FOR participants IN (
        SELECT tr.user_id, ROW_NUMBER() OVER (ORDER BY tr.registration_date) as rn
        FROM public.tournament_registrations tr
        WHERE tr.tournament_id = tournament_uuid AND tr.status = 'confirmed'
    ) LOOP
        -- Create matches for pairs
        IF participants.rn % 2 = 1 THEN
            INSERT INTO public.matches (
                tournament_id, round_number, match_number, player1_id, status
            ) VALUES (
                tournament_uuid, 1, match_counter, participants.user_id, 'scheduled'
            );
        ELSE
            UPDATE public.matches 
            SET player2_id = participants.user_id
            WHERE tournament_id = tournament_uuid 
            AND round_number = 1 
            AND match_number = match_counter;
            
            match_counter := match_counter + 1;
        END IF;
    END LOOP;
    
    -- Generate subsequent rounds (empty matches to be filled by winners)
    FOR current_round IN 2..rounds LOOP
        match_counter := 1;
        FOR i IN 1..(POWER(2, rounds - current_round)) LOOP
            INSERT INTO public.matches (
                tournament_id, round_number, match_number, status
            ) VALUES (
                tournament_uuid, current_round, match_counter, 'scheduled'
            );
            match_counter := match_counter + 1;
        END LOOP;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update match result and advance winner
CREATE OR REPLACE FUNCTION public.update_match_result(
    match_uuid UUID,
    p1_score INTEGER,
    p2_score INTEGER,
    winner_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    match_rec RECORD;
    next_match_uuid UUID;
    next_match_number INTEGER;
BEGIN
    -- Check if user is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can update match results';
    END IF;
    
    -- Get match details
    SELECT * INTO match_rec FROM public.matches WHERE id = match_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Match not found';
    END IF;
    
    -- Update match result
    UPDATE public.matches 
    SET 
        score_player1 = p1_score,
        score_player2 = p2_score,
        winner_id = winner_uuid,
        status = 'completed'
    WHERE id = match_uuid;
    
    -- Find next round match and advance winner
    IF match_rec.round_number > 0 THEN
        next_match_number := CEIL(match_rec.match_number::FLOAT / 2);
        
        SELECT id INTO next_match_uuid
        FROM public.matches
        WHERE tournament_id = match_rec.tournament_id
        AND round_number = match_rec.round_number + 1
        AND match_number = next_match_number;
        
        IF FOUND THEN
            -- Determine if winner goes to player1 or player2 slot
            IF match_rec.match_number % 2 = 1 THEN
                UPDATE public.matches SET player1_id = winner_uuid WHERE id = next_match_uuid;
            ELSE
                UPDATE public.matches SET player2_id = winner_uuid WHERE id = next_match_uuid;
            END IF;
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
