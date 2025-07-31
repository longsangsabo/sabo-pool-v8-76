
-- Add the missing increment_post_views function
CREATE OR REPLACE FUNCTION public.increment_post_views(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.posts 
    SET view_count = view_count + 1 
    WHERE id = post_id;
END;
$$;

-- Fix foreign key references to use profiles table instead of auth.users
ALTER TABLE challenges DROP CONSTRAINT challenges_challenger_id_fkey;
ALTER TABLE challenges DROP CONSTRAINT challenges_challenged_id_fkey;
ALTER TABLE challenges ADD CONSTRAINT challenges_challenger_id_fkey 
    FOREIGN KEY (challenger_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
ALTER TABLE challenges ADD CONSTRAINT challenges_challenged_id_fkey 
    FOREIGN KEY (challenged_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE challenge_history DROP CONSTRAINT challenge_history_player1_id_fkey;
ALTER TABLE challenge_history DROP CONSTRAINT challenge_history_player2_id_fkey;
ALTER TABLE challenge_history ADD CONSTRAINT challenge_history_player1_id_fkey 
    FOREIGN KEY (player1_id) REFERENCES profiles(user_id);
ALTER TABLE challenge_history ADD CONSTRAINT challenge_history_player2_id_fkey 
    FOREIGN KEY (player2_id) REFERENCES profiles(user_id);

ALTER TABLE posts DROP CONSTRAINT posts_author_id_fkey;
ALTER TABLE posts ADD CONSTRAINT posts_author_id_fkey 
    FOREIGN KEY (author_id) REFERENCES profiles(user_id);

ALTER TABLE user_activities DROP CONSTRAINT user_activities_user_id_fkey;
ALTER TABLE user_activities ADD CONSTRAINT user_activities_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(user_id);

ALTER TABLE notifications DROP CONSTRAINT notifications_user_id_fkey;
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE notification_preferences DROP CONSTRAINT notification_preferences_user_id_fkey;
ALTER TABLE notification_preferences ADD CONSTRAINT notification_preferences_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE user_follows DROP CONSTRAINT user_follows_follower_id_fkey;
ALTER TABLE user_follows DROP CONSTRAINT user_follows_following_id_fkey;
ALTER TABLE user_follows ADD CONSTRAINT user_follows_follower_id_fkey 
    FOREIGN KEY (follower_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
ALTER TABLE user_follows ADD CONSTRAINT user_follows_following_id_fkey 
    FOREIGN KEY (following_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE comments DROP CONSTRAINT comments_user_id_fkey;
ALTER TABLE comments ADD CONSTRAINT comments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE likes DROP CONSTRAINT likes_user_id_fkey;
ALTER TABLE likes ADD CONSTRAINT likes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE match_media DROP CONSTRAINT match_media_uploader_id_fkey;
ALTER TABLE match_media ADD CONSTRAINT match_media_uploader_id_fkey 
    FOREIGN KEY (uploader_id) REFERENCES profiles(user_id);
