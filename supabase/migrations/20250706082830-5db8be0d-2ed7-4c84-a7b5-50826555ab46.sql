-- Comprehensive cleanup of all orphaned data
DELETE FROM user_settings 
WHERE user_id NOT IN (SELECT user_id FROM profiles);

DELETE FROM user_streaks 
WHERE user_id NOT IN (SELECT user_id FROM profiles);

DELETE FROM reward_redemptions 
WHERE user_id NOT IN (SELECT user_id FROM profiles);

-- Clean up any remaining orphaned data
DELETE FROM player_availability 
WHERE user_id NOT IN (SELECT user_id FROM profiles);

DELETE FROM player_trust_scores 
WHERE player_id NOT IN (SELECT user_id FROM profiles);

DELETE FROM spa_points_log 
WHERE player_id NOT IN (SELECT user_id FROM profiles);

-- Now add the foreign keys that are safe
ALTER TABLE wallets ADD CONSTRAINT fk_wallets_user 
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
    
ALTER TABLE user_settings ADD CONSTRAINT fk_user_settings_user 
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE club_profiles ADD CONSTRAINT fk_club_profiles_user 
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE player_rankings ADD CONSTRAINT fk_player_rankings_player 
    FOREIGN KEY (player_id) REFERENCES profiles(user_id) ON DELETE CASCADE;