
-- Fix inconsistent tournament data and improve database structure
-- 1. Fix "test1" tournament data consistency
UPDATE tournaments 
SET status = 'registration_open',
    has_bracket = false,
    current_participants = (
      SELECT COUNT(*) FROM tournament_registrations 
      WHERE tournament_id = tournaments.id 
      AND registration_status = 'confirmed'
    )
WHERE name = 'test1' AND status = 'completed';

-- 2. Clean up any inconsistent match data for test tournaments
DELETE FROM tournament_matches 
WHERE tournament_id IN (
  SELECT id FROM tournaments 
  WHERE name IN ('test1', 'Test Tournament') 
  AND status != 'completed'
);

-- 3. Clean up tournament results for incomplete tournaments
DELETE FROM tournament_results 
WHERE tournament_id IN (
  SELECT id FROM tournaments 
  WHERE status != 'completed'
);

-- 4. Add missing columns for better tournament management
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS bracket_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bracket_type TEXT DEFAULT 'single_elimination',
ADD COLUMN IF NOT EXISTS auto_advance_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS results_processed BOOLEAN DEFAULT false;

-- 5. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_status ON tournament_matches(tournament_id, status);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_status ON tournament_registrations(tournament_id, registration_status);

-- 6. Create function to auto-update tournament participant counts
CREATE OR REPLACE FUNCTION update_tournament_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update current_participants count when registration changes
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE tournaments 
    SET current_participants = (
      SELECT COUNT(*) FROM tournament_registrations 
      WHERE tournament_id = NEW.tournament_id 
      AND registration_status = 'confirmed'
    ),
    updated_at = NOW()
    WHERE id = NEW.tournament_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tournaments 
    SET current_participants = (
      SELECT COUNT(*) FROM tournament_registrations 
      WHERE tournament_id = OLD.tournament_id 
      AND registration_status = 'confirmed'
    ),
    updated_at = NOW()
    WHERE id = OLD.tournament_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for auto-updating participant counts
DROP TRIGGER IF EXISTS trigger_update_tournament_participants ON tournament_registrations;
CREATE TRIGGER trigger_update_tournament_participants
  AFTER INSERT OR UPDATE OR DELETE ON tournament_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_tournament_participant_count();

-- 8. Create function to auto-advance tournament winners
CREATE OR REPLACE FUNCTION auto_advance_tournament_winner()
RETURNS TRIGGER AS $$
DECLARE
  v_tournament RECORD;
  v_next_match RECORD;
  v_match_position INTEGER;
BEGIN
  -- Only process when a match is completed
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND 
     (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Get tournament info
    SELECT * INTO v_tournament FROM tournaments WHERE id = NEW.tournament_id;
    
    -- Only auto-advance if enabled
    IF v_tournament.auto_advance_enabled THEN
      -- Find next match in bracket
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = NEW.tournament_id
        AND round_number = NEW.round_number + 1
        AND match_number = CEIL(NEW.match_number::FLOAT / 2)
        AND status = 'pending';
      
      -- If next match exists, advance the winner
      IF FOUND THEN
        -- Determine position in next match (odd match_number goes to player1, even to player2)
        v_match_position := CASE WHEN NEW.match_number % 2 = 1 THEN 1 ELSE 2 END;
        
        IF v_match_position = 1 THEN
          UPDATE tournament_matches 
          SET player1_id = NEW.winner_id,
              status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
              updated_at = NOW()
          WHERE id = v_next_match.id;
        ELSE
          UPDATE tournament_matches 
          SET player2_id = NEW.winner_id,
              status = CASE WHEN player1_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
              updated_at = NOW()
          WHERE id = v_next_match.id;
        END IF;
        
        RAISE NOTICE 'Advanced winner % to next match %', NEW.winner_id, v_next_match.id;
      END IF;
      
      -- Check if tournament is complete (no more pending/scheduled matches)
      IF NOT EXISTS (
        SELECT 1 FROM tournament_matches 
        WHERE tournament_id = NEW.tournament_id 
        AND status IN ('pending', 'scheduled')
      ) THEN
        -- Mark tournament as completed
        UPDATE tournaments 
        SET status = 'completed',
            completed_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.tournament_id;
        
        RAISE NOTICE 'Tournament % completed', NEW.tournament_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for auto-advancing winners
DROP TRIGGER IF EXISTS trigger_auto_advance_winner ON tournament_matches;
CREATE TRIGGER trigger_auto_advance_winner
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION auto_advance_tournament_winner();

-- 10. Update tournament status based on registration deadline
CREATE OR REPLACE FUNCTION check_tournament_registration_deadline()
RETURNS void AS $$
BEGIN
  -- Auto-close registration for tournaments past deadline
  UPDATE tournaments 
  SET status = 'registration_closed',
      updated_at = NOW()
  WHERE status = 'registration_open'
    AND registration_end < NOW()
    AND current_participants >= 2; -- Only if we have minimum participants
  
  -- Cancel tournaments with insufficient participants past deadline
  UPDATE tournaments 
  SET status = 'cancelled',
      updated_at = NOW()
  WHERE status = 'registration_open'
    AND registration_end < NOW()
    AND current_participants < 2;
    
  RAISE NOTICE 'Tournament registration deadline check completed';
END;
$$ LANGUAGE plpgsql;
