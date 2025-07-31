
-- Add nickname field to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname VARCHAR(100);

-- Create rank_registrations table
CREATE TABLE public.rank_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    requested_rank VARCHAR(10) NOT NULL,
    club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for rank_registrations
ALTER TABLE public.rank_registrations ENABLE ROW LEVEL SECURITY;

-- RLS policies for rank_registrations
CREATE POLICY "Users can view their own rank registrations" 
    ON public.rank_registrations 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rank registrations" 
    ON public.rank_registrations 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rank registrations" 
    ON public.rank_registrations 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_rank_registrations_user_id ON public.rank_registrations(user_id);
CREATE INDEX idx_rank_registrations_club_id ON public.rank_registrations(club_id);
