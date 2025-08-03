-- Migration: Enhanced Profile System for Backend Integration
-- Created: 2025-08-03
-- Purpose: Add tables and functions for complete profile data integration

-- 1. Enhanced profile statistics table
CREATE TABLE IF NOT EXISTS profile_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Match Statistics
  total_matches INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  matches_lost INTEGER DEFAULT 0,
  matches_drawn INTEGER DEFAULT 0,
  win_percentage DECIMAL(5,2) DEFAULT 0,
  current_win_streak INTEGER DEFAULT 0,
  best_win_streak INTEGER DEFAULT 0,
  current_lose_streak INTEGER DEFAULT 0,
  
  -- Time Statistics
  total_play_time_minutes INTEGER DEFAULT 0,
  average_match_duration DECIMAL(8,2) DEFAULT 0,
  
  -- Ranking Statistics
  elo_rating INTEGER DEFAULT 1000,
  current_ranking INTEGER,
  best_ranking INTEGER,
  weekly_ranking INTEGER,
  monthly_ranking INTEGER,
  
  -- Activity Statistics
  monthly_matches INTEGER DEFAULT 0,
  weekly_matches INTEGER DEFAULT 0,
  daily_matches INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id)
);

-- 2. User activities feed
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Activity Details
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('match', 'achievement', 'rank_change', 'spa_points', 'tournament', 'challenge', 'club', 'social')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Metadata (JSON for flexible data)
  metadata JSONB DEFAULT '{}',
  
  -- Reference to source (optional)
  reference_table VARCHAR(50), -- 'matches', 'tournaments', 'challenges', etc.
  reference_id UUID,
  
  -- Visibility and importance
  is_public BOOLEAN DEFAULT true,
  importance_level INTEGER DEFAULT 1 CHECK (importance_level BETWEEN 1 AND 5),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_user_activities_user_created (user_id, created_at DESC),
  INDEX idx_user_activities_type (activity_type),
  INDEX idx_user_activities_reference (reference_table, reference_id)
);

-- 3. Enhanced achievements system
CREATE TABLE IF NOT EXISTS achievement_definitions (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('match', 'tournament', 'social', 'progression', 'special')),
  icon_url VARCHAR(500),
  
  -- Requirements (JSON for flexible conditions)
  requirements JSONB NOT NULL DEFAULT '{}',
  
  -- Reward information
  spa_points_reward INTEGER DEFAULT 0,
  badge_color VARCHAR(20) DEFAULT 'bronze' CHECK (badge_color IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  
  -- Meta
  is_active BOOLEAN DEFAULT true,
  is_hidden BOOLEAN DEFAULT false, -- Hidden achievements (surprise unlocks)
  rarity DECIMAL(5,2) DEFAULT 100, -- Percentage of users who have this (calculated)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  achievement_id VARCHAR(100) REFERENCES achievement_definitions(id),
  
  -- Achievement details at time of earning
  achievement_name VARCHAR(255) NOT NULL,
  achievement_description TEXT,
  achievement_category VARCHAR(50) NOT NULL,
  spa_points_earned INTEGER DEFAULT 0,
  
  -- Context when earned
  metadata JSONB DEFAULT '{}',
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, achievement_id),
  
  -- Indexes
  INDEX idx_user_achievements_user (user_id),
  INDEX idx_user_achievements_category (achievement_category),
  INDEX idx_user_achievements_earned (earned_at DESC)
);

-- 4. SPA Points detailed tracking
CREATE TABLE IF NOT EXISTS spa_points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Transaction details
  points_change INTEGER NOT NULL, -- Can be positive or negative
  current_balance INTEGER NOT NULL,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('match_win', 'match_loss', 'tournament_reward', 'achievement_unlock', 'daily_bonus', 'purchase', 'refund', 'admin_adjustment')),
  
  -- Description and context
  description TEXT,
  
  -- Reference to source transaction
  reference_table VARCHAR(50), -- 'matches', 'tournaments', 'user_achievements', etc.
  reference_id UUID,
  
  -- Metadata for additional context
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_spa_points_user_created (user_id, created_at DESC),
  INDEX idx_spa_points_type (transaction_type),
  INDEX idx_spa_points_reference (reference_table, reference_id)
);

-- 5. Enhanced profiles table (add missing columns)
DO $$ 
BEGIN
  -- Add completion_percentage if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'completion_percentage') THEN
    ALTER TABLE profiles ADD COLUMN completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100);
  END IF;
  
  -- Add member_since if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'member_since') THEN
    ALTER TABLE profiles ADD COLUMN member_since TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- Add total_spa_points if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_spa_points') THEN
    ALTER TABLE profiles ADD COLUMN total_spa_points INTEGER DEFAULT 0;
  END IF;
END $$;

-- 6. Functions for automated calculations

-- Function to calculate and update profile statistics
CREATE OR REPLACE FUNCTION update_profile_statistics(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
    total_matches INTEGER;
    matches_won INTEGER;
    matches_lost INTEGER;
    matches_drawn INTEGER;
    win_percentage DECIMAL(5,2);
    current_streak INTEGER;
    best_streak INTEGER;
    total_time INTEGER;
    avg_duration DECIMAL(8,2);
BEGIN
    -- Calculate match statistics
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE winner_id = target_user_id),
        COUNT(*) FILTER (WHERE (player1_id = target_user_id OR player2_id = target_user_id) AND winner_id IS NOT NULL AND winner_id != target_user_id),
        COUNT(*) FILTER (WHERE winner_id IS NULL)
    INTO total_matches, matches_won, matches_lost, matches_drawn
    FROM matches 
    WHERE (player1_id = target_user_id OR player2_id = target_user_id) 
    AND status = 'completed';
    
    -- Calculate win percentage
    IF total_matches > 0 THEN
        win_percentage := ROUND((matches_won::DECIMAL / total_matches::DECIMAL) * 100, 2);
    ELSE
        win_percentage := 0;
    END IF;
    
    -- Calculate current win streak (simplified)
    WITH recent_matches AS (
        SELECT winner_id = target_user_id as is_win,
               ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
        FROM matches 
        WHERE (player1_id = target_user_id OR player2_id = target_user_id) 
        AND status = 'completed'
        AND winner_id IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 50
    )
    SELECT COUNT(*) INTO current_streak
    FROM recent_matches 
    WHERE rn <= (
        SELECT COALESCE(MIN(rn) - 1, COUNT(*))
        FROM recent_matches 
        WHERE NOT is_win
    ) AND is_win;
    
    -- Insert or update statistics
    INSERT INTO profile_statistics (
        user_id, total_matches, matches_won, matches_lost, matches_drawn,
        win_percentage, current_win_streak, updated_at
    ) VALUES (
        target_user_id, total_matches, matches_won, matches_lost, matches_drawn,
        win_percentage, COALESCE(current_streak, 0), NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        total_matches = EXCLUDED.total_matches,
        matches_won = EXCLUDED.matches_won,
        matches_lost = EXCLUDED.matches_lost,
        matches_drawn = EXCLUDED.matches_drawn,
        win_percentage = EXCLUDED.win_percentage,
        current_win_streak = EXCLUDED.current_win_streak,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to add activity
CREATE OR REPLACE FUNCTION add_user_activity(
    target_user_id UUID,
    activity_type VARCHAR(50),
    title VARCHAR(255),
    description TEXT DEFAULT NULL,
    metadata JSONB DEFAULT '{}',
    reference_table VARCHAR(50) DEFAULT NULL,
    reference_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO user_activities (
        user_id, activity_type, title, description, metadata, reference_table, reference_id
    ) VALUES (
        target_user_id, activity_type, title, description, metadata, reference_table, reference_id
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add SPA points transaction
CREATE OR REPLACE FUNCTION add_spa_points_transaction(
    target_user_id UUID,
    points_change INTEGER,
    transaction_type VARCHAR(50),
    description TEXT DEFAULT NULL,
    reference_table VARCHAR(50) DEFAULT NULL,
    reference_id UUID DEFAULT NULL,
    metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    current_balance INTEGER;
    transaction_id UUID;
BEGIN
    -- Get current balance
    SELECT COALESCE(total_spa_points, 0) INTO current_balance 
    FROM profiles 
    WHERE user_id = target_user_id;
    
    -- Calculate new balance
    current_balance := current_balance + points_change;
    
    -- Update profile
    UPDATE profiles 
    SET total_spa_points = current_balance 
    WHERE user_id = target_user_id;
    
    -- Record transaction
    INSERT INTO spa_points_history (
        user_id, points_change, current_balance, transaction_type, 
        description, reference_table, reference_id, metadata
    ) VALUES (
        target_user_id, points_change, current_balance, transaction_type,
        description, reference_table, reference_id, metadata
    ) RETURNING id INTO transaction_id;
    
    RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    completion INTEGER := 0;
    profile_record profiles%ROWTYPE;
BEGIN
    SELECT * INTO profile_record FROM profiles WHERE user_id = target_user_id;
    
    IF profile_record.user_id IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Check each field (10 points each, total 100)
    IF profile_record.full_name IS NOT NULL AND LENGTH(TRIM(profile_record.full_name)) > 0 THEN
        completion := completion + 15;
    END IF;
    
    IF profile_record.display_name IS NOT NULL AND LENGTH(TRIM(profile_record.display_name)) > 0 THEN
        completion := completion + 10;
    END IF;
    
    IF profile_record.avatar_url IS NOT NULL AND LENGTH(TRIM(profile_record.avatar_url)) > 0 THEN
        completion := completion + 15;
    END IF;
    
    IF profile_record.bio IS NOT NULL AND LENGTH(TRIM(profile_record.bio)) > 0 THEN
        completion := completion + 10;
    END IF;
    
    IF profile_record.phone IS NOT NULL AND LENGTH(TRIM(profile_record.phone)) > 0 THEN
        completion := completion + 10;
    END IF;
    
    IF profile_record.city IS NOT NULL AND LENGTH(TRIM(profile_record.city)) > 0 THEN
        completion := completion + 10;
    END IF;
    
    IF profile_record.verified_rank IS NOT NULL THEN
        completion := completion + 15;
    END IF;
    
    IF profile_record.skill_level IS NOT NULL AND profile_record.skill_level != 'beginner' THEN
        completion := completion + 10;
    END IF;
    
    -- Update the profile
    UPDATE profiles SET completion_percentage = completion WHERE user_id = target_user_id;
    
    RETURN completion;
END;
$$ LANGUAGE plpgsql;

-- 7. Triggers for automatic updates

-- Trigger to update statistics when match is completed
CREATE OR REPLACE FUNCTION trigger_update_match_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update statistics for both players when match is completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        PERFORM update_profile_statistics(NEW.player1_id);
        PERFORM update_profile_statistics(NEW.player2_id);
        
        -- Add activities for match completion
        PERFORM add_user_activity(
            NEW.player1_id,
            'match',
            CASE WHEN NEW.winner_id = NEW.player1_id THEN 'Thắng trận đấu' ELSE 'Thua trận đấu' END,
            'Trận đấu với ' || (SELECT display_name FROM profiles WHERE user_id = NEW.player2_id),
            jsonb_build_object('opponent_id', NEW.player2_id, 'score_me', NEW.score_player1, 'score_opponent', NEW.score_player2, 'is_winner', NEW.winner_id = NEW.player1_id),
            'matches',
            NEW.id
        );
        
        PERFORM add_user_activity(
            NEW.player2_id,
            'match',
            CASE WHEN NEW.winner_id = NEW.player2_id THEN 'Thắng trận đấu' ELSE 'Thua trận đấu' END,
            'Trận đấu với ' || (SELECT display_name FROM profiles WHERE user_id = NEW.player1_id),
            jsonb_build_object('opponent_id', NEW.player1_id, 'score_me', NEW.score_player2, 'score_opponent', NEW.score_player1, 'is_winner', NEW.winner_id = NEW.player2_id),
            'matches',
            NEW.id
        );
        
        -- Award SPA points for winner
        IF NEW.winner_id IS NOT NULL THEN
            PERFORM add_spa_points_transaction(
                NEW.winner_id,
                50, -- Base win reward
                'match_win',
                'Thưởng thắng trận đấu',
                'matches',
                NEW.id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_match_completion ON matches;
CREATE TRIGGER trigger_match_completion
    AFTER UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_match_statistics();

-- Trigger to update completion percentage when profile is updated
CREATE OR REPLACE FUNCTION trigger_update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.completion_percentage := calculate_profile_completion(NEW.user_id);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profile_completion ON profiles;
CREATE TRIGGER trigger_profile_completion
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_profile_completion();

-- 8. Insert some default achievements
INSERT INTO achievement_definitions (id, name, description, category, spa_points_reward, badge_color) VALUES
('first_match', 'Trận đấu đầu tiên', 'Hoàn thành trận đấu đầu tiên', 'match', 25, 'bronze'),
('first_win', 'Chiến thắng đầu tiên', 'Giành chiến thắng trong trận đấu đầu tiên', 'match', 50, 'bronze'),
('win_streak_5', 'Chuỗi thắng 5', 'Thắng 5 trận liên tiếp', 'match', 100, 'silver'),
('win_streak_10', 'Chuỗi thắng 10', 'Thắng 10 trận liên tiếp', 'match', 200, 'gold'),
('matches_10', 'Kinh nghiệm', 'Hoàn thành 10 trận đấu', 'progression', 75, 'bronze'),
('matches_50', 'Người chơi thường xuyên', 'Hoàn thành 50 trận đấu', 'progression', 150, 'silver'),
('matches_100', 'Cao thủ', 'Hoàn thành 100 trận đấu', 'progression', 300, 'gold'),
('profile_complete', 'Hồ sơ hoàn thiện', 'Hoàn thành 100% thông tin hồ sơ', 'progression', 100, 'silver'),
('verified_rank', 'Xác minh hạng', 'Hoàn thành xác minh hạng đấu', 'progression', 150, 'gold')
ON CONFLICT (id) DO NOTHING;

-- 9. Initialize statistics for existing users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT user_id FROM profiles
    LOOP
        PERFORM update_profile_statistics(user_record.user_id);
        PERFORM calculate_profile_completion(user_record.user_id);
    END LOOP;
END $$;

-- 10. RLS Policies

-- Profile statistics policies
ALTER TABLE profile_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own statistics" 
ON profile_statistics FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' public statistics" 
ON profile_statistics FOR SELECT 
USING (true); -- All statistics are public for now

-- Activities policies
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activities" 
ON user_activities FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' public activities" 
ON user_activities FOR SELECT 
USING (is_public = true);

-- Achievements policies
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements" 
ON user_achievements FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' achievements" 
ON user_achievements FOR SELECT 
USING (true); -- Achievements are public

-- SPA points policies  
ALTER TABLE spa_points_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own SPA points history" 
ON spa_points_history FOR SELECT 
USING (auth.uid() = user_id);

-- Achievement definitions are public
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view achievement definitions" 
ON achievement_definitions FOR SELECT 
USING (true);

-- Add indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_statistics_user_id ON profile_statistics(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activities_user_created ON user_activities(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_spa_points_user_created ON spa_points_history(user_id, created_at DESC);
