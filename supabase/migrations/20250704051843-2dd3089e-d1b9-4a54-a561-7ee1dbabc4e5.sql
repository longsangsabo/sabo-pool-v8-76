-- Create sample posts to demonstrate the social feed
INSERT INTO public.posts (user_id, content, post_type, metadata) VALUES
(
  (SELECT id FROM auth.users LIMIT 1),
  'Chào mừng đến với STAGE 2! 🎉 Hệ thống social feed mới đã được ra mắt với đầy đủ tính năng theo dõi, like, comment và chia sẻ!',
  'text',
  '{}'::jsonb
),
(
  (SELECT id FROM auth.users LIMIT 1),
  'Vừa đạt được cột mốc 7 ngày check-in liên tiếp! 🔥 Giờ mỗi ngày nhận được 20 điểm thay vì 10!',
  'achievement',
  '{"achievement_type": "streak_7", "streak_days": 7}'::jsonb
),
(
  (SELECT id FROM auth.users LIMIT 1),
  'Hệ thống thách đấu và tìm bạn tập đã hoạt động! Ai muốn thử sức với mình không? 🎱',
  'text',
  '{}'::jsonb
);

-- Enable realtime for posts table
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;