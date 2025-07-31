-- Create SABO Challenges Table with Handicap & Race-to Logic
CREATE TABLE IF NOT EXISTS sabo_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opponent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stake_amount INTEGER NOT NULL CHECK (stake_amount IN (100, 200, 300, 400, 500, 600)),
  race_to INTEGER NOT NULL,
  handicap_challenger NUMERIC DEFAULT 0,
  handicap_opponent NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'in_progress', 'completed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  challenger_score INTEGER DEFAULT 0,
  opponent_score INTEGER DEFAULT 0,
  winner_id UUID REFERENCES profiles(id),
  rack_history JSONB DEFAULT '[]'::jsonb,
  
  -- Constraints
  CONSTRAINT no_self_challenge_sabo CHECK (challenger_id != opponent_id),
  CONSTRAINT valid_expiration_sabo CHECK (expires_at > created_at),
  CONSTRAINT valid_scores CHECK (challenger_score >= 0 AND opponent_score >= 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sabo_challenges_challenger ON sabo_challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_sabo_challenges_opponent ON sabo_challenges(opponent_id);
CREATE INDEX IF NOT EXISTS idx_sabo_challenges_status ON sabo_challenges(status);
CREATE INDEX IF NOT EXISTS idx_sabo_challenges_created_at ON sabo_challenges(created_at);

-- Enable RLS
ALTER TABLE sabo_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their SABO challenges" ON sabo_challenges
  FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

CREATE POLICY "Users can create SABO challenges" ON sabo_challenges
  FOR INSERT WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Users can update their SABO challenges" ON sabo_challenges
  FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

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