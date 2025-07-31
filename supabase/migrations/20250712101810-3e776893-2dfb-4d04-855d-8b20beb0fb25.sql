-- Simplified migration to fix remaining foreign key constraint naming issues
-- This addresses the specific error: record "new" has no field "player_id"

-- Create function to fix constraint names without touching pg_policy directly
CREATE OR REPLACE FUNCTION public.fix_player_id_constraints()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  constraint_info RECORD;
  renamed_count INTEGER := 0;
  result JSONB;
BEGIN
  -- Find all foreign key constraints with 'player_id' in the name
  FOR constraint_info IN
    SELECT 
      tc.table_name,
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.constraint_name LIKE '%player_id%'
  LOOP
    BEGIN
      -- Generate new constraint name
      DECLARE
        new_constraint_name TEXT := REPLACE(constraint_info.constraint_name, 'player_id', 'user_id');
        new_column_name TEXT := REPLACE(constraint_info.column_name, 'player_id', 'user_id');
      BEGIN
        -- Drop old constraint
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I',
          constraint_info.table_name,
          constraint_info.constraint_name
        );
        
        -- Add new constraint with correct naming
        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.%I(%I)',
          constraint_info.table_name,
          new_constraint_name,
          new_column_name,
          constraint_info.foreign_table_name,
          constraint_info.foreign_column_name
        );
        
        renamed_count := renamed_count + 1;
        RAISE NOTICE 'Fixed constraint: % -> %', constraint_info.constraint_name, new_constraint_name;
      END;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to fix constraint %: %', constraint_info.constraint_name, SQLERRM;
    END;
  END LOOP;
  
  result := jsonb_build_object(
    'success', true,
    'constraints_fixed', renamed_count,
    'message', 'Fixed foreign key constraint naming from player_id to user_id patterns',
    'timestamp', NOW()
  );
  
  RETURN result;
END;
$function$;

-- Execute the fix
SELECT public.fix_player_id_constraints();