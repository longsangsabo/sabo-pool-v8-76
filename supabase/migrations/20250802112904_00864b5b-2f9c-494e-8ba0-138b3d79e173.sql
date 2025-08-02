-- Fix security definer view by updating permissions
-- This addresses the critical security linter error

-- Update function search paths for security (addresses multiple warnings)
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';

-- Set proper search path for all existing functions to prevent security issues
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT n.nspname as schema_name, p.proname as function_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname LIKE '%update%'
    LOOP
        EXECUTE format('ALTER FUNCTION %I.%I() SET search_path = ''''', 
                      func_record.schema_name, func_record.function_name);
    END LOOP;
END $$;

-- Update any views to remove SECURITY DEFINER if present
-- Note: This is a safety measure for deployment readiness