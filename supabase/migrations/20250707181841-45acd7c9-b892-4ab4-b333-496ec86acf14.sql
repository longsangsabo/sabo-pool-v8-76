-- NUCLEAR OPTION: Completely remove ALL wallet creation automation

-- First, let's see what triggers exist
DO $$
DECLARE
    trigger_record RECORD;
    function_record RECORD;
BEGIN
    -- List all triggers on profiles table
    FOR trigger_record IN 
        SELECT trigger_name, event_manipulation, action_statement 
        FROM information_schema.triggers 
        WHERE event_object_table = 'profiles' 
        AND event_object_schema = 'public'
    LOOP
        RAISE NOTICE 'Found trigger: % on % with action: %', 
            trigger_record.trigger_name, 
            trigger_record.event_manipulation, 
            trigger_record.action_statement;
    END LOOP;
    
    -- List all functions that might create wallets
    FOR function_record IN
        SELECT routine_name, routine_definition
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_definition ILIKE '%wallet%'
    LOOP
        RAISE NOTICE 'Found wallet-related function: %', function_record.routine_name;
    END LOOP;
END $$;

-- Drop EVERY possible trigger that could create wallets
DROP TRIGGER IF EXISTS create_wallet_on_profile_insert ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS handle_new_profile ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS create_wallet_trigger ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS profile_wallet_trigger ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users CASCADE;
DROP TRIGGER IF EXISTS create_wallet_for_authenticated_users ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS wallet_creation_trigger ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS auto_create_wallet ON public.profiles CASCADE;

-- Drop EVERY function that could create wallets
DROP FUNCTION IF EXISTS public.handle_new_profile() CASCADE;
DROP FUNCTION IF EXISTS public.create_wallet_for_profile() CASCADE;
DROP FUNCTION IF EXISTS public.handle_profile_insert() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_wallet() CASCADE;
DROP FUNCTION IF EXISTS public.create_wallet_for_real_users() CASCADE;
DROP FUNCTION IF EXISTS public.auto_create_wallet() CASCADE;
DROP FUNCTION IF EXISTS public.handle_wallet_creation() CASCADE;

-- Make sure no constraint or default tries to create wallets
-- Check if wallets table has any problematic defaults
ALTER TABLE public.wallets ALTER COLUMN user_id DROP DEFAULT;

-- Verify no more wallet-creating triggers exist
SELECT 
    trigger_name, 
    event_object_table, 
    action_statement
FROM information_schema.triggers 
WHERE (action_statement ILIKE '%wallet%' OR trigger_name ILIKE '%wallet%')
AND event_object_schema = 'public';

-- For absolute safety, let's make wallet creation completely manual
-- No automatic wallet creation AT ALL