-- Create comprehensive table management system for tournaments

-- 1. Create club_tables table to track individual tables
CREATE TABLE public.club_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.club_profiles(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  table_name TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved')),
  current_match_id UUID REFERENCES public.tournament_matches(id) ON DELETE SET NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(club_id, table_number)
);

-- 2. Add table assignment fields to tournament_matches
ALTER TABLE public.tournament_matches 
ADD COLUMN IF NOT EXISTS assigned_table_id UUID REFERENCES public.club_tables(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_table_number INTEGER,
ADD COLUMN IF NOT EXISTS table_assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS table_released_at TIMESTAMP WITH TIME ZONE;

-- 3. Create table assignment automation function
CREATE OR REPLACE FUNCTION public.auto_assign_tournament_tables(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_club_id UUID;
  v_available_tables RECORD;
  v_pending_match RECORD;
  v_assignments_made INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Get tournament club
  SELECT t.club_id INTO v_club_id
  FROM public.tournaments t
  WHERE t.id = p_tournament_id;
  
  IF v_club_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Tournament or club not found');
  END IF;
  
  -- Assign tables to ready matches (matches where both players are present)
  FOR v_pending_match IN
    SELECT tm.id as match_id, tm.round_number, tm.match_number
    FROM public.tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
    AND tm.status = 'scheduled'
    AND tm.assigned_table_id IS NULL
    AND tm.player1_id IS NOT NULL
    AND tm.player2_id IS NOT NULL
    ORDER BY tm.round_number, tm.match_number
  LOOP
    -- Find available table
    SELECT ct.id, ct.table_number INTO v_available_tables
    FROM public.club_tables ct
    WHERE ct.club_id = v_club_id
    AND ct.status = 'available'
    AND ct.current_match_id IS NULL
    ORDER BY ct.table_number
    LIMIT 1;
    
    -- Assign table if found
    IF v_available_tables.id IS NOT NULL THEN
      -- Update tournament match
      UPDATE public.tournament_matches
      SET 
        assigned_table_id = v_available_tables.id,
        assigned_table_number = v_available_tables.table_number,
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
      WHERE id = v_available_tables.id;
      
      v_assignments_made := v_assignments_made + 1;
    END IF;
  END LOOP;
  
  v_result := jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'assignments_made', v_assignments_made,
    'message', format('Assigned %s tables to tournament matches', v_assignments_made),
    'timestamp', NOW()
  );
  
  RETURN v_result;
END;
$function$;

-- 4. Create function to release table when match completes
CREATE OR REPLACE FUNCTION public.release_table_on_match_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- When match status changes to completed, release the table
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.assigned_table_id IS NOT NULL THEN
    -- Release the table
    UPDATE public.club_tables
    SET 
      status = 'available',
      current_match_id = NULL,
      updated_at = NOW()
    WHERE id = NEW.assigned_table_id;
    
    -- Update match record
    NEW.table_released_at = NOW();
    
    -- Trigger auto-assignment for next matches
    PERFORM public.auto_assign_tournament_tables(NEW.tournament_id);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 5. Create trigger for automatic table release and assignment
CREATE TRIGGER trigger_auto_table_management
  BEFORE UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.release_table_on_match_complete();

-- 6. Function to initialize club tables based on club profile
CREATE OR REPLACE FUNCTION public.initialize_club_tables(p_club_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_table_count INTEGER;
  v_tables_created INTEGER := 0;
  i INTEGER;
BEGIN
  -- Get number of tables from club profile
  SELECT number_of_tables INTO v_table_count
  FROM public.club_profiles
  WHERE id = p_club_id;
  
  IF v_table_count IS NULL OR v_table_count <= 0 THEN
    RETURN jsonb_build_object('error', 'Club not found or no tables specified');
  END IF;
  
  -- Create tables if they don't exist
  FOR i IN 1..v_table_count LOOP
    INSERT INTO public.club_tables (club_id, table_number, table_name, status)
    VALUES (p_club_id, i, 'Bàn ' || i, 'available')
    ON CONFLICT (club_id, table_number) DO NOTHING;
    
    IF FOUND THEN
      v_tables_created := v_tables_created + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'club_id', p_club_id,
    'total_tables', v_table_count,
    'tables_created', v_tables_created,
    'message', format('Initialized %s tables for club', v_tables_created)
  );
END;
$function$;

-- 7. Enable RLS for club_tables
ALTER TABLE public.club_tables ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for club_tables
CREATE POLICY "Club owners can manage their tables"
ON public.club_tables
FOR ALL
USING (
  club_id IN (
    SELECT cp.id FROM public.club_profiles cp 
    WHERE cp.user_id = auth.uid()
  )
);

CREATE POLICY "Everyone can view club tables"
ON public.club_tables
FOR SELECT
USING (true);

-- 9. Create updated_at trigger for club_tables
CREATE TRIGGER update_club_tables_updated_at
  BEFORE UPDATE ON public.club_tables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();