-- Cập nhật trạng thái giải đấu SABO1 thành ongoing
UPDATE tournaments 
SET status = 'ongoing',
    updated_at = NOW()
WHERE name = 'SABO1';