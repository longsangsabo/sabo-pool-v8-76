-- Sửa foreign key constraint của bảng wallets để không reference auth.users
-- Xóa constraint cũ và tạo lại mà không có foreign key

-- Xóa foreign key constraint hiện tại
ALTER TABLE public.wallets DROP CONSTRAINT IF EXISTS wallets_user_id_fkey;

-- Bảng wallets sẽ chỉ lưu user_id mà không cần foreign key reference
-- Vì chúng ta đang tạo fake users không có trong auth.users