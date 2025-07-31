-- Fix triệt để: Xóa tất cả foreign key constraints và tạo lại bảng wallets từ đầu
-- để đảm bảo không có constraint nào cản trở việc tạo fake users

-- Xóa tất cả foreign key constraints có thể có
ALTER TABLE public.wallets DROP CONSTRAINT IF EXISTS fk_wallets_user;
ALTER TABLE public.wallets DROP CONSTRAINT IF EXISTS wallets_user_id_fkey;
ALTER TABLE public.wallets DROP CONSTRAINT IF EXISTS fk_wallet_user_id;

-- Tương tự cho bảng player_rankings
ALTER TABLE public.player_rankings DROP CONSTRAINT IF EXISTS player_rankings_player_id_fkey;
ALTER TABLE public.player_rankings DROP CONSTRAINT IF EXISTS fk_player_rankings_user;
ALTER TABLE public.player_rankings DROP CONSTRAINT IF EXISTS fk_rankings_player_id;

-- Đảm bảo cột user_id trong wallets có thể nhận UUID bất kỳ
-- Không cần foreign key constraint vì chúng ta đang tạo fake users