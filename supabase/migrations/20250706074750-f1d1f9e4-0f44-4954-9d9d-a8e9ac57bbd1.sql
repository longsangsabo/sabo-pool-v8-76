-- Let's create a simple test to isolate the issue
-- First, let's see what exactly happens when we try to update a rank verification

-- Create a simple function to update rank verification without any complex logic
CREATE OR REPLACE FUNCTION public.update_rank_verification_simple(
    verification_id UUID,
    new_status TEXT,
    verifier_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    result JSON;
BEGIN
    -- Simple update without any joins or complex queries
    UPDATE public.rank_verifications 
    SET 
        status = new_status,
        verified_by = verifier_id,
        verified_at = CASE WHEN new_status IN ('approved', 'rejected') THEN NOW() ELSE NULL END,
        updated_at = NOW()
    WHERE id = verification_id;
    
    -- Return success
    RETURN json_build_object(
        'success', true,
        'message', 'Rank verification updated successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$function$;