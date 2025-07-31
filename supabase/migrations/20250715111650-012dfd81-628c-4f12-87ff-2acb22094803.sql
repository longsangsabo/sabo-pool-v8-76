-- Add score tracking columns to tournament_matches if they don't exist
DO $$ 
BEGIN
    -- Add score columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournament_matches' AND column_name = 'score_player1') THEN
        ALTER TABLE tournament_matches ADD COLUMN score_player1 INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournament_matches' AND column_name = 'score_player2') THEN
        ALTER TABLE tournament_matches ADD COLUMN score_player2 INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournament_matches' AND column_name = 'score_input_by') THEN
        ALTER TABLE tournament_matches ADD COLUMN score_input_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournament_matches' AND column_name = 'score_confirmed_by') THEN
        ALTER TABLE tournament_matches ADD COLUMN score_confirmed_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournament_matches' AND column_name = 'score_status') THEN
        ALTER TABLE tournament_matches ADD COLUMN score_status TEXT DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournament_matches' AND column_name = 'score_submitted_at') THEN
        ALTER TABLE tournament_matches ADD COLUMN score_submitted_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournament_matches' AND column_name = 'score_confirmed_at') THEN
        ALTER TABLE tournament_matches ADD COLUMN score_confirmed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;