-- Create ELO Rules table for Game Configuration
CREATE TABLE IF NOT EXISTS elo_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('k_factor', 'tournament_bonus', 'rank_adjustment', 'decay_factor')),
  conditions JSONB DEFAULT '{}',
  value_formula TEXT DEFAULT 'base_value',
  base_value INTEGER DEFAULT 0,
  multiplier DECIMAL(10,2) DEFAULT 1.0,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_elo_rules_type ON elo_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_elo_rules_active ON elo_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_elo_rules_priority ON elo_rules(priority);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_elo_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_elo_rules_updated_at
  BEFORE UPDATE ON elo_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_elo_rules_updated_at();

-- Insert default ELO rules
INSERT INTO elo_rules (rule_name, rule_type, base_value, multiplier, priority, is_active) VALUES
('Standard K-Factor', 'k_factor', 32, 1.0, 1, true),
('Beginner K-Factor', 'k_factor', 40, 1.0, 2, true),
('Expert K-Factor', 'k_factor', 24, 1.0, 3, true),
('Tournament Win Bonus', 'tournament_bonus', 50, 1.5, 1, true),
('Tournament Runner-up Bonus', 'tournament_bonus', 25, 1.2, 2, true);

-- Add RLS policies
ALTER TABLE elo_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin read elo_rules" ON elo_rules
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admin insert elo_rules" ON elo_rules
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admin update elo_rules" ON elo_rules
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admin delete elo_rules" ON elo_rules
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');
