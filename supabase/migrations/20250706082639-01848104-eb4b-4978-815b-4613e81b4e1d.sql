-- Clean up orphaned data first
DELETE FROM notifications 
WHERE user_id NOT IN (SELECT user_id FROM profiles);

-- Now add the foreign key constraints
-- 1. Profile relationships
ALTER TABLE challenges ADD CONSTRAINT fk_challenges_challenger 
    FOREIGN KEY (challenger_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
ALTER TABLE challenges ADD CONSTRAINT fk_challenges_opponent 
    FOREIGN KEY (opponent_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- 2. Match relationships
ALTER TABLE matches ADD CONSTRAINT fk_matches_player1 
    FOREIGN KEY (player1_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
ALTER TABLE matches ADD CONSTRAINT fk_matches_player2 
    FOREIGN KEY (player2_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
ALTER TABLE matches ADD CONSTRAINT fk_matches_challenge 
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE SET NULL;

-- 3. Notification relationships
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user 
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_sender 
    FOREIGN KEY (sender_id) REFERENCES profiles(user_id) ON DELETE SET NULL;

-- 4. Post relationships
ALTER TABLE posts ADD CONSTRAINT fk_posts_user 
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
ALTER TABLE post_comments ADD CONSTRAINT fk_comments_post 
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;
ALTER TABLE post_comments ADD CONSTRAINT fk_comments_user 
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;