-- Create function to sync club_profiles data to clubs table
CREATE OR REPLACE FUNCTION sync_club_profiles_to_clubs()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.clubs (id, name, address, verified, status, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.club_name,
      NEW.address,
      CASE WHEN NEW.verification_status = 'approved' THEN true ELSE false END,
      CASE WHEN NEW.deleted_at IS NULL THEN 'active' ELSE 'inactive' END,
      NEW.created_at,
      NEW.updated_at
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      address = EXCLUDED.address,
      verified = EXCLUDED.verified,
      status = EXCLUDED.status,
      updated_at = EXCLUDED.updated_at;
    RETURN NEW;
  END IF;

  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    UPDATE public.clubs SET
      name = NEW.club_name,
      address = NEW.address,
      verified = CASE WHEN NEW.verification_status = 'approved' THEN true ELSE false END,
      status = CASE WHEN NEW.deleted_at IS NULL THEN 'active' ELSE 'inactive' END,
      updated_at = NEW.updated_at
    WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.clubs WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic sync
DROP TRIGGER IF EXISTS sync_club_profiles_insert ON public.club_profiles;
CREATE TRIGGER sync_club_profiles_insert
  AFTER INSERT ON public.club_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_club_profiles_to_clubs();

DROP TRIGGER IF EXISTS sync_club_profiles_update ON public.club_profiles;
CREATE TRIGGER sync_club_profiles_update
  AFTER UPDATE ON public.club_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_club_profiles_to_clubs();

DROP TRIGGER IF EXISTS sync_club_profiles_delete ON public.club_profiles;
CREATE TRIGGER sync_club_profiles_delete
  AFTER DELETE ON public.club_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_club_profiles_to_clubs();

-- Sync existing data from club_profiles to clubs
INSERT INTO public.clubs (id, name, address, verified, status, created_at, updated_at)
SELECT 
  id,
  club_name,
  address,
  CASE WHEN verification_status = 'approved' THEN true ELSE false END,
  CASE WHEN deleted_at IS NULL THEN 'active' ELSE 'inactive' END,
  created_at,
  updated_at
FROM public.club_profiles
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  verified = EXCLUDED.verified,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

-- Fix RLS policies for rank_requests to use club_profiles instead of clubs
DROP POLICY IF EXISTS "Clubs can view their requests" ON public.rank_requests;
CREATE POLICY "Clubs can view their requests" ON public.rank_requests
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.club_profiles WHERE id = rank_requests.club_id
    )
  );

DROP POLICY IF EXISTS "Club owners can update requests" ON public.rank_requests;
CREATE POLICY "Club owners can update requests" ON public.rank_requests
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.club_profiles WHERE id = rank_requests.club_id
    )
  );

-- Create function for manual sync (used by edge function)
CREATE OR REPLACE FUNCTION manual_sync_club_data()
RETURNS jsonb AS $$
DECLARE
  synced_count INTEGER;
  deleted_count INTEGER;
BEGIN
  -- Sync all club_profiles to clubs
  INSERT INTO public.clubs (id, name, address, verified, status, created_at, updated_at)
  SELECT 
    id,
    club_name,
    address,
    CASE WHEN verification_status = 'approved' THEN true ELSE false END,
    CASE WHEN deleted_at IS NULL THEN 'active' ELSE 'inactive' END,
    created_at,
    updated_at
  FROM public.club_profiles
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    verified = EXCLUDED.verified,
    status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at;

  GET DIAGNOSTICS synced_count = ROW_COUNT;

  -- Remove clubs that no longer exist in club_profiles
  DELETE FROM public.clubs 
  WHERE id NOT IN (SELECT id FROM public.club_profiles);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'synced_count', synced_count,
    'deleted_count', deleted_count,
    'timestamp', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;