-- Fix the sync_profile_rankings function to use correct field name
CREATE OR REPLACE FUNCTION public.sync_profile_rankings()
RETURNS TRIGGER AS $$
BEGIN
  -- Create or update player ranking when profile is updated
  INSERT INTO public.player_rankings (player_id, updated_at)
  VALUES (NEW.user_id, NOW())
  ON CONFLICT (player_id) DO UPDATE SET updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;