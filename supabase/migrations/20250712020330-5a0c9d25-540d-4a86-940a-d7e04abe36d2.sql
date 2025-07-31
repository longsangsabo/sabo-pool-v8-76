-- SABO Pool Arena - Correct Challenge System Database Schema
-- Based on actual SABO challenge mechanism with handicap & race-to logic

-- 1. CREATE SABO_CHALLENGES TABLE
DROP TABLE IF EXISTS sabo_challenges CASCADE;

CREATE TABLE sabo_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opponent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- SABO-specific fields
  stake_amount INTEGER NOT NULL CHECK (stake_amount IN (100, 200, 300, 400, 500, 600)),
  race_to INTEGER NOT NULL, -- Auto-calculated from stake_amount
  handicap_challenger DECIMAL(3,1) DEFAULT 0, -- Handicap for challenger
  handicap_opponent DECIMAL(3,1) DEFAULT 0, -- Handicap for opponent
  
  -- Match status and timing
  status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'accepted', 'declined', 'in_progress', 'completed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Scoring (includes initial handicap)
  challenger_score INTEGER DEFAULT 0,
  opponent_score INTEGER DEFAULT 0,
  winner_id UUID REFERENCES profiles(id),
  
  -- Rack-by-rack history (JSONB for flexibility)
  rack_history JSONB DEFAULT '[]'::jsonb,
  
  -- Constraints
  CONSTRAINT no_self_challenge_sabo CHECK (challenger_id != opponent_id),
  CONSTRAINT valid_expiration_sabo CHECK (expires_at > created_at),
  CONSTRAINT valid_scores CHECK (challenger_score >= 0 AND opponent_score >= 0)
);

-- 2. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_sabo_challenges_challenger ON sabo_challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_sabo_challenges_opponent ON sabo_challenges(opponent_id);
CREATE INDEX IF NOT EXISTS idx_sabo_challenges_status ON sabo_challenges(status);
CREATE INDEX IF NOT EXISTS idx_sabo_challenges_created_at ON sabo_challenges(created_at);

-- 3. ROW LEVEL SECURITY
ALTER TABLE sabo_challenges ENABLE ROW LEVEL SECURITY;

-- Users can view challenges they're involved in
CREATE POLICY "Users can view their SABO challenges" ON sabo_challenges
  FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- Users can create challenges as challenger
CREATE POLICY "Users can create SABO challenges" ON sabo_challenges
  FOR INSERT WITH CHECK (auth.uid() = challenger_id);

-- Users can update challenges with restrictions
CREATE POLICY "Users can update their SABO challenges" ON sabo_challenges
  FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- 4. HELPER FUNCTIONS

-- Function to calculate race-to from stake amount
CREATE OR REPLACE FUNCTION get_race_to(stake INTEGER)
RETURNS INTEGER AS $$
BEGIN
  CASE stake
    WHEN 100 THEN RETURN 8;
    WHEN 200 THEN RETURN 12;
    WHEN 300 THEN RETURN 14;
    WHEN 400 THEN RETURN 16;
    WHEN 500 THEN RETURN 18;
    WHEN 600 THEN RETURN 22;
    ELSE RAISE EXCEPTION 'Invalid stake amount: %', stake;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate handicap between ranks
CREATE OR REPLACE FUNCTION calculate_sabo_handicap(
  challenger_rank TEXT,
  opponent_rank TEXT,
  stake INTEGER
)
RETURNS TABLE(challenger_handicap DECIMAL, opponent_handicap DECIMAL) AS $$
DECLARE
  main_ranks TEXT[] := ARRAY['K', 'I', 'H', 'G', 'F', 'E'];
  challenger_main TEXT := REPLACE(challenger_rank, '+', '');
  opponent_main TEXT := REPLACE(opponent_rank, '+', '');
  challenger_plus BOOLEAN := challenger_rank LIKE '%+';
  opponent_plus BOOLEAN := opponent_rank LIKE '%+';
  challenger_idx INTEGER := array_position(main_ranks, challenger_main);
  opponent_idx INTEGER := array_position(main_ranks, opponent_main);
  rank_diff INTEGER := ABS(challenger_idx - opponent_idx);
  handicap_amount DECIMAL;
BEGIN
  -- Initialize return values
  challenger_handicap := 0;
  opponent_handicap := 0;
  
  -- Validate rank difference (max 1 main rank)
  IF rank_diff > 1 THEN
    RAISE EXCEPTION 'Invalid challenge: Can only challenge within ±1 main rank';
  END IF;
  
  -- Different main ranks (1 main rank difference)
  IF rank_diff = 1 THEN
    -- Get main rank handicap
    handicap_amount := CASE stake
      WHEN 100 THEN 1
      WHEN 200 THEN 1.5
      WHEN 300 THEN 2
      WHEN 400 THEN 2.5
      WHEN 500 THEN 3
      WHEN 600 THEN 3.5
    END;
    
    -- Stronger player has higher index (closer to E)
    IF challenger_idx > opponent_idx THEN
      opponent_handicap := handicap_amount;
    ELSE
      challenger_handicap := handicap_amount;
    END IF;
    
  -- Same main rank but different sub-rank
  ELSIF rank_diff = 0 AND challenger_plus != opponent_plus THEN
    -- Get sub rank handicap
    handicap_amount := CASE stake
      WHEN 100 THEN 0.5
      WHEN 200 THEN 1
      WHEN 300 THEN 1.5
      WHEN 400 THEN 1.5
      WHEN 500 THEN 2
      WHEN 600 THEN 2.5
    END;
    
    -- Player with + is stronger
    IF challenger_plus AND NOT opponent_plus THEN
      opponent_handicap := handicap_amount;
    ELSIF NOT challenger_plus AND opponent_plus THEN
      challenger_handicap := handicap_amount;
    END IF;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. TRIGGERS FOR AUTOMATION

-- Auto-set race_to and handicaps on insert
CREATE OR REPLACE FUNCTION set_challenge_defaults()
RETURNS TRIGGER AS $$
DECLARE
  challenger_profile RECORD;
  opponent_profile RECORD;
  handicaps RECORD;
BEGIN
  -- Get player profiles
  SELECT current_rank INTO challenger_profile 
  FROM profiles WHERE id = NEW.challenger_id;
  
  SELECT current_rank INTO opponent_profile 
  FROM profiles WHERE id = NEW.opponent_id;
  
  -- Set race_to
  NEW.race_to := get_race_to(NEW.stake_amount);
  
  -- Calculate and set handicaps
  SELECT * INTO handicaps 
  FROM calculate_sabo_handicap(
    challenger_profile.current_rank,
    opponent_profile.current_rank,
    NEW.stake_amount
  );
  
  NEW.handicap_challenger := handicaps.challenger_handicap;
  NEW.handicap_opponent := handicaps.opponent_handicap;
  
  -- Set initial scores to handicaps
  NEW.challenger_score := NEW.handicap_challenger;
  NEW.opponent_score := NEW.handicap_opponent;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_challenge_defaults
  BEFORE INSERT ON sabo_challenges
  FOR EACH ROW
  EXECUTE FUNCTION set_challenge_defaults();

-- Auto-expire function for SABO challenges
CREATE OR REPLACE FUNCTION auto_expire_sabo_challenges()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sabo_challenges 
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < NOW();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to validate SABO challenge limits (max 3 active)
CREATE OR REPLACE FUNCTION check_sabo_challenge_limit()
RETURNS TRIGGER AS $$
DECLARE
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM sabo_challenges
  WHERE challenger_id = NEW.challenger_id
    AND status IN ('pending', 'accepted', 'in_progress');
  
  IF active_count >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 active SABO challenges allowed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for SABO challenge limit
CREATE TRIGGER trigger_sabo_challenge_limit
  BEFORE INSERT ON sabo_challenges
  FOR EACH ROW
  EXECUTE FUNCTION check_sabo_challenge_limit();

-- Function to process SABO challenge completion with SPA rewards
CREATE OR REPLACE FUNCTION complete_sabo_challenge()
RETURNS TRIGGER AS $$
DECLARE
  winner_reward INTEGER;
  loser_reward INTEGER;
BEGIN
  -- Only proceed if challenge was just completed
  IF NEW.status = 'completed' AND OLD.status = 'in_progress' AND NEW.winner_id IS NOT NULL THEN
    
    -- Winner gets full stake, loser gets 10% of stake
    winner_reward := NEW.stake_amount;
    loser_reward := ROUND(NEW.stake_amount * 0.1);
    
    -- Update winner SPA points
    UPDATE profiles 
    SET spa_points = spa_points + winner_reward,
        matches_won = matches_won + 1,
        matches_played = matches_played + 1
    WHERE id = NEW.winner_id;
    
    -- Update loser SPA points
    UPDATE profiles 
    SET spa_points = spa_points + loser_reward,
        matches_played = matches_played + 1
    WHERE id = CASE 
      WHEN NEW.winner_id = NEW.challenger_id THEN NEW.opponent_id 
      ELSE NEW.challenger_id 
    END;
    
    -- Log SPA transactions
    INSERT INTO spa_transactions (user_id, amount, transaction_type, description, challenge_id)
    VALUES 
      (NEW.winner_id, winner_reward, 'sabo_win', 'SABO Challenge Victory', NEW.id),
      (CASE WHEN NEW.winner_id = NEW.challenger_id THEN NEW.opponent_id ELSE NEW.challenger_id END, 
       loser_reward, 'sabo_participation', 'SABO Challenge Participation', NEW.id);
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for SABO challenge completion
CREATE TRIGGER trigger_sabo_challenge_completion
  AFTER UPDATE ON sabo_challenges
  FOR EACH ROW
  EXECUTE FUNCTION complete_sabo_challenge();

-- Grant permissions
GRANT ALL ON sabo_challenges TO authenticated;