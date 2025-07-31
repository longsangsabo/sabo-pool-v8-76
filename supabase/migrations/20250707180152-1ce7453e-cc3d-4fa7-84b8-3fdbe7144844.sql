-- Completely remove wallet creation from profile insertion for test purposes
-- First, check if there are any other triggers on profiles table
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
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
END $$;

-- Drop ALL triggers on profiles table that might be creating wallets
DROP TRIGGER IF EXISTS create_wallet_on_profile_insert ON public.profiles;
DROP TRIGGER IF EXISTS handle_new_profile ON public.profiles;
DROP TRIGGER IF EXISTS create_wallet_trigger ON public.profiles;
DROP TRIGGER IF EXISTS profile_wallet_trigger ON public.profiles;

-- Drop all related functions
DROP FUNCTION IF EXISTS public.handle_new_profile() CASCADE;
DROP FUNCTION IF EXISTS public.create_wallet_for_profile() CASCADE;
DROP FUNCTION IF EXISTS public.handle_profile_insert() CASCADE;

-- Also check if there's a column default or constraint causing the issue
-- Let's see the structure of wallets table
SELECT column_name, column_default, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'wallets' AND table_schema = 'public';