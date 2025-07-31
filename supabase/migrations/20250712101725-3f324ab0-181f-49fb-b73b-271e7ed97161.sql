-- Complete player_id cleanup - final constraint renaming and verification

-- First, let's create a function to rename all remaining player_id foreign key constraints
CREATE OR REPLACE FUNCTION public.complete_player_id_constraint_migration()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  constraint_record RECORD;
  sql_statement TEXT;
  renamed_count INTEGER := 0;
  result JSONB;
BEGIN
  -- Find and rename all foreign key constraints that still contain 'player_id'
  FOR constraint_record IN
    SELECT 
      tc.table_name,
      tc.constraint_name,
      REPLACE(tc.constraint_name, 'player_id', 'user_id') as new_constraint_name,
      kcu.column_name,
      REPLACE(kcu.column_name, 'player_id', 'user_id') as new_column_name,
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
      -- Drop old constraint and create new one with user_id naming
      sql_statement := format(
        'ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I; ' ||
        'ALTER TABLE public.%I ADD CONSTRAINT %I ' ||
        'FOREIGN KEY (%I) REFERENCES public.%I(%I);',
        constraint_record.table_name,
        constraint_record.constraint_name,
        constraint_record.table_name,
        constraint_record.new_constraint_name,
        constraint_record.new_column_name,
        constraint_record.foreign_table_name,
        constraint_record.foreign_column_name
      );
      
      EXECUTE sql_statement;
      renamed_count := renamed_count + 1;
      
      RAISE NOTICE 'Renamed constraint: % -> %', 
        constraint_record.constraint_name, 
        constraint_record.new_constraint_name;
        
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to rename constraint %: %', 
        constraint_record.constraint_name, 
        SQLERRM;
    END;
  END LOOP;
  
  -- Update any remaining RLS policies that reference old constraint names
  UPDATE pg_policy 
  SET polqual = replace(polqual::text, 'player_id_fkey', 'user_id_fkey')::pg_node_tree,
      polwithcheck = replace(polwithcheck::text, 'player_id_fkey', 'user_id_fkey')::pg_node_tree
  WHERE schemaname = 'public' 
    AND (polqual::text LIKE '%player_id_fkey%' OR polwithcheck::text LIKE '%player_id_fkey%');
  
  result := jsonb_build_object(
    'success', true,
    'constraints_renamed', renamed_count,
    'message', format('Successfully renamed %s foreign key constraints from player_id to user_id', renamed_count),
    'timestamp', NOW()
  );
  
  RETURN result;
END;
$function$;

-- Execute the migration
SELECT public.complete_player_id_constraint_migration();

-- Verify no player_id references remain in constraints
SELECT public.verify_player_id_cleanup();