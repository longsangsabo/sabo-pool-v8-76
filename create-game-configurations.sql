-- Create game_configurations table for admin settings
CREATE TABLE IF NOT EXISTS public.game_configurations (
  id BIGSERIAL PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_game_configurations_updated_at 
    BEFORE UPDATE ON public.game_configurations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial ELO system configurations
INSERT INTO public.game_configurations (config_key, config_value, description, category) VALUES
('elo_system_version', '"v2.0_official"', 'Official ELO system version', 'elo'),
('elo_base_rating', '1000', 'Starting ELO for new players (K rank)', 'elo'),
('elo_rank_gap', '100', 'Consistent ELO gap between adjacent ranks', 'elo'),
('elo_max_rating', '2100', 'Open-ended max for E+ rank', 'elo'),
('tournament_elo_champion', '80', 'ELO reward for tournament champion', 'tournaments'),
('tournament_elo_runner_up', '40', 'ELO reward for tournament runner-up', 'tournaments'),
('tournament_elo_third', '20', 'ELO reward for tournament 3rd place', 'tournaments'),
('tournament_elo_fourth', '15', 'ELO reward for tournament 4th place', 'tournaments'),
('tournament_elo_top8', '10', 'ELO reward for tournament top 8', 'tournaments'),
('tournament_elo_top16', '5', 'ELO reward for tournament top 16', 'tournaments')
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Enable RLS
ALTER TABLE public.game_configurations ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read
CREATE POLICY "Allow authenticated users to read game configurations" ON public.game_configurations
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for admins to manage configurations
CREATE POLICY "Allow admins to manage game configurations" ON public.game_configurations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.is_admin = true
        )
    );
