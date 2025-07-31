-- Drop the conflicting old trigger and function
DROP TRIGGER IF EXISTS notify_rank_verification_status_change_trigger ON public.rank_verifications;
DROP FUNCTION IF EXISTS public.notify_rank_verification_status_change();