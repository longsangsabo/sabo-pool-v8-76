-- Add spa_points_earned column to tournament_results table
ALTER TABLE tournament_results 
ADD COLUMN IF NOT EXISTS spa_points_earned INTEGER DEFAULT 0;