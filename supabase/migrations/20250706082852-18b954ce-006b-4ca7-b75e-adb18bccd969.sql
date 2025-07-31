-- Manually clean up the specific orphaned wallet
DELETE FROM wallets WHERE user_id = 'ac5d6a91-8f41-4e88-8e5e-3ee154b23edb';

-- Now add the foreign key constraints one by one
ALTER TABLE wallets ADD CONSTRAINT fk_wallets_user 
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;