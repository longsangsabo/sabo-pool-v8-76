-- Xóa tất cả dữ liệu trong bảng challenges
DELETE FROM challenges;

-- Reset sequence nếu có
-- (Challenges sử dụng UUID nên không cần reset sequence)