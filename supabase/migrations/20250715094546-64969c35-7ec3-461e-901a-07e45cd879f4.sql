-- Function to update table status based on current_match_id
CREATE OR REPLACE FUNCTION public.update_table_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When current_match_id is set, mark table as occupied
  IF NEW.current_match_id IS NOT NULL AND (OLD.current_match_id IS NULL OR OLD.current_match_id != NEW.current_match_id) THEN
    NEW.status = 'occupied';
    NEW.last_used_at = NOW();
  -- When current_match_id is cleared, mark table as available
  ELSIF NEW.current_match_id IS NULL AND OLD.current_match_id IS NOT NULL THEN
    NEW.status = 'available';
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update table status
DROP TRIGGER IF EXISTS trigger_update_table_status ON public.club_tables;
CREATE TRIGGER trigger_update_table_status
  BEFORE UPDATE ON public.club_tables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_table_status();

-- Update all existing tables to have correct status based on current_match_id
UPDATE public.club_tables 
SET status = CASE 
  WHEN current_match_id IS NOT NULL THEN 'occupied'
  ELSE 'available'
END,
updated_at = NOW();