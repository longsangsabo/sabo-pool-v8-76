-- Let's drop and recreate all triggers that might affect rank_verifications
-- to ensure they don't have ambiguous column references

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS notify_club_events_rank_verifications ON rank_verifications;
DROP TRIGGER IF EXISTS update_club_stats_rank_verifications ON rank_verifications;

-- Recreate the notify_club_events trigger specifically for rank_verifications
CREATE TRIGGER notify_club_events_rank_verifications
    AFTER INSERT OR UPDATE ON rank_verifications
    FOR EACH ROW
    EXECUTE FUNCTION notify_club_events();

-- Recreate the update_club_stats trigger specifically for rank_verifications  
CREATE TRIGGER update_club_stats_rank_verifications
    AFTER INSERT OR UPDATE OR DELETE ON rank_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_club_stats();