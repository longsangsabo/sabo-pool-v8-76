-- Phase 3: Advanced Automation Features

-- 1. Profile-Rankings Auto-sync Function
CREATE OR REPLACE FUNCTION sync_profile_rankings()
RETURNS TRIGGER AS $$
BEGIN
  -- When profile is updated, ensure player_rankings entry exists
  INSERT INTO player_rankings (
    player_id, 
    elo_points, 
    elo, 
    spa_points, 
    total_matches, 
    wins, 
    losses,
    updated_at
  ) VALUES (
    NEW.user_id,
    COALESCE(NEW.elo, 1000),
    COALESCE(NEW.elo, 1000),
    50, -- Default SPA points
    0, 0, 0,
    NOW()
  ) ON CONFLICT (player_id) DO UPDATE SET
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profile-rankings sync
DROP TRIGGER IF EXISTS profile_rankings_sync_trigger ON profiles;
CREATE TRIGGER profile_rankings_sync_trigger
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_rankings();

-- 2. Avatar Processing and Validation Function
CREATE OR REPLACE FUNCTION process_avatar_upload()
RETURNS TRIGGER AS $$
BEGIN
  -- Log avatar changes for analytics
  IF NEW.avatar_url IS DISTINCT FROM OLD.avatar_url AND NEW.avatar_url IS NOT NULL THEN
    INSERT INTO analytics_events (
      user_id,
      event_name,
      session_id,
      url,
      properties
    ) VALUES (
      NEW.user_id,
      'avatar_updated',
      'system',
      '/profile',
      jsonb_build_object(
        'old_avatar', COALESCE(OLD.avatar_url, ''),
        'new_avatar', NEW.avatar_url,
        'timestamp', NOW()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for avatar processing
DROP TRIGGER IF EXISTS avatar_processing_trigger ON profiles;
CREATE TRIGGER avatar_processing_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION process_avatar_upload();

-- 3. Auto-metadata Sync Function (for important profile changes)
CREATE OR REPLACE FUNCTION sync_profile_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Track significant profile changes that should be synced with auth metadata
  IF NEW.display_name IS DISTINCT FROM OLD.display_name 
     OR NEW.avatar_url IS DISTINCT FROM OLD.avatar_url THEN
    
    -- Log for external sync (could be processed by edge function)
    INSERT INTO analytics_events (
      user_id,
      event_name,
      session_id,
      url,
      properties
    ) VALUES (
      NEW.user_id,
      'profile_metadata_sync_needed',
      'system',
      '/profile',
      jsonb_build_object(
        'display_name', NEW.display_name,
        'avatar_url', NEW.avatar_url,
        'sync_required', true
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for metadata sync
DROP TRIGGER IF EXISTS profile_metadata_sync_trigger ON profiles;
CREATE TRIGGER profile_metadata_sync_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_metadata();

-- 4. Search Optimization - Create indexes for better profile search
CREATE INDEX IF NOT EXISTS idx_profiles_search_text ON profiles USING GIN (
  to_tsvector('simple', 
    COALESCE(full_name, '') || ' ' || 
    COALESCE(display_name, '') || ' ' || 
    COALESCE(city, '') || ' ' || 
    COALESCE(district, '')
  )
);

CREATE INDEX IF NOT EXISTS idx_profiles_skill_city ON profiles (skill_level, city) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles (is_visible, activity_status) WHERE deleted_at IS NULL;