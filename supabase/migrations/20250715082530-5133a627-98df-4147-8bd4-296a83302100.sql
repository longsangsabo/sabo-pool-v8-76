-- Create function to initialize club tables
CREATE OR REPLACE FUNCTION public.initialize_club_tables(p_club_id UUID, p_table_count INTEGER DEFAULT 8)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_existing_count INTEGER;
  v_created_count INTEGER := 0;
  i INTEGER;
BEGIN
  -- Check if tables already exist for this club
  SELECT COUNT(*) INTO v_existing_count
  FROM public.club_tables
  WHERE club_id = p_club_id;
  
  IF v_existing_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Club already has %s tables initialized', v_existing_count),
      'existing_tables', v_existing_count
    );
  END IF;
  
  -- Create tables for the club
  FOR i IN 1..p_table_count LOOP
    INSERT INTO public.club_tables (
      club_id,
      table_number,
      table_name,
      status,
      created_at,
      updated_at
    ) VALUES (
      p_club_id,
      i,
      format('Bàn %s', i),
      'available',
      NOW(),
      NOW()
    );
    
    v_created_count := v_created_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tables_created', v_created_count,
    'message', format('Successfully created %s tables for club', v_created_count)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Create function to auto-assign tables to tournament matches
CREATE OR REPLACE FUNCTION public.auto_assign_tournament_tables(p_tournament_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_club_id UUID;
  v_available_table RECORD;
  v_pending_match RECORD;
  v_assignments_made INTEGER := 0;
  v_total_matches INTEGER := 0;
BEGIN
  -- Get tournament club
  SELECT t.club_id INTO v_club_id
  FROM public.tournaments t
  WHERE t.id = p_tournament_id;
  
  IF v_club_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Tournament or club not found'
    );
  END IF;
  
  -- Count total unassigned matches
  SELECT COUNT(*) INTO v_total_matches
  FROM public.tournament_matches tm
  WHERE tm.tournament_id = p_tournament_id
    AND tm.assigned_table_number IS NULL
    AND tm.status IN ('scheduled', 'ready');
  
  -- Assign tables to ready matches (matches where both players are present)
  FOR v_pending_match IN
    SELECT tm.id as match_id, tm.round_number, tm.match_number
    FROM public.tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND tm.assigned_table_number IS NULL
      AND tm.status IN ('scheduled', 'ready')
      AND tm.player1_id IS NOT NULL
      AND tm.player2_id IS NOT NULL
    ORDER BY tm.round_number, tm.match_number
  LOOP
    -- Find an available table
    SELECT ct.table_number, ct.id INTO v_available_table
    FROM public.club_tables ct
    WHERE ct.club_id = v_club_id
      AND ct.status = 'available'
      AND ct.current_match_id IS NULL
    ORDER BY ct.table_number
    LIMIT 1;
    
    -- If we found an available table, assign it
    IF v_available_table.table_number IS NOT NULL THEN
      -- Update the match with table assignment
      UPDATE public.tournament_matches
      SET 
        assigned_table_number = v_available_table.table_number,
        updated_at = NOW()
      WHERE id = v_pending_match.match_id;
      
      -- Update the table status
      UPDATE public.club_tables
      SET 
        status = 'occupied',
        current_match_id = v_pending_match.match_id,
        last_used_at = NOW(),
        updated_at = NOW()
      WHERE id = v_available_table.id;
      
      v_assignments_made := v_assignments_made + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'assignments_made', v_assignments_made,
    'total_matches', v_total_matches,
    'message', format('Assigned %s out of %s matches to tables', v_assignments_made, v_total_matches)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Create function to release a table when match is completed
CREATE OR REPLACE FUNCTION public.release_tournament_table(p_match_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_table_number INTEGER;
  v_club_id UUID;
BEGIN
  -- Get match details
  SELECT tm.assigned_table_number, t.club_id INTO v_table_number, v_club_id
  FROM public.tournament_matches tm
  JOIN public.tournaments t ON t.id = tm.tournament_id
  WHERE tm.id = p_match_id;
  
  IF v_table_number IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Match has no assigned table'
    );
  END IF;
  
  -- Release the table
  UPDATE public.club_tables
  SET 
    status = 'available',
    current_match_id = NULL,
    updated_at = NOW()
  WHERE club_id = v_club_id 
    AND table_number = v_table_number;
  
  RETURN jsonb_build_object(
    'success', true,
    'table_number', v_table_number,
    'message', format('Released table %s', v_table_number)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Create function to get table status for a club
CREATE OR REPLACE FUNCTION public.get_club_table_status(p_club_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tables jsonb;
  v_available_count INTEGER;
  v_occupied_count INTEGER;
  v_total_count INTEGER;
BEGIN
  -- Get all tables for the club
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ct.id,
      'table_number', ct.table_number,
      'table_name', ct.table_name,
      'status', ct.status,
      'current_match_id', ct.current_match_id,
      'last_used_at', ct.last_used_at,
      'match_info', CASE 
        WHEN ct.current_match_id IS NOT NULL THEN
          jsonb_build_object(
            'round_number', tm.round_number,
            'match_number', tm.match_number,
            'tournament_name', t.name
          )
        ELSE NULL
      END
    ) ORDER BY ct.table_number
  ) INTO v_tables
  FROM public.club_tables ct
  LEFT JOIN public.tournament_matches tm ON tm.id = ct.current_match_id
  LEFT JOIN public.tournaments t ON t.id = tm.tournament_id
  WHERE ct.club_id = p_club_id;
  
  -- Get counts
  SELECT 
    COUNT(*) FILTER (WHERE status = 'available'),
    COUNT(*) FILTER (WHERE status = 'occupied'),
    COUNT(*)
  INTO v_available_count, v_occupied_count, v_total_count
  FROM public.club_tables
  WHERE club_id = p_club_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tables', COALESCE(v_tables, '[]'::jsonb),
    'summary', jsonb_build_object(
      'total', v_total_count,
      'available', v_available_count,
      'occupied', v_occupied_count
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;