-- Create an improved rank verification system
CREATE TABLE IF NOT EXISTS public.rank_verification_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID NOT NULL REFERENCES profiles(user_id),
    club_id UUID NOT NULL,
    current_rank TEXT,
    requested_rank TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected')),
    proof_images TEXT[],
    notes TEXT,
    test_result JSONB,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rank_verification_player_id ON public.rank_verification_requests(player_id);
CREATE INDEX IF NOT EXISTS idx_rank_verification_club_id ON public.rank_verification_requests(club_id);
CREATE INDEX IF NOT EXISTS idx_rank_verification_status ON public.rank_verification_requests(status);

-- Enable RLS
ALTER TABLE public.rank_verification_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Players can view their own verification requests"
ON public.rank_verification_requests FOR SELECT
USING (auth.uid() = player_id);

CREATE POLICY "Players can create verification requests"
ON public.rank_verification_requests FOR INSERT
WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Club owners can view requests for their club"
ON public.rank_verification_requests FOR SELECT
USING (auth.uid() IN (
    SELECT user_id FROM public.club_profiles 
    WHERE id = rank_verification_requests.club_id
));

CREATE POLICY "Club owners can update requests for their club"
ON public.rank_verification_requests FOR UPDATE
USING (auth.uid() IN (
    SELECT user_id FROM public.club_profiles 
    WHERE id = rank_verification_requests.club_id
));

-- Function to update existing user rank when approved
CREATE OR REPLACE FUNCTION public.approve_rank_verification(
    p_request_id UUID,
    p_reviewer_id UUID,
    p_approved BOOLEAN,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_request RECORD;
    v_result JSONB;
BEGIN
    -- Get the verification request
    SELECT * INTO v_request
    FROM public.rank_verification_requests
    WHERE id = p_request_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request not found');
    END IF;
    
    -- Update request status
    UPDATE public.rank_verification_requests
    SET 
        status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
        reviewed_by = p_reviewer_id,
        reviewed_at = NOW(),
        notes = COALESCE(p_notes, notes),
        updated_at = NOW()
    WHERE id = p_request_id;
    
    -- If approved, update the user's verified rank in profiles
    IF p_approved THEN
        UPDATE public.profiles
        SET 
            verified_rank = v_request.requested_rank,
            rank_verified_at = NOW(),
            rank_verified_by = p_reviewer_id,
            updated_at = NOW()
        WHERE user_id = v_request.player_id;
        
        -- Create notification for successful approval
        INSERT INTO public.notifications (
            user_id, type, title, message, priority
        ) VALUES (
            v_request.player_id,
            'rank_verified',
            'Hạng đã được xác thực',
            format('Chúc mừng! Hạng %s của bạn đã được xác thực thành công.', v_request.requested_rank),
            'high'
        );
    ELSE
        -- Create notification for rejection
        INSERT INTO public.notifications (
            user_id, type, title, message, priority
        ) VALUES (
            v_request.player_id,
            'rank_rejected',
            'Yêu cầu xác thực hạng bị từ chối',
            format('Yêu cầu xác thực hạng %s đã bị từ chối. Lý do: %s', 
                v_request.requested_rank, COALESCE(p_notes, 'Không có lý do cụ thể')),
            'normal'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'approved', p_approved,
        'player_id', v_request.player_id,
        'requested_rank', v_request.requested_rank
    );
END;
$$;

-- Add missing columns to profiles table for rank verification
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verified_rank TEXT,
ADD COLUMN IF NOT EXISTS rank_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rank_verified_by UUID;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_rank_verification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rank_verification_updated_at
    BEFORE UPDATE ON public.rank_verification_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_rank_verification_updated_at();