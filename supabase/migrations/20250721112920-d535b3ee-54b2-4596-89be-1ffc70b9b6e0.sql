-- Add missing columns to tournaments table for complete tournament configuration
ALTER TABLE public.tournaments 
ADD COLUMN tier_level INTEGER DEFAULT 1,
ADD COLUMN game_format TEXT DEFAULT '9_ball',
ADD COLUMN has_third_place_match BOOLEAN DEFAULT false,
ADD COLUMN rules TEXT,
ADD COLUMN contact_info TEXT,
ADD COLUMN requires_approval BOOLEAN DEFAULT false,
ADD COLUMN is_public BOOLEAN DEFAULT true,
ADD COLUMN allow_all_ranks BOOLEAN DEFAULT true,
ADD COLUMN eligible_ranks TEXT[] DEFAULT '{}',
ADD COLUMN min_rank_requirement TEXT,
ADD COLUMN max_rank_requirement TEXT,

-- Add columns for rewards system
ADD COLUMN prize_distribution JSONB DEFAULT '{}',
ADD COLUMN spa_points_config JSONB DEFAULT '{}', 
ADD COLUMN elo_points_config JSONB DEFAULT '{}',
ADD COLUMN physical_prizes JSONB DEFAULT '{}',

-- Add columns for tournament management
ADD COLUMN current_participants INTEGER DEFAULT 0,
ADD COLUMN current_phase TEXT DEFAULT 'registration',
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_visible BOOLEAN DEFAULT true;

-- Create indexes for performance
CREATE INDEX idx_tournaments_tier_level ON tournaments(tier_level);
CREATE INDEX idx_tournaments_game_format ON tournaments(game_format);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_eligible_ranks ON tournaments USING GIN(eligible_ranks);
CREATE INDEX idx_tournaments_deleted_at ON tournaments(deleted_at) WHERE deleted_at IS NOT NULL;