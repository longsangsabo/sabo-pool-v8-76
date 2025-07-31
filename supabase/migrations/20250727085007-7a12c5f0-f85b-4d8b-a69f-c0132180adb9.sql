-- Phase 3: Database Schema Enhancements for DE16 System
-- 3.1 Tournament Matches Table Enhancement

-- Add new columns for DE16 structure
ALTER TABLE tournament_matches 
ADD COLUMN IF NOT EXISTS match_stage VARCHAR(20) 
CHECK (match_stage IN (
  'winners_round_1', 'winners_round_2', 'winners_round_3',
  'losers_branch_a_round_1', 'losers_branch_a_round_2', 'losers_branch_a_round_3',
  'losers_branch_b_round_1', 'losers_branch_b_round_2',
  'semifinal', 'final'
));

ALTER TABLE tournament_matches 
ADD COLUMN IF NOT EXISTS loser_branch CHAR(1) 
CHECK (loser_branch IN ('A', 'B'));

ALTER TABLE tournament_matches
ADD COLUMN IF NOT EXISTS round_position INTEGER;

-- 3.2 Tournaments Table Enhancement

-- Add tournament progression tracking
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS bracket_progression JSONB DEFAULT '{
  "winners_bracket_completed": false,
  "branch_a_completed": false, 
  "branch_b_completed": false,
  "semifinal_ready": false,
  "final_ready": false,
  "tournament_complete": false
}'::jsonb;

-- Add DE16 specific settings
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS bracket_config JSONB DEFAULT '{
  "type": "double_elimination_16",
  "total_matches": 27,
  "winners_matches": 14,
  "losers_matches": 10,
  "final_matches": 3
}'::jsonb;

-- 3.3 Tournament Registrations Enhancement (using tournament_registrations instead of tournament_participants)

-- Add bracket assignment tracking to tournament_registrations
ALTER TABLE tournament_registrations
ADD COLUMN IF NOT EXISTS current_bracket VARCHAR(20) DEFAULT 'winners'
CHECK (current_bracket IN ('winners', 'losers_a', 'losers_b', 'eliminated', 'semifinal', 'final'));

ALTER TABLE tournament_registrations
ADD COLUMN IF NOT EXISTS elimination_round INTEGER;

ALTER TABLE tournament_registrations  
ADD COLUMN IF NOT EXISTS bracket_position INTEGER;

-- 3.4 Create Indexes for Performance

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tournament_matches_stage 
ON tournament_matches(tournament_id, match_stage);

CREATE INDEX IF NOT EXISTS idx_tournament_matches_bracket_branch
ON tournament_matches(tournament_id, bracket_type, loser_branch);

CREATE INDEX IF NOT EXISTS idx_tournament_registrations_bracket
ON tournament_registrations(tournament_id, current_bracket);

-- Additional performance indexes for DE16 queries
CREATE INDEX IF NOT EXISTS idx_tournament_matches_round_position
ON tournament_matches(tournament_id, round_number, round_position);

CREATE INDEX IF NOT EXISTS idx_tournaments_bracket_config
ON tournaments USING gin(bracket_config);

CREATE INDEX IF NOT EXISTS idx_tournaments_bracket_progression  
ON tournaments USING gin(bracket_progression);

-- 3.5 Create Helper Function for Bracket Progression Updates

CREATE OR REPLACE FUNCTION update_tournament_bracket_progression(
  p_tournament_id UUID,
  p_progression_key TEXT,
  p_value BOOLEAN
) RETURNS JSONB AS $$
DECLARE
  v_current_progression JSONB;
  v_updated_progression JSONB;
BEGIN
  -- Get current progression
  SELECT bracket_progression INTO v_current_progression
  FROM tournaments 
  WHERE id = p_tournament_id;
  
  -- Update the specific key
  v_updated_progression := jsonb_set(
    COALESCE(v_current_progression, '{}'::jsonb),
    ARRAY[p_progression_key],
    to_jsonb(p_value)
  );
  
  -- Update the tournament
  UPDATE tournaments 
  SET bracket_progression = v_updated_progression,
      updated_at = NOW()
  WHERE id = p_tournament_id;
  
  RETURN v_updated_progression;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.6 Create Trigger for Automatic Bracket Progression Tracking

CREATE OR REPLACE FUNCTION check_bracket_progression_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_tournament_id UUID;
  v_match_stage TEXT;
  v_winners_round_1_complete BOOLEAN;
  v_winners_round_2_complete BOOLEAN;
  v_winners_round_3_complete BOOLEAN;
  v_branch_a_complete BOOLEAN;
  v_branch_b_complete BOOLEAN;
  v_semifinal_ready BOOLEAN;
  v_final_ready BOOLEAN;
BEGIN
  v_tournament_id := NEW.tournament_id;
  v_match_stage := NEW.match_stage;
  
  -- Only proceed if match was just completed
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL THEN
    
    -- Check Winners Bracket Round 1 completion
    SELECT NOT EXISTS(
      SELECT 1 FROM tournament_matches 
      WHERE tournament_id = v_tournament_id 
      AND match_stage = 'winners_round_1' 
      AND status != 'completed'
    ) INTO v_winners_round_1_complete;
    
    -- Check Winners Bracket Round 2 completion  
    SELECT NOT EXISTS(
      SELECT 1 FROM tournament_matches 
      WHERE tournament_id = v_tournament_id 
      AND match_stage = 'winners_round_2' 
      AND status != 'completed'
    ) INTO v_winners_round_2_complete;
    
    -- Check Winners Bracket Round 3 completion
    SELECT NOT EXISTS(
      SELECT 1 FROM tournament_matches 
      WHERE tournament_id = v_tournament_id 
      AND match_stage = 'winners_round_3' 
      AND status != 'completed'
    ) INTO v_winners_round_3_complete;
    
    -- Check Losers Branch A completion
    SELECT NOT EXISTS(
      SELECT 1 FROM tournament_matches 
      WHERE tournament_id = v_tournament_id 
      AND match_stage LIKE 'losers_branch_a%' 
      AND status != 'completed'
    ) INTO v_branch_a_complete;
    
    -- Check Losers Branch B completion
    SELECT NOT EXISTS(
      SELECT 1 FROM tournament_matches 
      WHERE tournament_id = v_tournament_id 
      AND match_stage LIKE 'losers_branch_b%' 
      AND status != 'completed'
    ) INTO v_branch_b_complete;
    
    -- Check if semifinal is ready (winners round 3 complete AND both branches complete)
    v_semifinal_ready := v_winners_round_3_complete AND v_branch_a_complete AND v_branch_b_complete;
    
    -- Check if final is ready (semifinal complete)
    SELECT NOT EXISTS(
      SELECT 1 FROM tournament_matches 
      WHERE tournament_id = v_tournament_id 
      AND match_stage = 'semifinal' 
      AND status != 'completed'
    ) INTO v_final_ready;
    
    -- Update bracket progression
    UPDATE tournaments 
    SET bracket_progression = jsonb_build_object(
      'winners_bracket_completed', v_winners_round_1_complete AND v_winners_round_2_complete AND v_winners_round_3_complete,
      'branch_a_completed', v_branch_a_complete,
      'branch_b_completed', v_branch_b_complete,
      'semifinal_ready', v_semifinal_ready,
      'final_ready', v_final_ready,
      'tournament_complete', (
        SELECT NOT EXISTS(
          SELECT 1 FROM tournament_matches 
          WHERE tournament_id = v_tournament_id 
          AND match_stage = 'final' 
          AND status != 'completed'
        )
      )
    ),
    updated_at = NOW()
    WHERE id = v_tournament_id;
    
    -- Log progression update
    INSERT INTO tournament_automation_log (
      tournament_id,
      automation_type,
      status,
      details,
      completed_at
    ) VALUES (
      v_tournament_id,
      'bracket_progression_update',
      'completed',
      jsonb_build_object(
        'updated_stage', v_match_stage,
        'match_id', NEW.id,
        'progression_state', (
          SELECT bracket_progression FROM tournaments WHERE id = v_tournament_id
        )
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS tournament_bracket_progression_trigger ON tournament_matches;
CREATE TRIGGER tournament_bracket_progression_trigger
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION check_bracket_progression_trigger();

-- 3.7 Data Migration for Existing Tournaments

-- Update existing double elimination tournaments with default bracket config
UPDATE tournaments 
SET bracket_config = '{
  "type": "double_elimination_16",
  "total_matches": 27,
  "winners_matches": 14,
  "losers_matches": 10,
  "final_matches": 3
}'::jsonb
WHERE tournament_type = 'double_elimination' 
AND bracket_config IS NULL;

-- Update existing double elimination tournaments with default progression tracking  
UPDATE tournaments 
SET bracket_progression = '{
  "winners_bracket_completed": false,
  "branch_a_completed": false, 
  "branch_b_completed": false,
  "semifinal_ready": false,
  "final_ready": false,
  "tournament_complete": false
}'::jsonb
WHERE tournament_type = 'double_elimination' 
AND bracket_progression IS NULL;

-- Set default current_bracket for existing registrations
UPDATE tournament_registrations 
SET current_bracket = 'winners'
WHERE current_bracket IS NULL 
AND tournament_id IN (
  SELECT id FROM tournaments WHERE tournament_type = 'double_elimination'
);