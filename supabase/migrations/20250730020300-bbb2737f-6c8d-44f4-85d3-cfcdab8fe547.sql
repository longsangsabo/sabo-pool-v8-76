-- PHASE 4.2: Tournament Data Migration Function
-- Create function to safely migrate existing tournaments to SABO structure

CREATE OR REPLACE FUNCTION migrate_tournament_to_sabo(
  p_tournament_id UUID
) RETURNS jsonb AS $$
DECLARE
  existing_matches INTEGER;
  existing_players INTEGER;
  migration_result jsonb;
  v_tournament_record RECORD;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament_record 
  FROM tournaments 
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Check current tournament state
  SELECT COUNT(*) INTO existing_matches 
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id;
  
  -- Check if tournament has registrations
  SELECT COUNT(*) INTO existing_players
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id 
  AND registration_status = 'confirmed';
  
  -- Only migrate if tournament has wrong structure or no matches
  IF existing_matches = 0 OR existing_matches != 27 THEN
    -- Backup existing matches if any
    IF existing_matches > 0 THEN
      -- Log the migration for audit
      INSERT INTO tournament_automation_log (
        tournament_id,
        automation_type,
        status,
        details,
        completed_at
      ) VALUES (
        p_tournament_id,
        'sabo_migration',
        'started',
        jsonb_build_object(
          'previous_matches', existing_matches,
          'tournament_name', v_tournament_record.name,
          'migration_reason', 'SABO structure compliance'
        ),
        NOW()
      );
    END IF;
    
    -- Clear existing matches
    DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
    
    -- Generate SABO structure using existing function
    SELECT create_sabo_tournament_structure(p_tournament_id) INTO migration_result;
    
    -- Log successful migration
    INSERT INTO tournament_automation_log (
      tournament_id,
      automation_type,
      status,
      details,
      completed_at
    ) VALUES (
      p_tournament_id,
      'sabo_migration',
      'completed',
      jsonb_build_object(
        'previous_matches', existing_matches,
        'new_structure', migration_result,
        'total_players', existing_players,
        'sabo_matches_created', 27
      ),
      NOW()
    );
    
    RETURN jsonb_build_object(
      'success', true,
      'migrated', true,
      'tournament_id', p_tournament_id,
      'tournament_name', v_tournament_record.name,
      'previous_matches', existing_matches,
      'new_matches', 27,
      'total_players', existing_players,
      'structure_type', 'SABO',
      'migration_result', migration_result
    );
  ELSE
    -- Check if already SABO compliant (has correct round structure)
    IF EXISTS (
      SELECT 1 FROM tournament_matches 
      WHERE tournament_id = p_tournament_id 
      AND round_number IN (1,2,3,101,102,103,201,202,250,300)
      GROUP BY round_number
      HAVING COUNT(*) > 0
    ) THEN
      RETURN jsonb_build_object(
        'success', true, 
        'already_sabo', true,
        'tournament_id', p_tournament_id,
        'tournament_name', v_tournament_record.name,
        'message', 'Tournament already has SABO structure'
      );
    ELSE
      RETURN jsonb_build_object(
        'error', 'Tournament has non-SABO structure with 27 matches',
        'tournament_id', p_tournament_id,
        'existing_matches', existing_matches,
        'suggestion', 'Manual review required'
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to migrate all tournaments needing SABO structure
CREATE OR REPLACE FUNCTION migrate_all_tournaments_to_sabo()
RETURNS jsonb AS $$
DECLARE
  v_tournament RECORD;
  v_migration_result jsonb;
  v_migrated_count INTEGER := 0;
  v_already_sabo_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_results jsonb[] := '{}';
BEGIN
  -- Find all double elimination tournaments that might need migration
  FOR v_tournament IN
    SELECT t.id, t.name, t.tournament_type, t.status
    FROM tournaments t
    WHERE t.tournament_type = 'double_elimination'
    AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  LOOP
    -- Attempt migration
    SELECT migrate_tournament_to_sabo(v_tournament.id) INTO v_migration_result;
    
    -- Count results
    IF v_migration_result ? 'success' AND (v_migration_result->>'success')::boolean THEN
      IF v_migration_result ? 'migrated' AND (v_migration_result->>'migrated')::boolean THEN
        v_migrated_count := v_migrated_count + 1;
      ELSIF v_migration_result ? 'already_sabo' AND (v_migration_result->>'already_sabo')::boolean THEN
        v_already_sabo_count := v_already_sabo_count + 1;
      END IF;
    ELSE
      v_error_count := v_error_count + 1;
    END IF;
    
    -- Store result
    v_results := v_results || v_migration_result;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_tournaments_checked', v_migrated_count + v_already_sabo_count + v_error_count,
    'migrated_count', v_migrated_count,
    'already_sabo_count', v_already_sabo_count,
    'error_count', v_error_count,
    'migration_details', v_results,
    'completed_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'migrated_count', v_migrated_count,
      'already_sabo_count', v_already_sabo_count,
      'error_count', v_error_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;