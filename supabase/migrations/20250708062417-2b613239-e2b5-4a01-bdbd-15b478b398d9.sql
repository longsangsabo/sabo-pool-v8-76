-- Xóa tất cả foreign key constraints liên quan đến user_id trong toàn bộ database
-- để đảm bảo fake users có thể được tạo mà không bị ràng buộc

-- Notification preferences
ALTER TABLE public.notification_preferences DROP CONSTRAINT IF EXISTS notification_preferences_user_id_fkey;
ALTER TABLE public.notification_preferences DROP CONSTRAINT IF EXISTS fk_notification_preferences_user;

-- Tất cả các bảng khác có thể có foreign key reference đến auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS fk_profiles_user;

-- Các bảng khác
ALTER TABLE public.spa_points_log DROP CONSTRAINT IF EXISTS spa_points_log_player_id_fkey;
ALTER TABLE public.user_achievements DROP CONSTRAINT IF EXISTS user_achievements_user_id_fkey;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE public.match_results DROP CONSTRAINT IF EXISTS match_results_player1_id_fkey;
ALTER TABLE public.match_results DROP CONSTRAINT IF EXISTS match_results_player2_id_fkey;

-- Disable triggers có thể tự động tạo notification_preferences
DROP TRIGGER IF EXISTS create_default_notification_preferences ON public.profiles;