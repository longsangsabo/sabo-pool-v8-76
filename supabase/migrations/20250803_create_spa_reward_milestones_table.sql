-- Create SPA Reward Milestones table for Game Configuration
CREATE TABLE IF NOT EXISTS spa_reward_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_name TEXT NOT NULL,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('matches_won', 'win_streak', 'elo_gained', 'tournaments_won', 'rank_achieved', 'consecutive_days')),
  requirement_value INTEGER NOT NULL,
  spa_reward INTEGER NOT NULL,
  bonus_conditions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_repeatable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_spa_milestones_type ON spa_reward_milestones(milestone_type);
CREATE INDEX IF NOT EXISTS idx_spa_milestones_active ON spa_reward_milestones(is_active);
CREATE INDEX IF NOT EXISTS idx_spa_milestones_repeatable ON spa_reward_milestones(is_repeatable);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_spa_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_spa_milestones_updated_at
  BEFORE UPDATE ON spa_reward_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_spa_milestones_updated_at();

-- Insert default SPA reward milestones
INSERT INTO spa_reward_milestones (milestone_name, milestone_type, requirement_value, spa_reward, is_active, is_repeatable) VALUES
('First Victory', 'matches_won', 1, 100, true, false),
('5 Match Winner', 'matches_won', 5, 250, true, false),
('10 Match Winner', 'matches_won', 10, 500, true, false),
('Win Streak 3', 'win_streak', 3, 150, true, true),
('Win Streak 5', 'win_streak', 5, 300, true, true),
('Win Streak 10', 'win_streak', 10, 750, true, true),
('ELO Climber +100', 'elo_gained', 100, 200, true, true),
('ELO Climber +250', 'elo_gained', 250, 500, true, true),
('Tournament Champion', 'tournaments_won', 1, 1000, true, true),
('Daily Player', 'consecutive_days', 7, 350, true, true);

-- Add RLS policies
ALTER TABLE spa_reward_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin read spa_reward_milestones" ON spa_reward_milestones
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admin insert spa_reward_milestones" ON spa_reward_milestones
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admin update spa_reward_milestones" ON spa_reward_milestones
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admin delete spa_reward_milestones" ON spa_reward_milestones
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Allow users to read active milestones for reference
CREATE POLICY "Allow users read active spa_reward_milestones" ON spa_reward_milestones
  FOR SELECT USING (is_active = true);
