-- Add more foreign key constraints for remaining tables

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

-- 7. Tournament relationships
ALTER TABLE tournament_registrations ADD CONSTRAINT fk_tournament_reg_tournament 
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
ALTER TABLE tournament_registrations ADD CONSTRAINT fk_tournament_reg_player 
    FOREIGN KEY (player_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- 8. Player ranking relationships
ALTER TABLE player_rankings ADD CONSTRAINT fk_player_rankings_player 
    FOREIGN KEY (player_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
    
-- 9. SPA points log
ALTER TABLE spa_points_log ADD CONSTRAINT fk_spa_points_player 
    FOREIGN KEY (player_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- 10. User settings
ALTER TABLE user_settings ADD CONSTRAINT fk_user_settings_user 
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;