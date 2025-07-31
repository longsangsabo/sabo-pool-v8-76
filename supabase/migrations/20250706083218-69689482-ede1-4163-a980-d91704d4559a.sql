-- Clean up the specific orphaned user from user_settings
DELETE FROM user_settings WHERE user_id = 'ac5d6a91-8f41-4e88-8e5e-3ee154b23edb';

-- Add the remaining foreign key constraints
ALTER TABLE user_settings ADD CONSTRAINT fk_user_settings_user 
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE club_profiles ADD CONSTRAINT fk_club_profiles_user 
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE player_rankings ADD CONSTRAINT fk_player_rankings_player 
    FOREIGN KEY (player_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE spa_points_log ADD CONSTRAINT fk_spa_points_player 
    FOREIGN KEY (player_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE rank_verifications ADD CONSTRAINT fk_rank_verifications_player 
    FOREIGN KEY (player_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
    
ALTER TABLE rank_verifications ADD CONSTRAINT fk_rank_verifications_club 
    FOREIGN KEY (club_id) REFERENCES club_profiles(id) ON DELETE CASCADE;