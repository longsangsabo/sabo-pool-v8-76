-- Create Tournament Prize Templates table for Game Configuration
CREATE TABLE IF NOT EXISTS tournament_prize_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  tournament_type TEXT NOT NULL CHECK (tournament_type IN ('single_elimination', 'double_elimination', 'round_robin', 'swiss')),
  participant_range_min INTEGER DEFAULT 8,
  participant_range_max INTEGER DEFAULT 64,
  prize_structure JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournament_templates_type ON tournament_prize_templates(tournament_type);
CREATE INDEX IF NOT EXISTS idx_tournament_templates_active ON tournament_prize_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_tournament_templates_default ON tournament_prize_templates(is_default);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_tournament_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tournament_templates_updated_at
  BEFORE UPDATE ON tournament_prize_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_tournament_templates_updated_at();

-- Insert default tournament prize templates
INSERT INTO tournament_prize_templates (template_name, tournament_type, participant_range_min, participant_range_max, prize_structure, is_active, is_default) VALUES
('Standard 8-Player', 'single_elimination', 8, 8, '[
  {"position": 1, "position_name": "Champion", "cash_percentage": 50, "elo_points": 100, "spa_points": 500},
  {"position": 2, "position_name": "Runner-up", "cash_percentage": 30, "elo_points": 75, "spa_points": 300},
  {"position": 3, "position_name": "3rd Place", "cash_percentage": 20, "elo_points": 50, "spa_points": 200}
]', true, true),

('Standard 16-Player', 'single_elimination', 16, 16, '[
  {"position": 1, "position_name": "Champion", "cash_percentage": 40, "elo_points": 150, "spa_points": 750},
  {"position": 2, "position_name": "Runner-up", "cash_percentage": 25, "elo_points": 100, "spa_points": 500},
  {"position": 3, "position_name": "3rd Place", "cash_percentage": 15, "elo_points": 75, "spa_points": 350},
  {"position": 4, "position_name": "4th Place", "cash_percentage": 10, "elo_points": 50, "spa_points": 250},
  {"position": 5, "position_name": "5th-8th Place", "cash_percentage": 10, "elo_points": 25, "spa_points": 150}
]', true, true),

('Large Tournament 32+', 'single_elimination', 32, 64, '[
  {"position": 1, "position_name": "Champion", "cash_percentage": 35, "elo_points": 200, "spa_points": 1000},
  {"position": 2, "position_name": "Runner-up", "cash_percentage": 20, "elo_points": 150, "spa_points": 750},
  {"position": 3, "position_name": "3rd Place", "cash_percentage": 12, "elo_points": 125, "spa_points": 600},
  {"position": 4, "position_name": "4th Place", "cash_percentage": 8, "elo_points": 100, "spa_points": 450},
  {"position": 5, "position_name": "5th-8th Place", "cash_percentage": 15, "elo_points": 75, "spa_points": 300},
  {"position": 9, "position_name": "9th-16th Place", "cash_percentage": 10, "elo_points": 50, "spa_points": 200}
]', true, false),

('Double Elimination 16', 'double_elimination', 16, 16, '[
  {"position": 1, "position_name": "Champion", "cash_percentage": 45, "elo_points": 175, "spa_points": 800},
  {"position": 2, "position_name": "Runner-up", "cash_percentage": 25, "elo_points": 125, "spa_points": 550},
  {"position": 3, "position_name": "3rd Place", "cash_percentage": 15, "elo_points": 100, "spa_points": 400},
  {"position": 4, "position_name": "4th Place", "cash_percentage": 10, "elo_points": 75, "spa_points": 300},
  {"position": 5, "position_name": "5th-8th Place", "cash_percentage": 5, "elo_points": 50, "spa_points": 200}
]', true, false);

-- Add RLS policies
ALTER TABLE tournament_prize_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin read tournament_prize_templates" ON tournament_prize_templates
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admin insert tournament_prize_templates" ON tournament_prize_templates
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admin update tournament_prize_templates" ON tournament_prize_templates
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admin delete tournament_prize_templates" ON tournament_prize_templates
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Allow users to read active templates for reference
CREATE POLICY "Allow users read active tournament_prize_templates" ON tournament_prize_templates
  FOR SELECT USING (is_active = true);
