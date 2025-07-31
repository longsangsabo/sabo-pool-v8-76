-- Check the rank_verifications table structure and any related views
-- First, let's see the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'rank_verifications' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any views that might be interfering
SELECT schemaname, viewname, definition
FROM pg_views 
WHERE definition ILIKE '%rank_verifications%'
  AND schemaname = 'public';

-- Also check if the table actually exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'rank_verifications'
) as table_exists;