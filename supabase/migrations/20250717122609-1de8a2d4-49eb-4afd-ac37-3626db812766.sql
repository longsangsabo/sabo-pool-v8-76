-- MAJOR ISSUE 2: Move extensions from public schema to extensions schema
-- Backup record for rollback safety
INSERT INTO public.migration_backups (affected_component, change_description, rollback_notes)
VALUES 
('Extensions schema', 'Move pg_net and vector extensions from public to extensions schema', 'Extensions can be moved back to public if needed: DROP EXTENSION name; CREATE EXTENSION name SCHEMA public;');

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_net extension to extensions schema
ALTER EXTENSION pg_net SET SCHEMA extensions;

-- Move vector extension to extensions schema  
ALTER EXTENSION vector SET SCHEMA extensions;