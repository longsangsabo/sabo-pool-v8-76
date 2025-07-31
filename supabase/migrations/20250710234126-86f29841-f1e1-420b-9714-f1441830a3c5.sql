-- Create soft_delete_entity function if not exists
CREATE OR REPLACE FUNCTION public.soft_delete_entity(
  table_name text,
  entity_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if table exists and has required columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = $1
  ) THEN
    RETURN false;
  END IF;
  
  -- Perform soft delete by setting deleted_at
  EXECUTE format('UPDATE %I SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL', table_name)
  USING entity_id;
  
  -- Check if row was actually updated
  IF FOUND THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;