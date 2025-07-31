-- Clean up orphaned wallets and try again
DELETE FROM wallet_transactions 
WHERE wallet_id IN (
    SELECT w.id FROM wallets w 
    LEFT JOIN profiles p ON w.user_id = p.user_id 
    WHERE p.user_id IS NULL
);

DELETE FROM wallets 
WHERE user_id NOT IN (SELECT user_id FROM profiles);

-- Now add the foreign key constraints again
-- 5. Wallet relationships
ALTER TABLE wallets ADD CONSTRAINT fk_wallets_user 
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
ALTER TABLE wallet_transactions ADD CONSTRAINT fk_wallet_transactions_wallet 
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE;

-- 6. Club relationships
ALTER TABLE club_profiles ADD CONSTRAINT fk_club_profiles_user 
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
ALTER TABLE memberships ADD CONSTRAINT fk_memberships_club 
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE;
ALTER TABLE memberships ADD CONSTRAINT fk_memberships_user 
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- 8. Player ranking relationships
ALTER TABLE player_rankings ADD CONSTRAINT fk_player_rankings_player 
    FOREIGN KEY (player_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
    
-- 9. SPA points log
ALTER TABLE spa_points_log ADD CONSTRAINT fk_spa_points_player 
    FOREIGN KEY (player_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- 10. User settings
ALTER TABLE user_settings ADD CONSTRAINT fk_user_settings_user 
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;