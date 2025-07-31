-- Create the missing rank_verifications table
CREATE TABLE IF NOT EXISTS public.rank_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID NOT NULL,
    club_id UUID NOT NULL,
    requested_rank TEXT NOT NULL,
    current_rank TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'testing', 'approved', 'rejected')),
    verified_by UUID,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    club_notes TEXT,
    test_result JSONB,
    rejection_reason TEXT,
    proof_photos TEXT[]
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rank_verifications_player_id ON public.rank_verifications(player_id);
CREATE INDEX IF NOT EXISTS idx_rank_verifications_club_id ON public.rank_verifications(club_id);
CREATE INDEX IF NOT EXISTS idx_rank_verifications_status ON public.rank_verifications(status);

-- Enable RLS
ALTER TABLE public.rank_verifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Players can view their own rank verification requests"
ON public.rank_verifications FOR SELECT
USING (auth.uid() = player_id);

CREATE POLICY "Players can create their own rank verification requests"
ON public.rank_verifications FOR INSERT
WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Club owners can view requests for their club"
ON public.rank_verifications FOR SELECT
USING (auth.uid() IN (
    SELECT user_id FROM public.club_profiles 
    WHERE id = rank_verifications.club_id
));

CREATE POLICY "Club owners can update requests for their club"
ON public.rank_verifications FOR UPDATE
USING (auth.uid() IN (
    SELECT user_id FROM public.club_profiles 
    WHERE id = rank_verifications.club_id
));

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_rank_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rank_verifications_updated_at
    BEFORE UPDATE ON public.rank_verifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_rank_verifications_updated_at();