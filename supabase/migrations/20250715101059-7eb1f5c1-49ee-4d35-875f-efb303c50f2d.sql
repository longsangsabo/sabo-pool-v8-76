-- Update auto_assign_tournament_tables function to support both 'ready' and 'in_progress' status
CREATE OR REPLACE FUNCTION public.auto_assign_tournament_tables(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_club_id UUID;
  v_available_tables UUID[];
  v_pending_match RECORD;
  v_assignments_made INTEGER := 0;
  v_result JSONB;
  v_random_table_id UUID;
  v_random_table_number INTEGER;
BEGIN
  -- Get tournament club
  SELECT t.club_id INTO v_club_id
  FROM public.tournaments t
  WHERE t.id = p_tournament_id;
  
  IF v_club_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Tournament or club not found');
  END IF;
  
  -- Get all available table IDs for random assignment
  SELECT ARRAY_AGG(ct.id) INTO v_available_tables
  FROM public.club_tables ct
  WHERE ct.club_id = v_club_id
  AND ct.status = 'available'
  AND ct.current_match_id IS NULL;
  
  -- Assign tables to matches (scheduled, ready, and in_progress status)
  FOR v_pending_match IN
    SELECT tm.id as match_id, tm.round_number, tm.match_number
    FROM public.tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
    AND tm.status IN ('scheduled', 'ready', 'in_progress')
    AND tm.assigned_table_id IS NULL
    AND tm.player1_id IS NOT NULL
    AND tm.player2_id IS NOT NULL
    ORDER BY tm.round_number, tm.match_number
  LOOP
    -- Check if we have available tables
    IF array_length(v_available_tables, 1) > 0 THEN
      -- Pick a random table from available ones
      v_random_table_id := v_available_tables[1 + floor(random() * array_length(v_available_tables, 1))::int];
      
      -- Get table number
      SELECT table_number INTO v_random_table_number
      FROM public.club_tables
      WHERE id = v_random_table_id;
      
      -- Update tournament match - set to 'in_progress' when table is assigned
      UPDATE public.tournament_matches
      SET 
        assigned_table_id = v_random_table_id,
        assigned_table_number = v_random_table_number,
        table_assigned_at = NOW(),
        status = 'in_progress',
        updated_at = NOW()
      WHERE id = v_pending_match.match_id;
      
      -- Update table status
      UPDATE public.club_tables
      SET 
        status = 'occupied',
        current_match_id = v_pending_match.match_id,
        last_used_at = NOW(),
        updated_at = NOW()
      WHERE id = v_random_table_id;
      
      -- Remove assigned table from available list
      v_available_tables := array_remove(v_available_tables, v_random_table_id);
      
      v_assignments_made := v_assignments_made + 1;
    ELSE
      -- No more tables available
      EXIT;
    END IF;
  END LOOP;
  
  v_result := jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'assignments_made', v_assignments_made,
    'message', format('Đã gán %s bàn cho các trận đấu', v_assignments_made),
    'timestamp', NOW()
  );
  
  RETURN v_result;
END;
$function$;