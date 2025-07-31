
-- PHASE 1: DATABASE & INFRASTRUCTURE FIXES

-- 1. Fix tournament_matches table schema consistency
ALTER TABLE public.tournament_matches 
ADD COLUMN IF NOT EXISTS score_status TEXT DEFAULT 'pending';

ALTER TABLE public.tournament_matches 
ADD COLUMN IF NOT EXISTS score_confirmed_by UUID REFERENCES profiles(user_id);

ALTER TABLE public.tournament_matches 
ADD COLUMN IF NOT EXISTS score_confirmed_at TIMESTAMP WITH TIME ZONE;

-- 2. Create comprehensive tournament automation system
CREATE OR REPLACE FUNCTION public.universal_tournament_automation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_participant_count INTEGER;
  v_bracket_result JSONB;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = NEW.id;
  
  -- AUTOMATION 1: Auto-close registration when full
  IF NEW.status = 'registration_open' AND OLD.status != 'registration_closed' THEN
    SELECT COUNT(*) INTO v_participant_count
    FROM tournament_registrations tr
    WHERE tr.tournament_id = NEW.id 
    AND tr.registration_status = 'confirmed';
    
    -- Auto-close when reaching max capacity
    IF v_participant_count >= NEW.max_participants THEN
      UPDATE tournaments 
      SET status = 'registration_closed', updated_at = NOW()
      WHERE id = NEW.id;
      
      -- Log automation action
      INSERT INTO automation_performance_log (
        automation_type, tournament_id, success, metadata
      ) VALUES (
        'auto_close_registration', NEW.id, true,
        jsonb_build_object('participant_count', v_participant_count, 'trigger', 'capacity_reached')
      );
    END IF;
  END IF;
  
  -- AUTOMATION 2: Auto-generate bracket when registration closes
  IF NEW.status = 'registration_closed' AND OLD.status = 'registration_open' THEN
    -- Check if bracket already exists
    IF NOT EXISTS (
      SELECT 1 FROM tournament_matches WHERE tournament_id = NEW.id
    ) THEN
      -- Generate single elimination bracket
      SELECT public.generate_single_elimination_bracket(NEW.id) INTO v_bracket_result;
      
      INSERT INTO automation_performance_log (
        automation_type, tournament_id, success, metadata
      ) VALUES (
        'auto_generate_bracket', NEW.id, 
        (v_bracket_result->>'success')::boolean,
        v_bracket_result
      );
    END IF;
  END IF;
  
  -- AUTOMATION 3: Auto-start tournament at scheduled time
  IF NEW.status = 'registration_closed' AND NEW.tournament_start <= NOW() THEN
    UPDATE tournaments 
    SET status = 'ongoing', updated_at = NOW()
    WHERE id = NEW.id;
    
    INSERT INTO automation_performance_log (
      automation_type, tournament_id, success, metadata
    ) VALUES (
      'auto_start_tournament', NEW.id, true,
      jsonb_build_object('start_time', NEW.tournament_start)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Create universal single elimination bracket generator
CREATE OR REPLACE FUNCTION public.generate_single_elimination_bracket(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_participants UUID[];
  v_participant_count INTEGER;
  v_rounds_needed INTEGER;
  v_matches_created INTEGER := 0;
  v_round INTEGER;
  v_match_number INTEGER;
  v_matches_in_round INTEGER;
  v_participant RECORD;
  i INTEGER;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  -- Get confirmed participants with ELO-based seeding
  SELECT ARRAY_AGG(tr.user_id ORDER BY COALESCE(pr.elo_points, 1000) DESC) INTO v_participants
  FROM tournament_registrations tr
  LEFT JOIN player_rankings pr ON pr.user_id = tr.user_id
  WHERE tr.tournament_id = p_tournament_id 
  AND tr.registration_status = 'confirmed';
  
  v_participant_count := array_length(v_participants, 1);
  
  IF v_participant_count < 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Need at least 2 participants');
  END IF;
  
  -- Calculate rounds needed
  v_rounds_needed := CEIL(LOG(2, v_participant_count));
  
  -- Generate Round 1 matches with proper seeding
  v_matches_in_round := CEIL(v_participant_count / 2.0);
  
  FOR i IN 1..v_matches_in_round LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      player1_id, player2_id, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, i, 'single',
      v_participants[i], 
      CASE WHEN (i * 2) <= v_participant_count THEN v_participants[v_participant_count - i + 1] ELSE NULL END,
      'scheduled', NOW(), NOW()
    );
    
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- Generate placeholder matches for subsequent rounds
  FOR v_round IN 2..v_rounds_needed LOOP
    v_matches_in_round := CEIL(v_matches_in_round / 2.0);
    
    FOR i IN 1..v_matches_in_round LOOP
      INSERT INTO tournament_matches (
        tournament_id, round_number, match_number, bracket_type,
        status, created_at, updated_at
      ) VALUES (
        p_tournament_id, v_round, i, 'single',
        'pending', NOW(), NOW()
      );
      
      v_matches_created := v_matches_created + 1;
    END LOOP;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'matches_created', v_matches_created,
    'rounds_created', v_rounds_needed,
    'participants', v_participant_count
  );
END;
$$;

-- 4. Create automatic winner advancement system
CREATE OR REPLACE FUNCTION public.auto_advance_tournament_winner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_next_round INTEGER;
  v_next_match_number INTEGER;
  v_max_round INTEGER;
BEGIN
  -- Only process completed matches with winners
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND 
     (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
    
    SELECT * INTO v_tournament FROM tournaments WHERE id = NEW.tournament_id;
    
    -- Calculate next round match
    v_next_round := NEW.round_number + 1;
    v_next_match_number := CEIL(NEW.match_number / 2.0);
    
    -- Get max rounds in tournament
    SELECT MAX(round_number) INTO v_max_round
    FROM tournament_matches
    WHERE tournament_id = NEW.tournament_id;
    
    -- Advance winner to next round (if not final)
    IF v_next_round <= v_max_round THEN
      UPDATE tournament_matches
      SET 
        player1_id = CASE 
          WHEN player1_id IS NULL THEN NEW.winner_id
          WHEN player2_id IS NULL THEN player1_id
          ELSE player1_id
        END,
        player2_id = CASE 
          WHEN player1_id IS NULL THEN player2_id
          WHEN player2_id IS NULL THEN NEW.winner_id
          ELSE NEW.winner_id
        END,
        status = CASE
          WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN 'scheduled'
          WHEN player1_id IS NULL AND player2_id IS NOT NULL THEN 'scheduled'
          ELSE status
        END,
        updated_at = NOW()
      WHERE tournament_id = NEW.tournament_id
      AND round_number = v_next_round
      AND match_number = v_next_match_number;
      
      -- Log advancement
      INSERT INTO automation_performance_log (
        automation_type, tournament_id, success, metadata
      ) VALUES (
        'auto_advance_winner', NEW.tournament_id, true,
        jsonb_build_object(
          'winner_id', NEW.winner_id,
          'from_match', NEW.id,
          'to_round', v_next_round,
          'to_match', v_next_match_number
        )
      );
    ELSE
      -- Tournament is complete - final match finished
      UPDATE tournaments 
      SET status = 'completed', completed_at = NOW(), updated_at = NOW()
      WHERE id = NEW.tournament_id;
      
      -- Auto-calculate final results
      PERFORM public.calculate_tournament_standings(NEW.tournament_id);
      
      INSERT INTO automation_performance_log (
        automation_type, tournament_id, success, metadata
      ) VALUES (
        'auto_complete_tournament', NEW.tournament_id, true,
        jsonb_build_object('champion_id', NEW.winner_id)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5. Create triggers for automation
DROP TRIGGER IF EXISTS tournament_automation_trigger ON tournaments;
CREATE TRIGGER tournament_automation_trigger
  AFTER UPDATE ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION universal_tournament_automation();

DROP TRIGGER IF EXISTS match_completion_trigger ON tournament_matches;
CREATE TRIGGER match_completion_trigger
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION auto_advance_tournament_winner();

-- 6. Fix prize display formatting
CREATE OR REPLACE FUNCTION public.format_prize_amount(amount NUMERIC)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF amount >= 1000000 THEN
    RETURN ROUND(amount / 1000000, 1) || 'M VND';
  ELSIF amount >= 1000 THEN
    RETURN ROUND(amount / 1000, 0) || 'K VND';
  ELSE
    RETURN amount || ' VND';
  END IF;
END;
$$;

-- 7. Update existing tournament to test automation
UPDATE tournaments 
SET status = 'registration_closed', updated_at = NOW()
WHERE name = 'Sáng tạo nội dung';
