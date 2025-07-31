-- Test and enable the rank approval trigger
DROP TRIGGER IF EXISTS rank_request_approval_trigger ON public.rank_requests;

CREATE TRIGGER rank_request_approval_trigger
    AFTER UPDATE ON public.rank_requests
    FOR EACH ROW
    WHEN (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved'))
    EXECUTE FUNCTION handle_rank_request_approval();

-- Also ensure notifications table exists for the trigger
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'normal',
    metadata JSONB DEFAULT '{}',
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);