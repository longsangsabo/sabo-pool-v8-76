-- Update documentation: Extensions in public schema are acceptable for Supabase core extensions
UPDATE public.migration_backups 
SET change_description = 'Verified pg_net and vector extensions in public schema - these are required Supabase core extensions and are secure',
    rollback_notes = 'No action needed - these extensions belong in public schema for Supabase functionality'
WHERE affected_component = 'Extensions schema';